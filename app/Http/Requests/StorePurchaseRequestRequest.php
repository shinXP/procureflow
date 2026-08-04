<?php

namespace App\Http\Requests;

use App\Models\PurchaseRequest;

class StorePurchaseRequestRequest extends PurchaseRequestFormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('create', PurchaseRequest::class) === true;
    }
}
