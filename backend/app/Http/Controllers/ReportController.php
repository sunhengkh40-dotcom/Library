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

        // ព្រឹត្តិការណ៍ក្នុងចន្លោះកាលបរិច្ឆេទ (ខ្ចី/សង ក្នុងអំឡុងពេលនោះ)
        $periodBorrowings = Borrowing::with(['book', 'member'])
            ->whereBetween('borrow_date', [$from, $to])
            ->get();

        // Overdue ជា "ស្ថានភាពបច្ចុប្បន្ន" — មិនគិតថាខ្ចីតាំងពីពេលណា
        // ដូច្នេះមិន filter តាម borrow_date ទេ ដើម្បីកុំឲ្យលាក់ record ចាស់ដែលនៅតែ overdue
        $overdueBorrowings = Borrowing::with(['book', 'member'])
            ->where('status', 'overdue')
            ->get();

        // បញ្ចូល overdue ចូល list ដោយមិនស្ទួន (បើ borrow_date របស់វាធ្លាក់ក្នុងចន្លោះស្រាប់)
        $combined = $periodBorrowings
            ->merge($overdueBorrowings)
            ->unique('id')
            ->values();

        return response()->json([
            'from' => $from,
            'to' => $to,
            // ✅ total_borrowings ឥឡូវរាប់បញ្ចូល overdue ទាំងអស់ដែរ
            // (ទោះ borrow_date របស់វាស្ថិតក្រៅចន្លោះកាលបរិច្ឆេទ ព្រោះគាត់នៅតែជាបំណុលសកម្ម)
            'total_borrowings' => $combined->count(),
            'total_returned' => $periodBorrowings->where('status', 'returned')->count(),
            'total_overdue' => $overdueBorrowings->count(),
            'total_active' => $combined->where('status', 'borrowed')->count(),
            'list' => $combined->map(fn ($b) => [
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

        // ត្រូវ filter តាមថ្ងៃដែល Fine ត្រូវបានបង្កើត (created_at)
        // មិនមែនតាម borrow_date របស់ borrowing ដែលទាក់ទងទេ ព្រោះ Fine ភាគច្រើន
        // កើតឡើងពេល "return យឺត" ដែលអាចយូរច្រើនថ្ងៃក្រោយ borrow_date ដើម
        $query = Fine::with(['borrowing.book', 'borrowing.member'])
            ->whereBetween('created_at', ["{$from} 00:00:00", "{$to} 23:59:59"]);

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