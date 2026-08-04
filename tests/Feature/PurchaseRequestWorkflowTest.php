<?php

use App\Enums\PurchaseRequestStatus;
use App\Enums\UserRole;
use App\Models\Category;
use App\Models\Product;
use App\Models\PurchaseRequest;
use App\Models\User;
use Carbon\CarbonImmutable;
use Illuminate\Support\Str;
use Inertia\Testing\AssertableInertia as Assert;

function makeWorkflowPurchaseRequest(
    User $requester,
    PurchaseRequestStatus $status = PurchaseRequestStatus::Draft,
    ?Product $product = null,
    array $attributes = [],
): PurchaseRequest {
    $product ??= Product::factory()->create();

    $purchaseRequest = PurchaseRequest::query()->create(array_merge([
        'requester_id' => $requester->id,
        'reference' => 'PR-TEST-'.Str::uuid(),
        'purpose' => 'Operational supplies.',
        'status' => $status,
        'needed_at' => today()->addWeek()->toDateString(),
        'submitted_at' => $status === PurchaseRequestStatus::Draft
            ? null
            : now()->subDay(),
    ], $attributes));

    $purchaseRequest->items()->create([
        'product_id' => $product->id,
        'product_name' => $product->name,
        'sku' => $product->sku,
        'unit' => $product->unit,
        'quantity' => 2,
        'notes' => 'For the operations team.',
    ]);

    return $purchaseRequest;
}

test('purchase request statuses match the supported workflow', function () {
    expect(array_map(
        fn (PurchaseRequestStatus $status): string => $status->value,
        PurchaseRequestStatus::cases(),
    ))->toBe([
        'draft',
        'submitted',
        'approved',
        'rejected',
        'converted_to_purchase_order',
    ]);
});

test('a requester can browse only active products in the catalog', function () {
    $requester = User::factory()->create(['role' => UserRole::Requester]);
    $category = Category::factory()->create();
    $activeProduct = Product::factory()->create([
        'category_id' => $category->id,
        'name' => 'Active product',
    ]);
    Product::factory()->create([
        'category_id' => $category->id,
        'name' => 'Inactive product',
        'is_active' => false,
    ]);

    $this->actingAs($requester)
        ->get(route('catalog.index'))
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->component('catalog/index')
            ->has('products.data', 1)
            ->where('products.data.0.id', $activeProduct->id));
});

test('an administrator can access the product catalog', function () {
    $administrator = User::factory()->create(['role' => UserRole::Administrator]);
    $activeProduct = Product::factory()->create();

    $this->actingAs($administrator)
        ->get(route('catalog.index'))
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->component('catalog/index')
            ->has('products.data', 1)
            ->where('products.data.0.id', $activeProduct->id));
});

test('guests must sign in before accessing purchase requests', function () {
    $this->get(route('purchase-requests.index'))
        ->assertRedirect(route('login'));
});

test('approvers and inventory officers cannot access purchase requests', function (UserRole $role) {
    $user = User::factory()->create(['role' => $role]);

    $this->actingAs($user)
        ->get(route('purchase-requests.index'))
        ->assertForbidden();
})->with([
    'approver' => UserRole::Approver,
    'inventory officer' => UserRole::InventoryOfficer,
]);

test('approvers and inventory officers cannot mutate purchase requests', function (UserRole $role) {
    $user = User::factory()->create(['role' => $role]);
    $requester = User::factory()->create(['role' => UserRole::Requester]);
    $product = Product::factory()->create();
    $purchaseRequest = makeWorkflowPurchaseRequest($requester, product: $product);
    $payload = [
        'purpose' => 'Unauthorized supplies request.',
        'needed_at' => today()->addWeek()->toDateString(),
        'items' => [
            ['product_id' => $product->id, 'quantity' => 1],
        ],
    ];

    $this->actingAs($user)
        ->post(route('purchase-requests.store'), $payload)
        ->assertForbidden();

    $this->patch(route('purchase-requests.update', $purchaseRequest), $payload)
        ->assertForbidden();

    $this->patch(route('purchase-requests.submit', $purchaseRequest))
        ->assertForbidden();

    $this->delete(route('purchase-requests.destroy', $purchaseRequest))
        ->assertForbidden();

    expect($purchaseRequest->refresh()->status)->toBe(PurchaseRequestStatus::Draft);
})->with([
    'approver' => UserRole::Approver,
    'inventory officer' => UserRole::InventoryOfficer,
]);

