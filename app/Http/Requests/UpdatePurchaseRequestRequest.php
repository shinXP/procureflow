<?php

namespace App\Http\Requests;

use App\Models\PurchaseRequest;

class UpdatePurchaseRequestRequest extends PurchaseRequestFormRequest
{
    public function authorize(): bool
    {
        $purchaseRequest = $this->route('purchase_request');

        return $purchaseRequest instanceof PurchaseRequest
            && $this->user()?->can('update', $purchaseRequest) === true;
    }
}
