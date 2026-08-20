<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class MemberVisit extends Model
{
    use HasFactory;

    protected $fillable = [
        'member_id',
        'visit_date',
        'check_in_time',
        'check_out_time',
        'purpose',
        'notes',
    ];

    public function member()
    {
        return $this->belongsTo(Member::class);
    }

    // public function book()
    // {
    //     return $this->belongsTo(Book::class);
    // }
}