test('storing a purchase request creates a draft and snapshots every item', function () {
    $this->travelTo(CarbonImmutable::parse('2026-07-23 09:00:00'));

    $requester = User::factory()->create(['role' => UserRole::Requester]);
    $category = Category::factory()->create();
    $paper = Product::factory()->create([
        'category_id' => $category->id,
        'sku' => 'PAPER-001',
        'name' => 'A4 Paper',
        'unit' => 'ream',
    ]);
    $pens = Product::factory()->create([
        'category_id' => $category->id,
        'sku' => 'PEN-001',
        'name' => 'Blue Pens',
        'unit' => 'box',
    ]);

    $this->actingAs($requester)
        ->post(route('purchase-requests.store'), [
            'purpose' => 'Supplies for the finance office.',
            'needed_at' => today()->addWeek()->toDateString(),
            'items' => [
                ['product_id' => $paper->id, 'quantity' => 5.25, 'notes' => '80 gsm'],
                ['product_id' => $pens->id, 'quantity' => 2, 'notes' => null],
            ],
        ])
        ->assertSessionHasNoErrors()
        ->assertRedirect(route('purchase-requests.index'));

    $purchaseRequest = PurchaseRequest::query()->with('items')->sole();

    expect($purchaseRequest->requester_id)->toBe($requester->id)
        ->and($purchaseRequest->reference)->toBe('PR-2026-0001')
        ->and($purchaseRequest->status)->toBe(PurchaseRequestStatus::Draft)
        ->and($purchaseRequest->submitted_at)->toBeNull()
        ->and($purchaseRequest->items)->toHaveCount(2)
        ->and($purchaseRequest->items->firstWhere('product_id', $paper->id)?->product_name)->toBe('A4 Paper')
        ->and($purchaseRequest->items->firstWhere('product_id', $paper->id)?->sku)->toBe('PAPER-001')
        ->and($purchaseRequest->items->firstWhere('product_id', $paper->id)?->unit)->toBe('ream')
        ->and($purchaseRequest->items->firstWhere('product_id', $paper->id)?->quantity)->toBe('5.25');
});

test('an administrator can create a purchase request draft', function () {
    $administrator = User::factory()->create(['role' => UserRole::Administrator]);
    $product = Product::factory()->create();

    $this->actingAs($administrator)
        ->post(route('purchase-requests.store'), [
            'purpose' => 'Administrator office supplies.',
            'needed_at' => today()->addWeek()->toDateString(),
            'items' => [
                ['product_id' => $product->id, 'quantity' => 2],
            ],
        ])
        ->assertSessionHasNoErrors()
        ->assertRedirect(route('purchase-requests.index'));

    $purchaseRequest = PurchaseRequest::query()->sole();

    expect($purchaseRequest->requester_id)->toBe($administrator->id)
        ->and($purchaseRequest->status)->toBe(PurchaseRequestStatus::Draft)
        ->and($purchaseRequest->items()->value('product_id'))->toBe($product->id);
});

test('purchase request numbers increment within a year and reset for a new year', function () {
    $this->travelTo(CarbonImmutable::parse('2026-12-30 09:00:00'));

    $requester = User::factory()->create(['role' => UserRole::Requester]);
    $product = Product::factory()->create();
    $payload = fn (): array => [
        'purpose' => 'Annual office supplies.',
        'needed_at' => today()->addWeek()->toDateString(),
        'items' => [
            ['product_id' => $product->id, 'quantity' => 1],
        ],
    ];

    $this->actingAs($requester)
        ->post(route('purchase-requests.store'), $payload())
        ->assertSessionHasNoErrors();

    $this->post(route('purchase-requests.store'), $payload())
        ->assertSessionHasNoErrors();

    expect(PurchaseRequest::query()->orderBy('id')->pluck('reference')->all())
        ->toBe(['PR-2026-0001', 'PR-2026-0002']);

    $this->travelTo(CarbonImmutable::parse('2027-01-02 09:00:00'));

    $this->post(route('purchase-requests.store'), $payload())
        ->assertSessionHasNoErrors();

    expect(PurchaseRequest::query()->latest('id')->value('reference'))
        ->toBe('PR-2027-0001');
});

