<?php

namespace App\Http\Controllers\MasterData;

use App\Http\Controllers\Controller;
use App\Http\Requests\MasterData\ProductRequest;
use App\Models\Category;
use App\Models\Product;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class ProductController extends Controller
{
    public function index(Request $request): Response
    {
        $search = (string) $request->string('search')->trim();
        $categoryId = $request->integer('category_id');

        return Inertia::render('products/index', [
            'products' => Product::query()
                ->with('category:id,name')
                ->when($search, fn ($query) => $query->where(function ($query) use ($search) {
                    $query->where('sku', 'like', "%{$search}%")
                        ->orWhere('name', 'like', "%{$search}%")
                        ->orWhere('description', 'like', "%{$search}%");
                }))
                ->when($categoryId > 0, fn ($query) => $query->where('category_id', $categoryId))
                ->orderBy('name')
                ->paginate(10)
                ->withQueryString(),
            'categories' => Category::query()->orderBy('name')->get(['id', 'name', 'is_active']),
            'filters' => ['search' => $search, 'category_id' => $categoryId ?: null],
        ]);
    }

    public function store(ProductRequest $request): RedirectResponse
    {
        $data = Arr::except($request->validated(), 'image');

        if ($request->hasFile('image')) {
            $data['image_path'] = $request->file('image')->store('products', 'public');
        }

        Product::query()->create($data);

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Product created successfully.']);

        return $this->redirectToIndex($request);
    }

    public function update(ProductRequest $request, Product $product): RedirectResponse
    {
        $data = Arr::except($request->validated(), 'image');
        $oldImagePath = $product->image_path;

        if ($request->hasFile('image')) {
            $data['image_path'] = $request->file('image')->store('products', 'public');
        }

        $product->update($data);

        if (isset($data['image_path']) && $oldImagePath) {
            Storage::disk('public')->delete($oldImagePath);
        }

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Product updated successfully.']);

        return $this->redirectToIndex($request);
    }

    public function destroy(Request $request, Product $product): RedirectResponse
    {
        if ($product->purchaseRequestItems()->exists()) {
            Inertia::flash('toast', [
                'type' => 'error',
                'message' => 'This product cannot be deleted because it is used in a purchase request.',
            ]);

            return back();
        }

        if ($product->image_path) {
            Storage::disk('public')->delete($product->image_path);
        }

        $product->delete();
        Inertia::flash('toast', ['type' => 'success', 'message' => 'Product deleted successfully.']);

        return $this->redirectToIndex($request);
    }

    private function redirectToIndex(Request $request): RedirectResponse
    {
        return to_route('products.index', array_filter([
            'search' => $request->query('return_search'),
            'category_id' => $request->query('return_category_id'),
            'page' => $request->query('return_page'),
        ], fn (mixed $value): bool => filled($value)));
    }
}
