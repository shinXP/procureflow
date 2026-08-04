<?php

use App\Enums\UserRole;
use App\Models\User;
use Illuminate\Support\Facades\Route;

test('administrators can access master data pages', function (string $routeName) {
    $administrator = User::factory()->create(['role' => UserRole::Administrator]);

    $this->actingAs($administrator)
        ->get(route($routeName))
        ->assertOk();
})->with(['categories.index', 'products.index', 'suppliers.index']);

test('inventory officers can access master data pages', function (string $routeName) {
    $inventoryOfficer = User::factory()->create(['role' => UserRole::InventoryOfficer]);

    $this->actingAs($inventoryOfficer)
        ->get(route($routeName))
        ->assertOk();
})->with(['categories.index', 'products.index', 'suppliers.index']);

test('requesters cannot manage master data', function (string $routeName) {
    $requester = User::factory()->create(['role' => UserRole::Requester]);

    $this->actingAs($requester)
        ->get(route($routeName))
        ->assertForbidden();
})->with(['categories.index', 'products.index', 'suppliers.index']);

test('master data does not expose separate create or edit routes', function () {
    foreach (['categories', 'products', 'suppliers'] as $resource) {
        expect(Route::has("{$resource}.create"))->toBeFalse()
            ->and(Route::has("{$resource}.edit"))->toBeFalse();
    }
});
