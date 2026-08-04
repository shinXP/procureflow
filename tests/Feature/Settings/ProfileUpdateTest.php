<?php

use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

test('profile page is displayed', function () {
    $user = User::factory()->create();

    $response = $this
        ->actingAs($user)
        ->get(route('profile.edit'));

    $response->assertOk();
});

test('profile information can be updated', function () {
    $user = User::factory()->create();

    $response = $this
        ->actingAs($user)
        ->patch(route('profile.update'), [
            'name' => 'Test User',
            'email' => 'test@example.com',
        ]);

    $response
        ->assertSessionHasNoErrors()
        ->assertRedirect(route('profile.edit'));

    $user->refresh();

    expect($user->name)->toBe('Test User');
    expect($user->email)->toBe('test@example.com');
    expect($user->email_verified_at)->toBeNull();
});

test('email verification status is unchanged when the email address is unchanged', function () {
    $user = User::factory()->create();

    $response = $this
        ->actingAs($user)
        ->patch(route('profile.update'), [
            'name' => 'Test User',
            'email' => $user->email,
        ]);

    $response
        ->assertSessionHasNoErrors()
        ->assertRedirect(route('profile.edit'));

    expect($user->refresh()->email_verified_at)->not->toBeNull();
});

test('profile picture can be uploaded and replaced', function () {
    Storage::fake('public');
    $user = User::factory()->create(['avatar_path' => 'avatars/old-avatar.jpg']);
    Storage::disk('public')->put('avatars/old-avatar.jpg', 'old avatar');

    $response = $this
        ->actingAs($user)
        ->post(route('profile.photo.update'), [
            'avatar' => UploadedFile::fake()->image('avatar.jpg'),
        ]);

    $response
        ->assertSessionHasNoErrors()
        ->assertRedirect(route('profile.edit'));

    $user->refresh();

    expect($user->avatar_path)->not->toBeNull()
        ->and($user->avatar)->toContain('/storage/avatars/');
    Storage::disk('public')->assertExists($user->avatar_path);
    Storage::disk('public')->assertMissing('avatars/old-avatar.jpg');
});

test('profile picture must be a supported image no larger than two megabytes', function () {
    Storage::fake('public');
    $user = User::factory()->create();

    $response = $this
        ->actingAs($user)
        ->from(route('profile.edit'))
        ->post(route('profile.photo.update'), [
            'avatar' => UploadedFile::fake()->create('avatar.gif', 2500, 'image/gif'),
        ]);

    $response
        ->assertSessionHasErrors('avatar')
        ->assertRedirect(route('profile.edit'));
});

test('profile picture can be removed', function () {
    Storage::fake('public');
    $user = User::factory()->create(['avatar_path' => 'avatars/avatar.jpg']);
    Storage::disk('public')->put('avatars/avatar.jpg', 'avatar');

    $response = $this
        ->actingAs($user)
        ->delete(route('profile.photo.destroy'));

    $response->assertRedirect(route('profile.edit'));

    expect($user->refresh()->avatar_path)->toBeNull();
    Storage::disk('public')->assertMissing('avatars/avatar.jpg');
});

test('user can delete their account', function () {
    $user = User::factory()->create();

    $response = $this
        ->actingAs($user)
        ->delete(route('profile.destroy'), [
            'password' => 'password',
        ]);

    $response
        ->assertSessionHasNoErrors()
        ->assertRedirect(route('home'));

    $this->assertGuest();
    expect($user->fresh())->toBeNull();
});

test('correct password must be provided to delete account', function () {
    $user = User::factory()->create();

    $response = $this
        ->actingAs($user)
        ->from(route('profile.edit'))
        ->delete(route('profile.destroy'), [
            'password' => 'wrong-password',
        ]);

    $response
        ->assertSessionHasErrors('password')
        ->assertRedirect(route('profile.edit'));

    expect($user->fresh())->not->toBeNull();
});
