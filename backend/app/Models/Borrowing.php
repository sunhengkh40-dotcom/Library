<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Borrowing extends Model
{
    //
    protected $fillable = ['book_id','member_id','borrow_date','due_date','return_date','status','fine_amount'];

    public function book()
    {
        return $this->belongsTo(Book::class);
    }

    public function member()
    {
        return $this->belongsTo(Member::class);
    }

    public function fine()
    {
        return $this->hasOne(Fine::class);
    }

    public function details()
    {
        return $this->hasMany(BorrowingDetail::class);
    }
    // public function details()
    // {
    //     return $this->hasMany(BorrowingDetail::class);
    // }
}
