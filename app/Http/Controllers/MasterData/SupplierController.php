<?php

namespace App\Http\Controllers\MasterData;

use App\Http\Controllers\Controller;
use App\Http\Requests\MasterData\SupplierRequest;
use App\Models\Supplier;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class SupplierController extends Controller
{
    public function index(Request $request): Response
    {
        $search = (string) $request->string('search')->trim();

        return Inertia::render('suppliers/index', [
            'suppliers' => Supplier::query()
                ->when($search, fn ($query) => $query->where(function ($query) use ($search) {
                    $query->where('code', 'like', "%{$search}%")
                        ->orWhere('name', 'like', "%{$search}%")
                        ->orWhere('contact_person', 'like', "%{$search}%")
                        ->orWhere('email', 'like', "%{$search}%");
                }))
                ->orderBy('name')
                ->paginate(10)
                ->withQueryString(),
            'filters' => ['search' => $search],
        ]);
    }

    public function store(SupplierRequest $request): RedirectResponse
    {
        Supplier::query()->create($request->validated());

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Supplier created successfully.']);

        return $this->redirectToIndex($request);
    }

    public function update(SupplierRequest $request, Supplier $supplier): RedirectResponse
    {
        $supplier->update($request->validated());

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Supplier updated successfully.']);

        return $this->redirectToIndex($request);
    }

    public function destroy(Request $request, Supplier $supplier): RedirectResponse
    {
        $supplier->delete();
        Inertia::flash('toast', ['type' => 'success', 'message' => 'Supplier deleted successfully.']);

        return $this->redirectToIndex($request);
    }

    private function redirectToIndex(Request $request): RedirectResponse
    {
        return to_route('suppliers.index', array_filter([
            'search' => $request->query('return_search'),
            'page' => $request->query('return_page'),
        ], fn (mixed $value): bool => filled($value)));
    }
}
