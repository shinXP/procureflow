<?php

namespace App\Http\Requests;

use App\Models\Product;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

abstract class PurchaseRequestFormRequest extends FormRequest
{
    protected function prepareForValidation(): void
    {
        $rawItems = $this->input('items');
        $items = is_array($rawItems)
            ? array_map(function (mixed $item): mixed {
                if (! is_array($item)) {
                    return $item;
                }

                return [
                    ...$item,
                    'notes' => filled($item['notes'] ?? null)
                        ? trim((string) $item['notes'])
                        : null,
                ];
            }, $rawItems)
            : [];

        $this->merge([
            'purpose' => trim((string) $this->input('purpose')),
            'needed_at' => trim((string) $this->input('needed_at')),
            'items' => $items,
        ]);
    }

    /** @return array<string, array<int, mixed>> */
    public function rules(): array
    {
        return [
            'purpose' => ['required', 'string', 'max:2000'],
            'needed_at' => ['required', 'date_format:Y-m-d', 'after_or_equal:today'],
            'items' => ['required', 'array', 'min:1', 'max:50'],
            'items.*' => ['required', 'array:product_id,quantity,notes'],
            'items.*.product_id' => [
                'required',
                'integer',
                'distinct',
                Rule::exists(Product::class, 'id')->where('is_active', true),
            ],
            'items.*.quantity' => [
                'required',
                'numeric',
                'decimal:0,2',
                'gt:0',
                'max:9999999999.99',
            ],
            'items.*.notes' => ['nullable', 'string', 'max:500'],
        ];
    }

    /** @return array{purpose: string, needed_at: string, items: list<array{product_id: int, quantity: string, notes: string|null}>} */
    public function payload(): array
    {
        $items = [];

        foreach ($this->array('items') as $item) {
            if (! is_array($item)) {
                continue;
            }

            $notes = $item['notes'] ?? null;
            $quantity = $item['quantity'] ?? '';

            $items[] = [
                'product_id' => (int) ($item['product_id'] ?? 0),
                'quantity' => is_numeric($quantity) ? (string) $quantity : '',
                'notes' => is_string($notes) ? $notes : null,
            ];
        }

        return [
            'purpose' => $this->string('purpose')->toString(),
            'needed_at' => $this->string('needed_at')->toString(),
            'items' => $items,
        ];
    }
}
