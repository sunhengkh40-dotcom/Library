<?php

namespace App\Console\Commands;

use App\Models\Borrowing;
use App\Models\Fine;
use Carbon\Carbon;
use Illuminate\Console\Command;

class CheckOverdueBorrowings extends Command
{
    protected $signature = 'borrowings:check-overdue';
    protected $description = 'Mark overdue borrowings, update fine_amount, and auto-create/update fine records';

    // តម្លៃពិន័យក្នុងមួយថ្ងៃ (អាចផ្លាស់ប្តូរតាមតម្រូវការ ឬដាក់ក្នុង config/env)
    protected float $finePerDay = 0.50;

    public function handle()
    {
        $overdueBorrowings = Borrowing::where('status', 'borrowed')
            ->whereDate('due_date', '<', Carbon::today())
            ->get();

        if ($overdueBorrowings->isEmpty()) {
            $this->info('No overdue borrowings found.');
            return;
        }

        $count = 0;

        foreach ($overdueBorrowings as $borrowing) {
            $daysLate = Carbon::parse($borrowing->due_date)->diffInDays(Carbon::today());
            $amount = round($daysLate * $this->finePerDay, 2);

            // ១. ប្តូរ status ទៅ overdue និងធ្វើបច្ចុប្បន្នភាព fine_amount លើ borrowings
            $borrowing->update([
                'status'      => 'overdue',
                'fine_amount' => $amount,
            ]);

            // ២. បង្កើត ឬធ្វើបច្ចុប្បន្នភាព record ក្នុងតារាង fines
            $fine = Fine::where('borrowing_id', $borrowing->id)->first();

            if ($fine) {
                // បើមាន fine រួចហើយ ហើយស្ថានភាពនៅ unpaid ធ្វើបច្ចុប្បន្នភាព amount
                if ($fine->status === 'unpaid') {
                    $fine->update(['amount' => $amount]);
                }
            } else {
                Fine::create([
                    'borrowing_id' => $borrowing->id,
                    'amount'       => $amount,
                    'status'       => 'unpaid',
                ]);
            }

            $count++;
        }

        $this->info("Checked overdue borrowings. Updated: {$count}");
    }
}