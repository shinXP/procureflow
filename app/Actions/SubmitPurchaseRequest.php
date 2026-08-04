<?php

namespace App\Actions;

use App\Enums\PurchaseRequestStatus;
use App\Models\Product;
use App\Models\PurchaseRequest;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class SubmitPurchaseRequest
{
    public function handle(PurchaseRequest $purchaseRequest): PurchaseRequest
    {
        return DB::transaction(function () use ($purchaseRequest): PurchaseRequest {
            $lockedRequest = PurchaseRequest::query()
                ->with('items:id,purchase_request_id,product_id')
                ->lockForUpdate()
                ->findOrFail($purchaseRequest->id);

            if (! $lockedRequest->canBeSubmitted()) {
                throw ValidationException::withMessages([
                    'status' => 'Only draft or rejected purchase requests can be submitted.',
                ]);
            }

            if ($lockedRequest->needed_at->isBefore(today())) {
                throw ValidationException::withMessages([
                    'needed_at' => 'The date needed must be today or later before submitting.',
                ]);
            }

            if ($lockedRequest->items->isEmpty()) {
                throw ValidationException::withMessages([
                    'items' => 'Add at least one product before submitting.',
                ]);
            }

            $productIds = $lockedRequest->items->pluck('product_id')->unique();
            $activeProductIds = Product::query()
                ->whereIn('id', $productIds)
                ->where('is_active', true)
                ->orderBy('id')
                ->lockForUpdate()
                ->pluck('id');

            if ($productIds->diff($activeProductIds)->isNotEmpty()) {
                throw ValidationException::withMessages([
                    'items' => 'One or more products are no longer active. Edit the request before submitting.',
                ]);
            }

            $lockedRequest->update([
                'status' => PurchaseRequestStatus::Submitted,
                'submitted_at' => now(),
            ]);

            return $lockedRequest->refresh();
        });
    }
}
