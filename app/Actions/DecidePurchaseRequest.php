<?php

namespace App\Actions;

use App\Enums\PurchaseRequestDecisionType;
use App\Enums\PurchaseRequestStatus;
use App\Models\PurchaseRequest;
use App\Models\PurchaseRequestDecision;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class DecidePurchaseRequest
{
    public function handle(
        PurchaseRequest $purchaseRequest,
        User $reviewer,
        PurchaseRequestDecisionType $decision,
        ?string $remarks,
    ): PurchaseRequestDecision {
        $remarks = filled($remarks) ? trim($remarks) : null;

        if ($decision === PurchaseRequestDecisionType::Rejected && $remarks === null) {
            throw ValidationException::withMessages([
                'remarks' => 'Remarks are required when rejecting a purchase request.',
            ]);
        }

        return DB::transaction(function () use ($purchaseRequest, $reviewer, $decision, $remarks): PurchaseRequestDecision {
            $lockedRequest = PurchaseRequest::query()
                ->lockForUpdate()
                ->findOrFail($purchaseRequest->id);

            if ($lockedRequest->status !== PurchaseRequestStatus::Submitted) {
                throw ValidationException::withMessages([
                    'status' => 'Only submitted purchase requests can be approved or rejected.',
                ]);
            }

            $decidedAt = now();
            $recordedDecision = $lockedRequest->decisions()->create([
                'decision' => $decision,
                'remarks' => $remarks,
                'decided_by' => $reviewer->id,
                'decided_at' => $decidedAt,
            ]);

            $lockedRequest->update([
                'status' => $decision->purchaseRequestStatus(),
            ]);

            return $recordedDecision->load([
                'purchaseRequest',
                'reviewer:id,name,email,avatar_path',
            ]);
        });
    }
}
