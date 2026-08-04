<?php

namespace App\Policies;

use App\Enums\PurchaseRequestStatus;
use App\Enums\UserRole;
use App\Models\PurchaseRequest;
use App\Models\User;

class PurchaseRequestPolicy
{
    public function reviewAny(User $user): bool
    {
        return $user->hasAnyRole([
            UserRole::Administrator,
            UserRole::Approver,
        ]);
    }

    public function viewAny(User $user): bool
    {
        return $user->hasAnyRole([
            UserRole::Administrator,
            UserRole::Requester,
        ]);
    }

    public function view(User $user, PurchaseRequest $purchaseRequest): bool
    {
        return $user->hasRole(UserRole::Administrator)
            || (
                $user->hasRole(UserRole::Requester)
                && $purchaseRequest->requester_id === $user->id
            );
    }

    public function create(User $user): bool
    {
        return $this->viewAny($user);
    }

    public function update(User $user, PurchaseRequest $purchaseRequest): bool
    {
        return $purchaseRequest->canBeEdited()
            && $this->canManage($user, $purchaseRequest);
    }

    public function delete(User $user, PurchaseRequest $purchaseRequest): bool
    {
        return $purchaseRequest->canBeDeleted()
            && $this->canManage($user, $purchaseRequest);
    }

    public function submit(User $user, PurchaseRequest $purchaseRequest): bool
    {
        return $purchaseRequest->canBeSubmitted()
            && $this->canManage($user, $purchaseRequest);
    }

    public function decide(User $user, PurchaseRequest $purchaseRequest): bool
    {
        return $purchaseRequest->status === PurchaseRequestStatus::Submitted
            && $this->reviewAny($user);
    }

    private function canManage(User $user, PurchaseRequest $purchaseRequest): bool
    {
        return $user->hasRole(UserRole::Administrator)
            || (
                $user->hasRole(UserRole::Requester)
                && $purchaseRequest->requester_id === $user->id
            );
    }
}
