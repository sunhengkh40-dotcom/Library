<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Fine extends Model
{
    //
    protected $fillable = ['borrowing_id','amount','status','paid_date'];

    public function borrowing()
    {
        return $this->belongsTo(Borrowing::class);
    }
}
