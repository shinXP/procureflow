<?php

use App\Enums\PurchaseRequestStatus;
use App\Enums\UserRole;
use App\Models\Product;
use App\Models\PurchaseRequest;
use App\Models\User;

test('a user with purchase request history cannot delete their account', function () {
    $requester = User::factory()->create(['role' => UserRole::Requester]);
    $product = Product::factory()->create();
    $purchaseRequest = PurchaseRequest::query()->create([
        'requester_id' => $requester->id,
        'reference' => 'PR-2026-9999',
        'purpose' => 'Retained audit history.',
        'status' => PurchaseRequestStatus::Submitted,
        'needed_at' => today()->addWeek()->toDateString(),
        'submitted_at' => now(),
    ]);
    $purchaseRequest->items()->create([
        'product_id' => $product->id,
        'product_name' => $product->name,
        'sku' => $product->sku,
        'unit' => $product->unit,
        'quantity' => 1,
    ]);

    $this->actingAs($requester)
        ->from(route('profile.edit'))
        ->delete(route('profile.destroy'), [
            'password' => 'password',
        ])
        ->assertSessionHasErrors('account')
        ->assertRedirect(route('profile.edit'));

    $this->assertAuthenticatedAs($requester);
    $this->assertDatabaseHas('users', ['id' => $requester->id]);
    $this->assertDatabaseHas('purchase_requests', ['id' => $purchaseRequest->id]);
    $this->assertDatabaseHas('purchase_request_items', [
        'purchase_request_id' => $purchaseRequest->id,
        'product_id' => $product->id,
    ]);
});
