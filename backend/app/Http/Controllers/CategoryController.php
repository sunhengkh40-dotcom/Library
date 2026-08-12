<?php

namespace App\Http\Controllers;

use App\Models\Category;
use Illuminate\Http\Request;

class CategoryController extends Controller
{
    public function index(Request $request)
    {
        $query = Category::query();
 
        if ($request->filled('search')) {
            $query->where('name', 'like', '%' . $request->search . '%');
        }
 
        $categories = $query->withCount('books')->paginate($request->get('per_page', 10));
 
        return response()->json([
            'total' => $categories->total(),
            'list' => $categories->items(),
        ]);
    }
 
    // POST /api/categories
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'slug' => 'required|string|max:255|unique:categories,slug',
        ]);
 
        $category = Category::create($validated);
 
        return response()->json([
            'message' => 'Category created successfully',
            'data' => $category,
        ], 201);
    }
 
    // GET /api/categories/{id}
    public function show($id)
    {
        $category = Category::withCount('books')->findOrFail($id);
 
        return response()->json($category);
    }
 
    // PUT/PATCH /api/categories/{id}
    public function update(Request $request, $id)
    {
        $category = Category::findOrFail($id);
 
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'slug' => 'required|string|max:255|unique:categories,slug,' . $id,
        ]);
 
        $category->update($validated);
 
        return response()->json([
            'message' => 'Category updated successfully',
            'data' => $category,
        ]);
    }
 
    // DELETE /api/categories/{id}
    public function destroy($id)
    {
        $category = Category::findOrFail($id);
 
        if ($category->books()->exists()) {
            return response()->json([
                'message' => 'Cannot delete category that still has books assigned',
            ], 422);
        }
 
        $category->delete();
 
        return response()->json(['message' => 'Category deleted successfully']);
    }
}
