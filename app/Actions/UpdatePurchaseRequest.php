<?php

namespace App\Actions;

use App\Enums\PurchaseRequestStatus;
use App\Models\Product;
use App\Models\PurchaseRequest;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class UpdatePurchaseRequest
{
    /** @param array{purpose: string, needed_at: string, items: list<array{product_id: int, quantity: string, notes: string|null}>} $data */
    public function handle(PurchaseRequest $purchaseRequest, array $data): PurchaseRequest
    {
        return DB::transaction(function () use ($purchaseRequest, $data): PurchaseRequest {
            $lockedRequest = PurchaseRequest::query()
                ->lockForUpdate()
                ->findOrFail($purchaseRequest->id);

            if (! $lockedRequest->canBeEdited()) {
                throw ValidationException::withMessages([
                    'status' => 'Only draft or rejected purchase requests can be edited.',
                ]);
            }

            $productIds = collect($data['items'])->pluck('product_id');
            $products = Product::query()
                ->whereIn('id', $productIds)
                ->where('is_active', true)
                ->orderBy('id')
                ->lockForUpdate()
                ->get()
                ->keyBy('id');

            if ($products->count() !== $productIds->unique()->count()) {
                throw ValidationException::withMessages([
                    'items' => 'One or more selected products are unavailable.',
                ]);
            }

            $lockedRequest->update([
                'purpose' => $data['purpose'],
                'needed_at' => $data['needed_at'],
                'status' => PurchaseRequestStatus::Draft,
                'submitted_at' => null,
            ]);

            $lockedRequest->items()->delete();

            foreach ($data['items'] as $item) {
                $product = $products->get($item['product_id']);

                $lockedRequest->items()->create([
                    'product_id' => $product->id,
                    'product_name' => $product->name,
                    'sku' => $product->sku,
                    'unit' => $product->unit,
                    'quantity' => $item['quantity'],
                    'notes' => Arr::get($item, 'notes'),
                ]);
            }

            return $lockedRequest->load('items');
        });
    }
}
