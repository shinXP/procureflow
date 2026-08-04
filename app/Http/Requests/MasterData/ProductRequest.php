<?php

namespace App\Http\Requests\MasterData;

use App\Models\Category;
use App\Models\Product;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ProductRequest extends FormRequest
{
    protected function prepareForValidation(): void
    {
        $this->merge([
            'sku' => strtoupper(trim((string) $this->input('sku'))),
            'name' => trim((string) $this->input('name')),
            'description' => filled($this->input('description')) ? trim((string) $this->input('description')) : null,
            'unit' => strtolower(trim((string) $this->input('unit'))),
            'is_active' => $this->boolean('is_active'),
        ]);
    }

    /** @return array<string, ValidationRule|array<mixed>|string> */
    public function rules(): array
    {
        $product = $this->route('product');

        return [
            'category_id' => [
                'required',
                'integer',
                Rule::exists(Category::class, 'id')->where(function ($query) use ($product): void {
                    $query->where('is_active', true);

                    if ($product instanceof Product) {
                        $query->orWhere('id', $product->category_id);
                    }
                }),
            ],
            'sku' => ['required', 'string', 'max:100', Rule::unique(Product::class)->ignore($product)],
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:2000'],
            'image' => ['nullable', 'image', 'mimes:jpg,jpeg,png,webp', 'max:4096'],
            'unit' => ['required', 'string', 'max:50'],
            'reorder_level' => ['required', 'numeric', 'min:0', 'max:9999999999.99'],
            'is_active' => ['required', 'boolean'],
        ];
    }
}
