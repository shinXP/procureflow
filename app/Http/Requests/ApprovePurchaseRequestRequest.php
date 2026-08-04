<?php

namespace App\Http\Requests;

use App\Models\PurchaseRequest;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class ApprovePurchaseRequestRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        $purchaseRequest = $this->route('purchase_request');

        return $purchaseRequest instanceof PurchaseRequest
            && $this->user()?->can('decide', $purchaseRequest) === true;
    }

    protected function prepareForValidation(): void
    {
        $remarks = $this->input('remarks');

        $this->merge([
            'remarks' => is_string($remarks) && filled(trim($remarks))
                ? trim($remarks)
                : null,
        ]);
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'remarks' => ['nullable', 'string', 'max:2000'],
        ];
    }

    public function remarks(): ?string
    {
        $remarks = $this->validated('remarks');

        return is_string($remarks) ? $remarks : null;
    }
}
