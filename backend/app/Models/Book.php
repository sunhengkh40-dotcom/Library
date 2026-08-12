<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Book extends Model
{
    //
    protected $fillable = [
        'title','isbn','author','category_id','publisher',
        'published_year','total_copies','available_copies',
        'cover_image','description'
    ];

    public function category()
    {
        return $this->belongsTo(Category::class);
    }

    public function borrowings()
    {
        return $this->hasMany(Borrowing::class);
    }
    public function borrowingDetails()
    {
        return $this->hasMany(BorrowingDetail::class);
    }
}