test('numbering continues after an existing sequential reference', function () {
    $this->travelTo(CarbonImmutable::parse('2026-07-23 09:00:00'));

    $requester = User::factory()->create(['role' => UserRole::Requester]);
    $product = Product::factory()->create();
    makeWorkflowPurchaseRequest(
        $requester,
        product: $product,
        attributes: ['reference' => 'PR-2026-0042'],
    );

    $this->actingAs($requester)
        ->post(route('purchase-requests.store'), [
            'purpose' => 'Continue the established request sequence.',
            'needed_at' => today()->addWeek()->toDateString(),
            'items' => [
                ['product_id' => $product->id, 'quantity' => 1],
            ],
        ])
        ->assertSessionHasNoErrors();

    expect(PurchaseRequest::query()->latest('id')->value('reference'))
        ->toBe('PR-2026-0043');
});

test('purpose required date and at least one item are required', function () {
    $requester = User::factory()->create(['role' => UserRole::Requester]);

    $this->actingAs($requester)
        ->post(route('purchase-requests.store'))
        ->assertInvalid(['purpose', 'needed_at', 'items']);

    expect(PurchaseRequest::query()->count())->toBe(0);
});

test('required dates in the past are rejected', function () {
    $requester = User::factory()->create(['role' => UserRole::Requester]);
    $product = Product::factory()->create();

    $this->actingAs($requester)
        ->post(route('purchase-requests.store'), [
            'purpose' => 'Office supplies.',
            'needed_at' => today()->subDay()->toDateString(),
            'items' => [
                ['product_id' => $product->id, 'quantity' => 1],
            ],
        ])
        ->assertInvalid('needed_at');

    expect(PurchaseRequest::query()->count())->toBe(0);
});

test('items must be unique active products with positive quantities having at most two decimals', function () {
    $requester = User::factory()->create(['role' => UserRole::Requester]);
    $activeProduct = Product::factory()->create();
    $inactiveProduct = Product::factory()->create(['is_active' => false]);
    $basePayload = [
        'purpose' => 'Office supplies.',
        'needed_at' => today()->addWeek()->toDateString(),
    ];

    $this->actingAs($requester)
        ->post(route('purchase-requests.store'), $basePayload + [
            'items' => [
                ['product_id' => $activeProduct->id, 'quantity' => 1],
                ['product_id' => $activeProduct->id, 'quantity' => 2],
            ],
        ])
        ->assertInvalid('items.1.product_id');

    $this->post(route('purchase-requests.store'), $basePayload + [
        'items' => [
            ['product_id' => $inactiveProduct->id, 'quantity' => 1],
        ],
    ])
        ->assertInvalid('items.0.product_id');

    $this->post(route('purchase-requests.store'), $basePayload + [
        'items' => [
            ['product_id' => $activeProduct->id, 'quantity' => 1.234],
        ],
    ])
        ->assertInvalid('items.0.quantity');

    $this->post(route('purchase-requests.store'), $basePayload + [
        'items' => [
            ['product_id' => $activeProduct->id, 'quantity' => 0],
        ],
    ])
        ->assertInvalid('items.0.quantity');

    expect(PurchaseRequest::query()->count())->toBe(0);
});

test('a purchase request accepts no more than fifty items', function () {
    $requester = User::factory()->create(['role' => UserRole::Requester]);
    $category = Category::factory()->create();
    $products = Product::factory()->count(51)->create(['category_id' => $category->id]);

    $this->actingAs($requester)
        ->post(route('purchase-requests.store'), [
            'purpose' => 'Bulk office setup.',
            'needed_at' => today()->addMonth()->toDateString(),
            'items' => $products
                ->map(fn (Product $product): array => [
                    'product_id' => $product->id,
                    'quantity' => 1,
                ])
                ->all(),
        ])
        ->assertInvalid('items');

    expect(PurchaseRequest::query()->count())->toBe(0);
});

