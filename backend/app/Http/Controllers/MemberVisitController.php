<?php

namespace App\Http\Controllers;

use App\Models\MemberVisit;
use Illuminate\Http\Request;

class MemberVisitController extends Controller
{
    // GET /api/members/{memberId}/visits
    public function index($memberId)
    {
        $visits = MemberVisit::with('book')
            ->where('member_id', $memberId)
            ->orderByDesc('visit_date')
            ->orderByDesc('id')
            ->get();

        return response()->json([
            'total' => $visits->count(),
            'list' => $visits,
        ]);
    }

    // POST /api/members/{memberId}/visits
    public function store(Request $request, $memberId)
    {
        $validated = $request->validate([
            // 'book_id' => 'nullable|exists:books,id',
            'visit_date' => 'required|date',
            'check_in_time' => 'nullable|date_format:H:i',
            'check_out_time' => 'nullable|date_format:H:i|after:check_in_time',
            'purpose' => 'required|in:reading,study,research,other',
            'notes' => 'nullable|string|max:500',
        ]);

        $validated['member_id'] = $memberId;

        $visit = MemberVisit::create($validated);

        return response()->json([
            'message' => 'Visit recorded successfully',
            'data' => $visit->load('book'),
        ], 201);
    }

    // DELETE /api/visits/{id}
    public function destroy($id)
    {
        $visit = MemberVisit::findOrFail($id);
        $visit->delete();

        return response()->json(['message' => 'Visit record deleted successfully']);
    }
}