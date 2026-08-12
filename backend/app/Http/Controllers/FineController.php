<?php

namespace App\Http\Controllers;

use App\Models\Fine;
use Illuminate\Http\Request;

class FineController extends Controller
{
    // GET /api/fines
    public function index(Request $request)
    {
        $query = Fine::with('borrowing.book', 'borrowing.member');
 
        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }
 
        $fines = $query->latest()->paginate($request->get('per_page', 10));
 
        return response()->json([
            'total' => $fines->total(),
            'list' => $fines->items(),
        ]);
    }
 
    // POST /api/fines -> usually auto-created on return, but allow manual creation too
    public function store(Request $request)
    {
        $validated = $request->validate([
            'borrowing_id' => 'required|exists:borrowings,id|unique:fines,borrowing_id',
            'amount' => 'required|numeric|min:0',
            'status' => 'nullable|in:unpaid,paid',
        ]);
 
        $validated['status'] = $validated['status'] ?? 'unpaid';
 
        $fine = Fine::create($validated);
 
        return response()->json([
            'message' => 'Fine created successfully',
            'data' => $fine->load('borrowing'),
        ], 201);
    }
 
    // GET /api/fines/{id}
    public function show($id)
    {
        $fine = Fine::with('borrowing.book', 'borrowing.member')->findOrFail($id);
 
        return response()->json($fine);
    }
 
    // PUT/PATCH /api/fines/{id} -> mark as paid/unpaid
    public function update(Request $request, $id)
    {
        $fine = Fine::findOrFail($id);
 
        $validated = $request->validate([
            'amount' => 'required|numeric|min:0',
            'status' => 'required|in:unpaid,paid',
        ]);
 
        $validated['paid_date'] = $validated['status'] === 'paid' ? now()->toDateString() : null;
 
        $fine->update($validated);
 
        return response()->json([
            'message' => 'Fine updated successfully',
            'data' => $fine,
        ]);
    }
 
    // DELETE /api/fines/{id}
    public function destroy($id)
    {
        $fine = Fine::findOrFail($id);
        $fine->delete();
 
        return response()->json(['message' => 'Fine deleted successfully']);
    }
}