test('invalid nested item data never leaves a partially created request', function () {
    $requester = User::factory()->create(['role' => UserRole::Requester]);
    $activeProduct = Product::factory()->create();
    $inactiveProduct = Product::factory()->create(['is_active' => false]);

    $this->actingAs($requester)
        ->post(route('purchase-requests.store'), [
            'purpose' => 'Mixed product request.',
            'needed_at' => today()->addWeek()->toDateString(),
            'items' => [
                ['product_id' => $activeProduct->id, 'quantity' => 1],
                ['product_id' => $inactiveProduct->id, 'quantity' => 1],
            ],
        ])
        ->assertInvalid('items.1.product_id');

    $this->assertDatabaseCount('purchase_requests', 0);
    $this->assertDatabaseCount('purchase_request_items', 0);
});

test('a requester can replace the details and items of their own draft', function () {
    $requester = User::factory()->create(['role' => UserRole::Requester]);
    $oldProduct = Product::factory()->create();
    $newProduct = Product::factory()->create([
        'sku' => 'NEW-001',
        'name' => 'Replacement product',
        'unit' => 'pack',
    ]);
    $purchaseRequest = makeWorkflowPurchaseRequest($requester, product: $oldProduct);

    $this->actingAs($requester)
        ->patch(route('purchase-requests.update', $purchaseRequest), [
            'purpose' => 'Updated operational supplies.',
            'needed_at' => today()->addDays(10)->toDateString(),
            'items' => [
                ['product_id' => $newProduct->id, 'quantity' => 3.5, 'notes' => 'Updated item'],
            ],
        ])
        ->assertSessionHasNoErrors()
        ->assertRedirect(route('purchase-requests.index'));

    $purchaseRequest->refresh()->load('items');

    expect($purchaseRequest->purpose)->toBe('Updated operational supplies.')
        ->and($purchaseRequest->needed_at?->toDateString())->toBe(today()->addDays(10)->toDateString())
        ->and($purchaseRequest->status)->toBe(PurchaseRequestStatus::Draft)
        ->and($purchaseRequest->items)->toHaveCount(1)
        ->and($purchaseRequest->items->first()->product_id)->toBe($newProduct->id)
        ->and($purchaseRequest->items->first()->product_name)->toBe('Replacement product')
        ->and($purchaseRequest->items->first()->quantity)->toBe('3.50');

    $this->assertDatabaseMissing('purchase_request_items', [
        'purchase_request_id' => $purchaseRequest->id,
        'product_id' => $oldProduct->id,
    ]);
});

test('editing a rejected request returns it to draft', function () {
    $requester = User::factory()->create(['role' => UserRole::Requester]);
    $product = Product::factory()->create();
    $purchaseRequest = makeWorkflowPurchaseRequest(
        $requester,
        PurchaseRequestStatus::Rejected,
        $product,
    );

    $this->actingAs($requester)
        ->patch(route('purchase-requests.update', $purchaseRequest), [
            'purpose' => 'Corrected supplies request.',
            'needed_at' => today()->addDays(10)->toDateString(),
            'items' => [
                ['product_id' => $product->id, 'quantity' => 4],
            ],
        ])
        ->assertSessionHasNoErrors();

    expect($purchaseRequest->refresh()->status)->toBe(PurchaseRequestStatus::Draft)
        ->and($purchaseRequest->submitted_at)->toBeNull();
});

test('a requester can delete their own draft and its items', function () {
    $requester = User::factory()->create(['role' => UserRole::Requester]);
    $purchaseRequest = makeWorkflowPurchaseRequest($requester);
    $itemId = $purchaseRequest->items()->value('id');

    $this->actingAs($requester)
        ->delete(route('purchase-requests.destroy', $purchaseRequest))
        ->assertSessionHasNoErrors()
        ->assertRedirect(route('purchase-requests.index'));

    $this->assertDatabaseMissing('purchase_requests', ['id' => $purchaseRequest->id]);
    $this->assertDatabaseMissing('purchase_request_items', ['id' => $itemId]);
});

