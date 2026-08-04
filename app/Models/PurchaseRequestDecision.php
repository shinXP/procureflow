<?php

namespace App\Models;

use App\Enums\PurchaseRequestDecisionType;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

/**
 * @property PurchaseRequestDecisionType $decision
 * @property Carbon $decided_at
 */
#[Fillable(['purchase_request_id', 'decision', 'remarks', 'decided_by', 'decided_at'])]
class PurchaseRequestDecision extends Model
{
    protected function casts(): array
    {
        return [
            'decision' => PurchaseRequestDecisionType::class,
            'decided_at' => 'datetime',
        ];
    }

    /** @return BelongsTo<PurchaseRequest, $this> */
    public function purchaseRequest(): BelongsTo
    {
        return $this->belongsTo(PurchaseRequest::class);
    }

    /** @return BelongsTo<User, $this> */
    public function reviewer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'decided_by');
    }
}
