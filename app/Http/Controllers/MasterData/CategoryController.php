<?php

namespace App\Http\Controllers\MasterData;

use App\Http\Controllers\Controller;
use App\Http\Requests\MasterData\CategoryRequest;
use App\Models\Category;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class CategoryController extends Controller
{
    public function index(Request $request): Response
    {
        $search = (string) $request->string('search')->trim();

        return Inertia::render('categories/index', [
            'categories' => Category::query()
                ->withCount('products')
                ->when($search, function ($query) use ($search) {
                    $query->where(function ($query) use ($search) {
                        $query->where('name', 'like', "%{$search}%")
                            ->orWhere('description', 'like', "%{$search}%");
                    });
                })
                ->orderBy('name')
                ->paginate(10)
                ->withQueryString(),

            'filters' => [
                'search' => $search,
            ],
        ]);
    }

    public function store(CategoryRequest $request): RedirectResponse
    {
        Category::query()->create($request->validated());

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => 'Category created successfully.',
        ]);

        return $this->redirectToIndex($request);
    }

    public function update(
        CategoryRequest $request,
        Category $category
    ): RedirectResponse {
        $category->update($request->validated());

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => 'Category updated successfully.',
        ]);

        return $this->redirectToIndex($request);
    }

    public function destroy(Request $request, Category $category): RedirectResponse
    {
        if ($category->products()->exists()) {
            Inertia::flash('toast', [
                'type' => 'error',
                'message' => 'This category cannot be deleted because it contains products.',
            ]);

            return back();
        }

        $category->delete();

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => 'Category deleted successfully.',
        ]);

        return $this->redirectToIndex($request);
    }

    private function redirectToIndex(Request $request): RedirectResponse
    {
        return to_route('categories.index', array_filter([
            'search' => $request->query('return_search'),
            'page' => $request->query('return_page'),
        ], fn (mixed $value): bool => filled($value)));
    }
}