test('a requester cannot delete their rejected request', function () {
    $requester = User::factory()->create(['role' => UserRole::Requester]);
    $purchaseRequest = makeWorkflowPurchaseRequest(
        $requester,
        PurchaseRequestStatus::Rejected,
    );

    $this->actingAs($requester)
        ->delete(route('purchase-requests.destroy', $purchaseRequest))
        ->assertForbidden();

    $this->assertDatabaseHas('purchase_requests', ['id' => $purchaseRequest->id]);
});

test('submitted approved and converted requests are immutable for their requester', function (
    PurchaseRequestStatus $status,
) {
    $requester = User::factory()->create(['role' => UserRole::Requester]);
    $product = Product::factory()->create();
    $replacement = Product::factory()->create();
    $purchaseRequest = makeWorkflowPurchaseRequest($requester, $status, $product);

    $this->actingAs($requester)
        ->patch(route('purchase-requests.update', $purchaseRequest), [
            'purpose' => 'This change must not be saved.',
            'needed_at' => today()->addDays(10)->toDateString(),
            'items' => [
                ['product_id' => $replacement->id, 'quantity' => 1],
            ],
        ])
        ->assertForbidden();

    $this->delete(route('purchase-requests.destroy', $purchaseRequest))
        ->assertForbidden();

    expect($purchaseRequest->refresh()->purpose)->toBe('Operational supplies.')
        ->and($purchaseRequest->items()->value('product_id'))->toBe($product->id);
})->with([
    'submitted' => PurchaseRequestStatus::Submitted,
    'approved' => PurchaseRequestStatus::Approved,
    'converted to purchase order' => PurchaseRequestStatus::ConvertedToPurchaseOrder,
]);

test('a requester cannot manage another requesters draft', function () {
    $owner = User::factory()->create(['role' => UserRole::Requester]);
    $otherRequester = User::factory()->create(['role' => UserRole::Requester]);
    $product = Product::factory()->create();
    $purchaseRequest = makeWorkflowPurchaseRequest($owner, product: $product);

    $this->actingAs($otherRequester)
        ->patch(route('purchase-requests.update', $purchaseRequest), [
            'purpose' => 'Unauthorized change.',
            'needed_at' => today()->addWeek()->toDateString(),
            'items' => [
                ['product_id' => $product->id, 'quantity' => 3],
            ],
        ])
        ->assertForbidden();

    $this->patch(route('purchase-requests.submit', $purchaseRequest))
        ->assertForbidden();

    $this->delete(route('purchase-requests.destroy', $purchaseRequest))
        ->assertForbidden();

    expect($purchaseRequest->refresh()->status)->toBe(PurchaseRequestStatus::Draft);
});

test('a requester can submit their own draft', function () {
    $this->travelTo(CarbonImmutable::parse('2026-07-23 09:00:00'));

    $requester = User::factory()->create(['role' => UserRole::Requester]);
    $purchaseRequest = makeWorkflowPurchaseRequest($requester);

    $this->actingAs($requester)
        ->patch(route('purchase-requests.submit', $purchaseRequest))
        ->assertSessionHasNoErrors()
        ->assertRedirect(route('purchase-requests.index'));

    expect($purchaseRequest->refresh()->status)->toBe(PurchaseRequestStatus::Submitted)
        ->and($purchaseRequest->submitted_at?->equalTo(now()))->toBeTrue();
});

test('an already submitted request cannot be submitted again', function () {
    $this->travelTo(CarbonImmutable::parse('2026-07-23 09:00:00'));

    $requester = User::factory()->create(['role' => UserRole::Requester]);
    $purchaseRequest = makeWorkflowPurchaseRequest($requester);

    $this->actingAs($requester)
        ->patch(route('purchase-requests.submit', $purchaseRequest))
        ->assertSessionHasNoErrors();

    $submittedAt = $purchaseRequest->refresh()->submitted_at;
    $this->travelTo(CarbonImmutable::parse('2026-07-23 10:00:00'));

    $this->patch(route('purchase-requests.submit', $purchaseRequest))
        ->assertForbidden();

    expect($purchaseRequest->refresh()->status)->toBe(PurchaseRequestStatus::Submitted)
        ->and($purchaseRequest->submitted_at?->equalTo($submittedAt))->toBeTrue();
});

