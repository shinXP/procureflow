<?php

namespace App\Http\Controllers;

use App\Actions\CreatePurchaseRequest;
use App\Actions\DeletePurchaseRequest;
use App\Actions\SubmitPurchaseRequest;
use App\Actions\UpdatePurchaseRequest;
use App\Enums\PurchaseRequestStatus;
use App\Enums\UserRole;
use App\Http\Requests\StorePurchaseRequestRequest;
use App\Http\Requests\SubmitPurchaseRequestRequest;
use App\Http\Requests\UpdatePurchaseRequestRequest;
use App\Models\Product;
use App\Models\PurchaseRequest;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

class PurchaseRequestController extends Controller
{
    public function index(Request $request): Response
    {
        Gate::authorize('viewAny', PurchaseRequest::class);

        $user = $request->user();
        $search = (string) $request->string('search')->trim();
        $status = PurchaseRequestStatus::tryFrom(
            $request->string('status')->toString(),
        );

        $scopedRequests = PurchaseRequest::query()
            ->when(
                ! $user->hasRole(UserRole::Administrator),
                fn ($query) => $query->whereBelongsTo($user, 'requester'),
            );

        $statusCounts = (clone $scopedRequests)
            ->selectRaw('status, COUNT(*) as aggregate')
            ->groupBy('status')
            ->pluck('aggregate', 'status')
            ->map(fn (mixed $count): int => (int) $count)
            ->all();

        return Inertia::render('purchase-requests/index', [
            'purchaseRequests' => (clone $scopedRequests)
                ->with([
                    'requester:id,name,email,avatar_path',
                    'items:id,purchase_request_id,product_id,product_name,sku,unit,quantity,notes',
                    'decisions:id,purchase_request_id,decision,remarks,decided_by,decided_at,created_at,updated_at',
                    'decisions.reviewer:id,name,email,avatar_path',
                ])
                ->withCount('items')
                ->when($search, fn ($query) => $query->where(function ($query) use ($search) {
                    $query->where('reference', 'like', "%{$search}%")
                        ->orWhere('purpose', 'like', "%{$search}%")
                        ->orWhereHas('requester', fn ($query) => $query
                            ->where('name', 'like', "%{$search}%")
                            ->orWhere('email', 'like', "%{$search}%"));
                }))
                ->when($status, fn ($query) => $query->where('status', $status))
                ->latest('created_at')
                ->latest('id')
                ->paginate(10)
                ->withQueryString()
                ->through(fn (PurchaseRequest $purchaseRequest): array => [
                    ...$purchaseRequest->toArray(),
                    'can' => [
                        'update' => $user->can('update', $purchaseRequest),
                        'delete' => $user->can('delete', $purchaseRequest),
                        'submit' => $user->can('submit', $purchaseRequest),
                    ],
                ]),
            'products' => Product::query()
                ->with('category:id,name')
                ->where('is_active', true)
                ->orderBy('name')
                ->get([
                    'id',
                    'category_id',
                    'sku',
                    'name',
                    'description',
                    'image_path',
                    'unit',
                    'reorder_level',
                    'is_active',
                    'created_at',
                    'updated_at',
                ]),
            'filters' => [
                'search' => $search,
                'status' => $status?->value,
            ],
            'isAdministrator' => $user->hasRole(UserRole::Administrator),
            'counts' => [
                ...collect(PurchaseRequestStatus::cases())
                    ->mapWithKeys(fn (PurchaseRequestStatus $option): array => [
                        $option->value => $statusCounts[$option->value] ?? 0,
                    ])
                    ->all(),
            ],
        ]);
    }

    public function store(StorePurchaseRequestRequest $request, CreatePurchaseRequest $createPurchaseRequest): RedirectResponse
    {
        $purchaseRequest = $createPurchaseRequest->handle($request->user(), $request->payload());

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => "Purchase request {$purchaseRequest->reference} saved as a draft.",
        ]);

        return $this->redirectToIndex($request);
    }

    public function update(
        UpdatePurchaseRequestRequest $request,
        PurchaseRequest $purchaseRequest,
        UpdatePurchaseRequest $updatePurchaseRequest,
    ): RedirectResponse {
        $purchaseRequest = $updatePurchaseRequest->handle($purchaseRequest, $request->payload());

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => "Purchase request {$purchaseRequest->reference} updated.",
        ]);

        return $this->redirectToIndex($request);
    }

    public function submit(
        SubmitPurchaseRequestRequest $request,
        PurchaseRequest $purchaseRequest,
        SubmitPurchaseRequest $submitPurchaseRequest,
    ): RedirectResponse {
        $purchaseRequest = $submitPurchaseRequest->handle($purchaseRequest);

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => "Purchase request {$purchaseRequest->reference} submitted.",
        ]);

        return $this->redirectToIndex($request);
    }

    public function destroy(
        Request $request,
        PurchaseRequest $purchaseRequest,
        DeletePurchaseRequest $deletePurchaseRequest,
    ): RedirectResponse {
        Gate::authorize('delete', $purchaseRequest);

        $reference = $purchaseRequest->reference;
        $deletePurchaseRequest->handle($purchaseRequest);

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => "Purchase request {$reference} deleted.",
        ]);

        return $this->redirectToIndex($request);
    }

    private function redirectToIndex(Request $request): RedirectResponse
    {
        return to_route('purchase-requests.index', array_filter([
            'search' => $request->input('return_search'),
            'status' => $request->input('return_status'),
            'page' => $request->input('return_page'),
        ], fn (mixed $value): bool => filled($value)));
    }
}
