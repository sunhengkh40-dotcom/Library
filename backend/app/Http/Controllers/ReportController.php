<?php

namespace App\Http\Controllers;

use App\Models\Book;
use App\Models\Borrowing;
use App\Models\Fine;
use Illuminate\Http\Request;
use Carbon\Carbon;

class ReportController extends Controller
{
    // GET /api/reports/stock
   public function stock(Request $request)
    {
        [$from, $to] = $this->resolveDateRange($request);
 
        $books = Book::with('category')->get();
 
        $list = $books->map(function ($book) {
            return [
                'id' => $book->id,
                'title' => $book->title,
                'category' => $book->category->name ?? '-',
                'total_stock' => $book->total_copies,
                'available' => $book->available_copies,
                'borrowed' => $book->total_copies - $book->available_copies,
                'added_at' => $book->created_at->toDateString(),
            ];
        });
 
        // សៀវភៅ (title) ដែលបង្កើតថ្មីក្នុងចន្លោះកាលបរិច្ឆេទ from-to
        $newBooks = $books->filter(function ($book) use ($from, $to) {
            $createdDate = $book->created_at->toDateString();
            return $createdDate >= $from && $createdDate <= $to;
        });
 
        $newBooksList = $newBooks->map(function ($book) {
            return [
                'id' => $book->id,
                'title' => $book->title,
                'category' => $book->category->name ?? '-',
                'total_stock' => $book->total_copies,
                'added_at' => $book->created_at->format('Y-m-d H:i'),
            ];
        })->values();
 
        return response()->json([
            'from' => $from,
            'to' => $to,
            'total_titles' => $list->count(),
            'total_stock' => $list->sum('total_stock'),
            'total_available' => $list->sum('available'),
            'total_borrowed' => $list->sum('borrowed'),
            'total_new_books' => $newBooksList->count(),
            'total_new_copies' => $newBooks->sum('total_copies'),
            'list' => $list->values(),
            'new_books' => $newBooksList,
        ]);
    }
    // GET /api/reports/borrowings?from=2026-08-01&to=2026-08-31
    public function borrowings(Request $request)
    {
        [$from, $to] = $this->resolveDateRange($request);

        $query = Borrowing::with(['book', 'member'])
            ->whereBetween('borrow_date', [$from, $to]);

        $borrowings = $query->get();

        return response()->json([
            'from' => $from,
            'to' => $to,
            'total_borrowings' => $borrowings->count(),
            'total_returned' => $borrowings->where('status', 'returned')->count(),
            'total_overdue' => $borrowings->where('status', 'overdue')->count(),
            'total_active' => $borrowings->where('status', 'borrowed')->count(),
            'list' => $borrowings->map(fn ($b) => [
                'id' => $b->id,
                'book' => $b->book->title ?? '-',
                'member' => $b->member->name ?? '-',
                'borrow_date' => $b->borrow_date,
                'due_date' => $b->due_date,
                'return_date' => $b->return_date,
                'status' => $b->status,
            ]),
        ]);
    }

    // GET /api/reports/fines?from=2026-08-01&to=2026-08-31
    public function fines(Request $request)
    {
        [$from, $to] = $this->resolveDateRange($request);

        $query = Fine::with(['borrowing.book', 'borrowing.member'])
            ->whereHas('borrowing', function ($q) use ($from, $to) {
                $q->whereBetween('borrow_date', [$from, $to]);
            });

        $fines = $query->get();

        return response()->json([
            'from' => $from,
            'to' => $to,
            'total_fines' => $fines->count(),
            'total_amount' => $fines->sum('amount'),
            'total_paid' => $fines->where('status', 'paid')->sum('amount'),
            'total_unpaid' => $fines->where('status', 'unpaid')->sum('amount'),
            'list' => $fines->map(fn ($f) => [
                'id' => $f->id,
                'book' => $f->borrowing->book->title ?? '-',
                'member' => $f->borrowing->member->name ?? '-',
                'amount' => $f->amount,
                'status' => $f->status,
                'created_at' => $f->created_at->toDateString(),
            ]),
        ]);
    }

    // Helper: គណនា from/to អាស្រ័យលើ period (daily/monthly) ឬ custom from-to
    private function resolveDateRange(Request $request): array
    {
        if ($request->filled('from') && $request->filled('to')) {
            return [$request->from, $request->to];
        }

        $period = $request->get('period', 'daily'); // daily | monthly

        if ($period === 'monthly') {
            return [
                Carbon::now()->startOfMonth()->toDateString(),
                Carbon::now()->endOfMonth()->toDateString(),
            ];
        }

        // default: daily (ថ្ងៃនេះ)
        return [
            Carbon::now()->toDateString(),
            Carbon::now()->toDateString(),
        ];
    }
}