<?php

namespace App\Http\Controllers;

use App\Models\Book;
use Illuminate\Http\Request;

class BookController extends Controller
{
    // GET /api/books
    public function index(Request $request)
    {
        $query = Book::with('category');

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('title', 'like', "%{$search}%")
                  ->orWhere('author', 'like', "%{$search}%")
                  ->orWhere('isbn', 'like', "%{$search}%");
            });
        }

        if ($request->filled('category_id')) {
            $query->where('category_id', $request->category_id);
        }

        $books = $query->latest()->paginate($request->get('per_page', 10));

        return response()->json([
            'total' => $books->total(),
            'list' => $books->items(),
        ]);
    }

    // POST /api/books
    public function store(Request $request)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'isbn' => 'required|string|max:50|unique:books,isbn',
            'author' => 'required|string|max:255',
            'category_id' => 'required|exists:categories,id',
            'publisher' => 'nullable|string|max:255',
            'published_year' => 'nullable|digits:4|integer|min:1000|max:' . date('Y'),
            'total_copies' => 'required|integer|min:1',
            'description' => 'nullable|string',
            'image' => 'nullable|image|max:2048', // max 2MB, must be an image file
        ]);

        $validated['available_copies'] = $validated['total_copies'];

        // ដក image ចេញពី $validated មុន create ព្រោះ Book table មិនមាន column ឈ្មោះ "image"
        // (column ពិតគឺ cover_image ដែលរក្សា path មិនមែន file ខ្លួនឯង)
        unset($validated['image']);

        if ($request->hasFile('image')) {
            $path = $request->file('image')->store('books', 'public');
            $validated['cover_image'] = $path;
        }

        $book = Book::create($validated);

        return response()->json([
            'message' => 'Book created successfully',
            'data' => $book->load('category'),
        ], 201);
    }

    // GET /api/books/{id}
    public function show($id)
    {
        $book = Book::with(['category', 'borrowings.member'])->findOrFail($id);

        return response()->json($book);
    }

    // PUT/PATCH /api/books/{id}
    // ចំណាំ: ពេល update ជាមួយ file upload ត្រូវប្រើ POST + _method=PUT (Laravel method spoofing)
    // ព្រោះ PHP មិន parse multipart/form-data ត្រឹមត្រូវសម្រាប់ PUT request ពិតប្រាកដ
    public function update(Request $request, $id)
    {
        $book = Book::findOrFail($id);

        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'isbn' => 'required|string|max:50|unique:books,isbn,' . $id,
            'author' => 'required|string|max:255',
            'category_id' => 'required|exists:categories,id',
            'publisher' => 'nullable|string|max:255',
            'published_year' => 'nullable|digits:4|integer|min:1000|max:' . date('Y'),
            'total_copies' => 'required|integer|min:1',
            'description' => 'nullable|string',
            'image' => 'nullable|image|max:2048',
        ]);

        unset($validated['image']);

        // Keep available_copies consistent if total_copies changes
        $diff = $validated['total_copies'] - $book->total_copies;
        $validated['available_copies'] = max(0, $book->available_copies + $diff);

        if ($request->hasFile('image')) {
            $path = $request->file('image')->store('books', 'public');
            $validated['cover_image'] = $path;
        }

        $book->update($validated);

        return response()->json([
            'message' => 'Book updated successfully',
            'data' => $book->load('category'),
        ]);
    }

    // DELETE /api/books/{id}
    public function destroy($id)
    {
        $book = Book::findOrFail($id);

        if ($book->borrowings()->where('status', 'borrowed')->exists()) {
            return response()->json([
                'message' => 'Cannot delete a book that is currently borrowed',
            ], 422);
        }

        $book->delete();

        return response()->json(['message' => 'Book deleted successfully']);
    }
}