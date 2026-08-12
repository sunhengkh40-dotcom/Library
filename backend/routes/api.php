<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

use App\Http\Controllers\CategoryController;
use App\Http\Controllers\BookController;
use App\Http\Controllers\MemberController;
use App\Http\Controllers\BorrowingController;
use App\Http\Controllers\FineController;
use App\Http\Controllers\UserController;


// ================ Public routes មិនត្រូវការ Login ​================
Route::post('/register', [UserController::class, 'register']);
Route::post('/login', [UserController::class, 'login']);

// ================ Protected routes ត្រូវការ Login ================
Route::middleware('auth:sanctum')->group(function () {

    Route::post('/logout', [UserController::class, 'logout']);
    Route::get('/user', [UserController::class, 'me']);

    Route::apiResources([
        'categories' => CategoryController::class,
        'books' => BookController::class,
        'members' => MemberController::class,
        'borrowings' => BorrowingController::class,
        'fines' => FineController::class,
        'users' => UserController::class,
 
    ]);

    Route::post('/borrowings/{id}/return', [BorrowingController::class, 'returnBook']);

});