<?php

namespace App\Models;

use App\Enums\PurchaseRequestStatus;
use Database\Factories\PurchaseRequestFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Support\Carbon;

/**
 * @property PurchaseRequestStatus $status
 * @property Carbon $needed_at
 * @property Carbon|null $submitted_at
 */
#[Fillable(['requester_id', 'reference', 'purpose', 'status', 'needed_at', 'submitted_at'])]
class PurchaseRequest extends Model
{
    /** @use HasFactory<PurchaseRequestFactory> */
    use HasFactory;

    protected function casts(): array
    {
        return [
            'status' => PurchaseRequestStatus::class,
            'needed_at' => 'date',
            'submitted_at' => 'datetime',
        ];
    }

    /** @return BelongsTo<User, $this> */
    public function requester(): BelongsTo
    {
        return $this->belongsTo(User::class, 'requester_id');
    }

    /** @return HasMany<PurchaseRequestItem, $this> */
    public function items(): HasMany
    {
        return $this->hasMany(PurchaseRequestItem::class);
    }

    /** @return HasMany<PurchaseRequestDecision, $this> */
    public function decisions(): HasMany
    {
        return $this->hasMany(PurchaseRequestDecision::class)
            ->latest('decided_at')
            ->latest('id');
    }

    /** @return HasOne<PurchaseRequestDecision, $this> */
    public function latestDecision(): HasOne
    {
        return $this->hasOne(PurchaseRequestDecision::class)->latestOfMany();
    }

    public function canBeEdited(): bool
    {
        return in_array($this->status, [
            PurchaseRequestStatus::Draft,
            PurchaseRequestStatus::Rejected,
        ], true);
    }

    public function canBeDeleted(): bool
    {
        return $this->status === PurchaseRequestStatus::Draft;
    }

    public function canBeSubmitted(): bool
    {
        return in_array($this->status, [
            PurchaseRequestStatus::Draft,
            PurchaseRequestStatus::Rejected,
        ], true);
    }
}
