<?php

use App\Enums\PurchaseRequestStatus;
use App\Enums\UserRole;
use App\Models\Category;
use App\Models\Product;
use App\Models\PurchaseRequest;
use App\Models\PurchaseRequestItem;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

test('an inventory officer can create a product', function () {
    $inventoryOfficer = User::factory()->create(['role' => UserRole::InventoryOfficer]);
    $category = Category::factory()->create();

    $this->actingAs($inventoryOfficer)
        ->post(route('products.store'), [
            'category_id' => $category->id,
            'sku' => 'off-0001',
            'name' => 'A4 Copy Paper',
            'description' => 'Standard copy paper.',
            'unit' => 'ream',
            'reorder_level' => 20,
            'is_active' => true,
        ])
        ->assertRedirect(route('products.index'));

    $this->assertDatabaseHas('products', [
        'sku' => 'OFF-0001',
        'name' => 'A4 Copy Paper',
        'category_id' => $category->id,
    ]);
});

test('a product requires an existing category', function () {
    $administrator = User::factory()->create(['role' => UserRole::Administrator]);

    $this->actingAs($administrator)
        ->post(route('products.store'), [
            'category_id' => 999,
            'sku' => 'TEST-001',
            'name' => 'Test Product',
            'unit' => 'piece',
            'reorder_level' => 0,
            'is_active' => true,
        ])
        ->assertInvalid('category_id');
});

test('a new product requires an active category', function () {
    $administrator = User::factory()->create(['role' => UserRole::Administrator]);
    $category = Category::factory()->create(['is_active' => false]);

    $this->actingAs($administrator)
        ->post(route('products.store'), [
            'category_id' => $category->id,
            'sku' => 'TEST-002',
            'name' => 'Inactive category product',
            'unit' => 'piece',
            'reorder_level' => 0,
            'is_active' => true,
        ])
        ->assertInvalid('category_id');
});

test('an inventory officer can upload a product image', function () {
    Storage::fake('public');
    $inventoryOfficer = User::factory()->create(['role' => UserRole::InventoryOfficer]);
    $category = Category::factory()->create();

    $this->actingAs($inventoryOfficer)
        ->post(route('products.store'), [
            'category_id' => $category->id,
            'sku' => 'IMG-001',
            'name' => 'Ergonomic Chair',
            'image' => UploadedFile::fake()->image('chair.webp'),
            'unit' => 'piece',
            'reorder_level' => 5,
            'is_active' => true,
        ])
        ->assertSessionHasNoErrors()
        ->assertRedirect(route('products.index'));

    $product = Product::query()->where('sku', 'IMG-001')->firstOrFail();

    expect($product->image_path)->not->toBeNull()
        ->and($product->image_url)->toContain('/storage/products/');
    Storage::disk('public')->assertExists($product->image_path);
});

test('an administrator can replace a product image', function () {
    Storage::fake('public');
    $administrator = User::factory()->create(['role' => UserRole::Administrator]);
    $category = Category::factory()->create();
    $product = Product::factory()->create([
        'category_id' => $category->id,
        'image_path' => 'products/old.jpg',
    ]);
    Storage::disk('public')->put('products/old.jpg', 'old image');

    $this->actingAs($administrator)
        ->post(route('products.update', $product), [
            '_method' => 'PUT',
            'category_id' => $category->id,
            'sku' => $product->sku,
            'name' => $product->name,
            'image' => UploadedFile::fake()->image('new.png'),
            'unit' => $product->unit,
            'reorder_level' => $product->reorder_level,
            'is_active' => true,
        ])
        ->assertSessionHasNoErrors()
        ->assertRedirect(route('products.index'));

    $product->refresh();

    Storage::disk('public')->assertExists($product->image_path);
    Storage::disk('public')->assertMissing('products/old.jpg');
});

test('product image must be a supported image no larger than four megabytes', function () {
    Storage::fake('public');
    $administrator = User::factory()->create(['role' => UserRole::Administrator]);
    $category = Category::factory()->create();

    $this->actingAs($administrator)
        ->post(route('products.store'), [
            'category_id' => $category->id,
            'sku' => 'BAD-IMG',
            'name' => 'Invalid image product',
            'image' => UploadedFile::fake()->create('manual.pdf', 100, 'application/pdf'),
            'unit' => 'piece',
            'reorder_level' => 0,
            'is_active' => true,
        ])
        ->assertInvalid('image');
});

test('a product used by a purchase request cannot be deleted or lose its image', function () {
    Storage::fake('public');
    $administrator = User::factory()->create(['role' => UserRole::Administrator]);
    $requester = User::factory()->create(['role' => UserRole::Requester]);
    $product = Product::factory()->create([
        'image_path' => 'products/retained.jpg',
    ]);
    $purchaseRequest = PurchaseRequest::query()->create([
        'requester_id' => $requester->id,
        'reference' => 'PR-2026-9999',
        'purpose' => 'Test retained product',
        'status' => PurchaseRequestStatus::Submitted,
        'needed_at' => today()->addWeek()->toDateString(),
        'submitted_at' => now(),
    ]);
    PurchaseRequestItem::query()->create([
        'purchase_request_id' => $purchaseRequest->id,
        'product_id' => $product->id,
        'product_name' => $product->name,
        'sku' => $product->sku,
        'unit' => $product->unit,
        'quantity' => 1,
    ]);
    Storage::disk('public')->put('products/retained.jpg', 'image');

    $this->actingAs($administrator)
        ->delete(route('products.destroy', $product))
        ->assertRedirect();

    $this->assertDatabaseHas('products', ['id' => $product->id]);
    Storage::disk('public')->assertExists('products/retained.jpg');
});

test('product writes preserve the current filters and page', function () {
    $administrator = User::factory()->create(['role' => UserRole::Administrator]);
    $product = Product::factory()->create();

    $this->actingAs($administrator)
        ->delete(route('products.destroy', [
            'product' => $product,
            'return_search' => 'paper',
            'return_category_id' => $product->category_id,
            'return_page' => 3,
        ]))
        ->assertRedirect(route('products.index', [
            'search' => 'paper',
            'category_id' => $product->category_id,
            'page' => 3,
        ]));
});
