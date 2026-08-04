<?php

namespace App\Actions;

use App\Models\PurchaseRequest;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class DeletePurchaseRequest
{
    public function handle(PurchaseRequest $purchaseRequest): void
    {
        DB::transaction(function () use ($purchaseRequest): void {
            $lockedRequest = PurchaseRequest::query()
                ->lockForUpdate()
                ->findOrFail($purchaseRequest->id);

            if (! $lockedRequest->canBeDeleted()) {
                throw ValidationException::withMessages([
                    'status' => 'Only draft purchase requests can be deleted.',
                ]);
            }

            $lockedRequest->delete();
        });
    }
}
