<?php

namespace App\Http\Controllers;

use App\Actions\DecidePurchaseRequest;
use App\Enums\PurchaseRequestDecisionType;
use App\Enums\PurchaseRequestStatus;
use App\Http\Requests\ApprovePurchaseRequestRequest;
use App\Http\Requests\RejectPurchaseRequestRequest;
use App\Models\PurchaseRequest;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

class PurchaseRequestApprovalController extends Controller
{
    public function index(Request $request): Response
    {
        Gate::authorize('reviewAny', PurchaseRequest::class);

        $user = $request->user();
        $search = (string) $request->string('search')->trim();
        $reviewStatuses = [
            PurchaseRequestStatus::Submitted,
            PurchaseRequestStatus::Approved,
            PurchaseRequestStatus::Rejected,
            PurchaseRequestStatus::ConvertedToPurchaseOrder,
        ];
        $status = PurchaseRequestStatus::tryFrom(
            $request->string('status')->toString(),
        );

        if ($status !== null && ! in_array($status, $reviewStatuses, true)) {
            $status = null;
        }

        $statusValues = array_map(
            fn (PurchaseRequestStatus $option): string => $option->value,
            $reviewStatuses,
        );
        $reviewRequests = PurchaseRequest::query()
            ->whereIn('status', $statusValues);
        $statusCounts = (clone $reviewRequests)
            ->selectRaw('status, COUNT(*) as aggregate')
            ->groupBy('status')
            ->pluck('aggregate', 'status')
            ->map(fn (mixed $count): int => (int) $count)
            ->all();

        return Inertia::render('approvals/index', [
            'purchaseRequests' => (clone $reviewRequests)
                ->with([
                    'requester:id,name,email,avatar_path',
                    'items:id,purchase_request_id,product_id,product_name,sku,unit,quantity,notes',
                    'items.product:id,image_path',
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
                ->orderByRaw(
                    'CASE WHEN status = ? THEN 0 ELSE 1 END',
                    [PurchaseRequestStatus::Submitted->value],
                )
                ->latest('submitted_at')
                ->latest('id')
                ->paginate(10)
                ->withQueryString()
                ->through(fn (PurchaseRequest $purchaseRequest): array => [
                    ...$purchaseRequest->toArray(),
                    'can' => [
                        'decide' => $user->can('decide', $purchaseRequest),
                    ],
                ]),
            'filters' => [
                'search' => $search,
                'status' => $status?->value,
            ],
            'counts' => collect($reviewStatuses)
                ->mapWithKeys(fn (PurchaseRequestStatus $option): array => [
                    $option->value => $statusCounts[$option->value] ?? 0,
                ])
                ->all(),
        ]);
    }

    public function approve(
        ApprovePurchaseRequestRequest $request,
        PurchaseRequest $purchaseRequest,
        DecidePurchaseRequest $decidePurchaseRequest,
    ): RedirectResponse {
        $decidePurchaseRequest->handle(
            $purchaseRequest,
            $request->user(),
            PurchaseRequestDecisionType::Approved,
            $request->remarks(),
        );

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => "Purchase request {$purchaseRequest->reference} approved.",
        ]);

        return $this->redirectToIndex($request);
    }

    public function reject(
        RejectPurchaseRequestRequest $request,
        PurchaseRequest $purchaseRequest,
        DecidePurchaseRequest $decidePurchaseRequest,
    ): RedirectResponse {
        $decidePurchaseRequest->handle(
            $purchaseRequest,
            $request->user(),
            PurchaseRequestDecisionType::Rejected,
            $request->remarks(),
        );

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => "Purchase request {$purchaseRequest->reference} rejected.",
        ]);

        return $this->redirectToIndex($request);
    }

    private function redirectToIndex(Request $request): RedirectResponse
    {
        return to_route('approvals.index', array_filter([
            'search' => $request->input('return_search'),
            'status' => $request->input('return_status'),
            'page' => $request->input('return_page'),
        ], fn (mixed $value): bool => filled($value)));
    }
}
