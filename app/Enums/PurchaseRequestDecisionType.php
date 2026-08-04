<?php

namespace App\Enums;

enum PurchaseRequestDecisionType: string
{
    case Approved = 'approved';
    case Rejected = 'rejected';

    public function label(): string
    {
        return match ($this) {
            self::Approved => 'Approved',
            self::Rejected => 'Rejected',
        };
    }

    public function purchaseRequestStatus(): PurchaseRequestStatus
    {
        return match ($this) {
            self::Approved => PurchaseRequestStatus::Approved,
            self::Rejected => PurchaseRequestStatus::Rejected,
        };
    }
}
