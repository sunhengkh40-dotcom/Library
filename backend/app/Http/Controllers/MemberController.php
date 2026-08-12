<?php

namespace App\Http\Controllers;

use App\Models\Member;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class MemberController extends Controller
{
    // GET /api/members
    public function index(Request $request)
    {
        $query = Member::query();
 
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('member_code', 'like', "%{$search}%")
                  ->orWhere('phone', 'like', "%{$search}%");
            });
        }
 
        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }
 
        $members = $query->withCount('borrowings')->latest()->paginate($request->get('per_page', 10));
 
        return response()->json([
            'total' => $members->total(),
            'list' => $members->items(),
        ]);
    }
 
    // POST /api/members
    public function store(Request $request)
    {
        $validated = $request->validate([
            'user_id' => 'nullable|exists:users,id',
            'name' => 'required|string|max:255',
            'email' => 'nullable|email|max:255',
            'phone' => 'nullable|string|max:50',
            'address' => 'nullable|string|max:255',
            'status' => 'nullable|in:active,suspended',
        ]);
 
        // Auto-generate member_code e.g. MB0001
        $last = Member::orderByDesc('id')->first();
        $nextNumber = $last ? ((int) substr($last->member_code, 2)) + 1 : 1;
        $validated['member_code'] = 'MB' . str_pad($nextNumber, 4, '0', STR_PAD_LEFT);
        $validated['status'] = $validated['status'] ?? 'active';
 
        $member = Member::create($validated);
 
        return response()->json([
            'message' => 'Member created successfully',
            'data' => $member,
        ], 201);
    }
 
    // GET /api/members/{id}
    public function show($id)
    {
        $member = Member::with(['borrowings.book'])->findOrFail($id);
 
        return response()->json($member);
    }
 
    // PUT/PATCH /api/members/{id}
    public function update(Request $request, $id)
    {
        $member = Member::findOrFail($id);
 
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'nullable|email|max:255',
            'phone' => 'nullable|string|max:50',
            'address' => 'nullable|string|max:255',
            'status' => 'required|in:active,suspended',
        ]);
 
        $member->update($validated);
 
        return response()->json([
            'message' => 'Member updated successfully',
            'data' => $member,
        ]);
    }
 
    // DELETE /api/members/{id}
    public function destroy($id)
    {
        $member = Member::findOrFail($id);
 
        if ($member->borrowings()->where('status', 'borrowed')->exists()) {
            return response()->json([
                'message' => 'Cannot delete a member with active borrowings',
            ], 422);
        }
 
        $member->delete();
 
        return response()->json(['message' => 'Member deleted successfully']);
    }
}
