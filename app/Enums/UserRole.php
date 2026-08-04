<?php

namespace App\Enums;

enum UserRole: string
{
    case Administrator = 'admin';
    case Requester = 'requester';
    case Approver = 'approver';
    case InventoryOfficer = 'inventory_officer';

    public function label(): string
    {
        return match ($this) {
            self::Administrator => 'Administrator',
            self::Requester => 'Requester',
            self::Approver => 'Approver',
            self::InventoryOfficer => 'Inventory Officer',
        };
    }
}
