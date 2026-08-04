<?php

use App\Enums\UserRole;
use App\Models\User;

test('an administrator can access an administrator route', function () {
    $administrator = User::factory()->create([
        'role' => UserRole::Administrator,
    ]);

    $this->actingAs($administrator)
        ->get(route('admin.index'))
        ->assertRedirect(route('dashboard'));
});

test('a non-administrator cannot access an administrator route', function () {
    $requester = User::factory()->create([
        'role' => UserRole::Requester,
    ]);

    $this->actingAs($requester)
        ->get(route('admin.index'))
        ->assertForbidden();
});

test('new users receive the requester role by default', function () {
    $user = User::factory()->create();

    expect($user->role)->toBe(UserRole::Requester);
});
