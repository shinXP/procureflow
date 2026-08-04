<?php

use App\Enums\UserRole;
use App\Models\User;

test('an administrator can create a supplier', function () {
    $administrator = User::factory()->create(['role' => UserRole::Administrator]);

    $this->actingAs($administrator)
        ->post(route('suppliers.store'), [
            'code' => 'sup-001',
            'name' => 'Prime Office Solutions',
            'contact_person' => 'Maria Santos',
            'email' => 'sales@example.com',
            'phone' => '09170000000',
            'address' => 'Isulan, Sultan Kudarat',
            'is_active' => true,
        ])
        ->assertRedirect(route('suppliers.index'));

    $this->assertDatabaseHas('suppliers', [
        'code' => 'SUP-001',
        'name' => 'Prime Office Solutions',
    ]);
});

test('supplier writes preserve the current search and page', function () {
    $administrator = User::factory()->create(['role' => UserRole::Administrator]);

    $this->actingAs($administrator)
        ->post(route('suppliers.store', [
            'return_search' => 'prime',
            'return_page' => 2,
        ]), [
            'code' => 'SUP-002',
            'name' => 'Prime Hardware',
            'is_active' => true,
        ])
        ->assertRedirect(route('suppliers.index', [
            'search' => 'prime',
            'page' => 2,
        ]));
});