test('a requester can resubmit their own rejected request', function () {
    $requester = User::factory()->create(['role' => UserRole::Requester]);
    $purchaseRequest = makeWorkflowPurchaseRequest(
        $requester,
        PurchaseRequestStatus::Rejected,
    );

    $this->actingAs($requester)
        ->patch(route('purchase-requests.submit', $purchaseRequest))
        ->assertSessionHasNoErrors();

    expect($purchaseRequest->refresh()->status)->toBe(PurchaseRequestStatus::Submitted)
        ->and($purchaseRequest->submitted_at)->not->toBeNull();
});

test('a draft cannot be submitted after one of its products becomes inactive', function () {
    $requester = User::factory()->create(['role' => UserRole::Requester]);
    $product = Product::factory()->create();
    $purchaseRequest = makeWorkflowPurchaseRequest($requester, product: $product);
    $product->update(['is_active' => false]);

    $this->actingAs($requester)
        ->from(route('purchase-requests.index'))
        ->patch(route('purchase-requests.submit', $purchaseRequest))
        ->assertSessionHasErrors('items')
        ->assertRedirect(route('purchase-requests.index'));

    expect($purchaseRequest->refresh()->status)->toBe(PurchaseRequestStatus::Draft)
        ->and($purchaseRequest->submitted_at)->toBeNull();
});

test('a draft cannot be submitted after its required date passes', function () {
    $this->travelTo(CarbonImmutable::parse('2026-07-23 09:00:00'));

    $requester = User::factory()->create(['role' => UserRole::Requester]);
    $purchaseRequest = makeWorkflowPurchaseRequest(
        $requester,
        attributes: ['needed_at' => today()->addDay()->toDateString()],
    );

    $this->travelTo(CarbonImmutable::parse('2026-07-25 09:00:00'));

    $this->actingAs($requester)
        ->from(route('purchase-requests.index'))
        ->patch(route('purchase-requests.submit', $purchaseRequest))
        ->assertSessionHasErrors('needed_at')
        ->assertRedirect(route('purchase-requests.index'));

    expect($purchaseRequest->refresh()->status)->toBe(PurchaseRequestStatus::Draft)
        ->and($purchaseRequest->submitted_at)->toBeNull();
});

test('a requester sees only their own purchase requests while an administrator sees all', function () {
    $requester = User::factory()->create(['role' => UserRole::Requester]);
    $otherRequester = User::factory()->create(['role' => UserRole::Requester]);
    $administrator = User::factory()->create(['role' => UserRole::Administrator]);
    $ownRequest = makeWorkflowPurchaseRequest($requester);
    makeWorkflowPurchaseRequest($otherRequester);

    $this->actingAs($requester)
        ->get(route('purchase-requests.index'))
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->component('purchase-requests/index')
            ->has('purchaseRequests.data', 1)
            ->where('purchaseRequests.data.0.id', $ownRequest->id));

    $this->actingAs($administrator)
        ->get(route('purchase-requests.index'))
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->component('purchase-requests/index')
            ->has('purchaseRequests.data', 2));
});

test('an administrator can manage requester drafts', function () {
    $administrator = User::factory()->create(['role' => UserRole::Administrator]);
    $requester = User::factory()->create(['role' => UserRole::Requester]);
    $product = Product::factory()->create();
    $purchaseRequest = makeWorkflowPurchaseRequest($requester, product: $product);

    $this->actingAs($administrator)
        ->patch(route('purchase-requests.update', $purchaseRequest), [
            'purpose' => 'Administrator corrected this draft.',
            'needed_at' => today()->addDays(10)->toDateString(),
            'items' => [
                ['product_id' => $product->id, 'quantity' => 4],
            ],
        ])
        ->assertSessionHasNoErrors();

    $this->patch(route('purchase-requests.submit', $purchaseRequest))
        ->assertSessionHasNoErrors();

    expect($purchaseRequest->refresh()->status)->toBe(PurchaseRequestStatus::Submitted)
        ->and($purchaseRequest->purpose)->toBe('Administrator corrected this draft.');

    $deletableDraft = makeWorkflowPurchaseRequest($requester);

    $this->delete(route('purchase-requests.destroy', $deletableDraft))
        ->assertSessionHasNoErrors();

    $this->assertDatabaseMissing('purchase_requests', ['id' => $deletableDraft->id]);
});
