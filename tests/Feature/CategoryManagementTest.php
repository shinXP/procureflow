<?php

use App\Enums\UserRole;
use App\Models\Category;
use App\Models\Product;
use App\Models\User;

beforeEach(function () {
    $this->actingAs(User::factory()->create(['role' => UserRole::Administrator]));
});

test('an administrator can create a category', function () {
    $this->post(route('categories.store'), [
        'name' => 'Office Supplies',
        'description' => 'Everyday office consumables.',
        'is_active' => true,
    ])->assertRedirect(route('categories.index'));

    $this->assertDatabaseHas('categories', [
        'name' => 'Office Supplies',
        'is_active' => true,
    ]);
});

test('category names must be unique', function () {
    Category::factory()->create(['name' => 'Office Supplies']);

    $this->post(route('categories.store'), [
        'name' => 'Office Supplies',
        'is_active' => true,
    ])->assertInvalid('name');
});

test('a category containing products cannot be deleted', function () {
    $category = Category::factory()->create();
    Product::factory()->for($category)->create();

    $this->delete(route('categories.destroy', $category));

    $this->assertDatabaseHas('categories', ['id' => $category->id]);
});

test('category writes preserve the current search and page', function () {
    $this->post(route('categories.store', [
        'return_search' => 'office',
        'return_page' => 2,
    ]), [
        'name' => 'Office Furniture',
        'is_active' => true,
    ])->assertRedirect(route('categories.index', [
        'search' => 'office',
        'page' => 2,
    ]));
});
