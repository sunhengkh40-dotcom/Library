<?php

namespace App\Http\Controllers;

use App\Models\Book;
use App\Models\Borrowing;
use App\Models\Fine;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class BorrowingController extends Controller
{
    // GET /api/borrowings
    public function index(Request $request)
    {
        $query = Borrowing::with(['book', 'member', 'fine']); // ← បន្ថែម 'fine'
    
        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }
    
        if ($request->filled('member_id')) {
            $query->where('member_id', $request->member_id);
        }
    
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->whereHas('book', fn ($bq) => $bq->where('title', 'like', "%{$search}%"))
                ->orWhereHas('member', fn ($mq) => $mq->where('name', 'like', "%{$search}%"));
            });
        }
    
        $borrowings = $query->latest()->paginate($request->get('per_page', 10));
    
        return response()->json([
            'total' => $borrowings->total(),
            'list' => $borrowings->items(),
        ]);
    }

    // POST /api/borrowings -> create a new borrow record (checkout a book)
    public function store(Request $request)
    {
        $validated = $request->validate([
            'book_id' => 'required|exists:books,id',
            'member_id' => 'required|exists:members,id',
            'due_date' => 'nullable|date|after:today',
        ]);

        return DB::transaction(function () use ($validated) {
            $book = Book::lockForUpdate()->findOrFail($validated['book_id']);

            if ($book->available_copies < 1) {
                return response()->json([
                    'message' => 'No copies available for this book',
                ], 422);
            }

            $borrowing = Borrowing::create([
                'book_id' => $book->id,
                'member_id' => $validated['member_id'],
                'borrow_date' => now()->toDateString(),
                'due_date' => $validated['due_date'] ?? now()->addDays(14)->toDateString(),
                'status' => 'borrowed',
            ]);

            $book->decrement('available_copies');

            return response()->json([
                'message' => 'Book borrowed successfully',
                'data' => $borrowing->load(['book', 'member']),
            ], 201);
        });
    }

    // GET /api/borrowings/{id}
    public function show($id)
    {
        $borrowing = Borrowing::with(['book', 'member', 'fine'])->findOrFail($id);

        return response()->json($borrowing);
    }

    // PUT/PATCH /api/borrowings/{id} -> update due date / status manually
    public function update(Request $request, $id)
    {
        $borrowing = Borrowing::findOrFail($id);

        $validated = $request->validate([
            'due_date' => 'required|date',
            'status' => 'required|in:borrowed,returned,overdue,lost',
        ]);

        $borrowing->update($validated);

        return response()->json([
            'message' => 'Borrowing updated successfully',
            'data' => $borrowing->load(['book', 'member']),
        ]);
    }

    // POST /api/borrowings/{id}/return -> mark as returned, restore stock, calc fine
    public function returnBook($id)
    {
        return DB::transaction(function () use ($id) {
            $borrowing = Borrowing::with('book')->lockForUpdate()->findOrFail($id);

            if ($borrowing->status === 'returned') {
                return response()->json(['message' => 'This book was already returned'], 422);
            }

            $today = now();
            $dueDate = $borrowing->due_date;
            $lateDays = $today->gt($dueDate) ? $today->diffInDays($dueDate) : 0;
            $fineAmount = $lateDays * 0.50; // 0.50 per late day, adjust as needed

            $borrowing->update([
                'return_date' => $today->toDateString(),
                'status' => 'returned',
                'fine_amount' => $fineAmount,
            ]);

            $borrowing->book->increment('available_copies');

            if ($fineAmount > 0) {
                Fine::create([
                    'borrowing_id' => $borrowing->id,
                    'amount' => $fineAmount,
                    'status' => 'unpaid',
                ]);
            }

            return response()->json([
                'message' => 'Book returned successfully',
                'data' => $borrowing->load(['book', 'member', 'fine']),
            ]);
        });
    }

    // DELETE /api/borrowings/{id}
    public function destroy($id)
    {
        $borrowing = Borrowing::findOrFail($id);

        if ($borrowing->status === 'borrowed') {
            return response()->json([
                'message' => 'Cannot delete an active borrowing. Return the book first.',
            ], 422);
        }

        $borrowing->delete();

        return response()->json(['message' => 'Borrowing record deleted successfully']);
    }
}