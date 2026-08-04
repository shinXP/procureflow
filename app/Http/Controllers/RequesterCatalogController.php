<?php

namespace App\Http\Controllers;

use App\Models\Category;
use App\Models\Product;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class RequesterCatalogController extends Controller
{
    public function __invoke(Request $request): Response
    {
        $search = (string) $request->string('search')->trim();
        $categoryId = $request->integer('category_id');

        return Inertia::render('catalog/index', [
            'products' => Product::query()
                ->with('category:id,name')
                ->where('is_active', true)
                ->when($search, fn ($query) => $query->where(function ($query) use ($search) {
                    $query->where('sku', 'like', "%{$search}%")
                        ->orWhere('name', 'like', "%{$search}%")
                        ->orWhere('description', 'like', "%{$search}%");
                }))
                ->when($categoryId > 0, fn ($query) => $query->where('category_id', $categoryId))
                ->orderBy('name')
                ->paginate(12)
                ->withQueryString(),
            'categories' => Category::query()
                ->where('is_active', true)
                ->orderBy('name')
                ->get(['id', 'name']),
            'filters' => ['search' => $search, 'category_id' => $categoryId ?: null],
        ]);
    }
}
