<?php

namespace App\Actions;

use App\Enums\PurchaseRequestStatus;
use App\Models\Product;
use App\Models\PurchaseRequest;
use App\Models\User;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class CreatePurchaseRequest
{
    public function __construct(private GenerateDocumentNumber $generateDocumentNumber) {}

    /** @param array{purpose: string, needed_at: string, items: list<array{product_id: int, quantity: string, notes: string|null}>} $data */
    public function handle(User $requester, array $data): PurchaseRequest
    {
        return DB::transaction(function () use ($requester, $data): PurchaseRequest {
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

            $year = now()->year;
            $purchaseRequest = PurchaseRequest::query()->create([
                'requester_id' => $requester->id,
                'reference' => $this->generateDocumentNumber->handle('purchase_request', 'PR', $year),
                'purpose' => $data['purpose'],
                'needed_at' => $data['needed_at'],
                'status' => PurchaseRequestStatus::Draft,
                'submitted_at' => null,
            ]);

            foreach ($data['items'] as $item) {
                $product = $products->get($item['product_id']);

                $purchaseRequest->items()->create([
                    'product_id' => $product->id,
                    'product_name' => $product->name,
                    'sku' => $product->sku,
                    'unit' => $product->unit,
                    'quantity' => $item['quantity'],
                    'notes' => Arr::get($item, 'notes'),
                ]);
            }

            return $purchaseRequest->load('items');
        });
    }
}
