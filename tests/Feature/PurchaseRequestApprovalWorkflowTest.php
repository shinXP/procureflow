<?php

use App\Actions\DecidePurchaseRequest;
use App\Enums\PurchaseRequestDecisionType;
use App\Enums\PurchaseRequestStatus;
use App\Enums\UserRole;
use App\Models\Product;
use App\Models\PurchaseRequest;
use App\Models\PurchaseRequestDecision;
use App\Models\User;
use Carbon\CarbonImmutable;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Inertia\Testing\AssertableInertia as Assert;

function makeApprovalPurchaseRequest(
    User $requester,
    PurchaseRequestStatus $status = PurchaseRequestStatus::Submitted,
    array $attributes = [],
): PurchaseRequest {
    $product = Product::factory()->create();

    $purchaseRequest = PurchaseRequest::query()->create(array_merge([
        'requester_id' => $requester->id,
        'reference' => 'PR-APPROVAL-'.Str::uuid(),
        'purpose' => 'Replace worn office equipment.',
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
        'quantity' => 3,
        'notes' => 'Needed by the operations team.',
    ]);

    return $purchaseRequest;
}

test('guests must sign in before accessing or mutating approval requests', function () {
    $requester = User::factory()->create(['role' => UserRole::Requester]);
    $purchaseRequest = makeApprovalPurchaseRequest($requester);

    $this->get(route('approvals.index'))
        ->assertRedirect(route('login'));

    $this->patch(route('approvals.approve', $purchaseRequest))
        ->assertRedirect(route('login'));

    $this->patch(route('approvals.reject', $purchaseRequest), [
        'remarks' => 'The request needs revision.',
    ])->assertRedirect(route('login'));

    expect($purchaseRequest->refresh()->status)->toBe(PurchaseRequestStatus::Submitted);
    $this->assertDatabaseCount('purchase_request_decisions', 0);
});

test('approvers and administrators can browse the approval queue', function (UserRole $role) {
    $reviewer = User::factory()->create(['role' => $role]);
    $requester = User::factory()->create(['role' => UserRole::Requester]);
    $purchaseRequest = makeApprovalPurchaseRequest($requester);

    $this->actingAs($reviewer)
        ->get(route('approvals.index'))
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->component('approvals/index')
            ->has('purchaseRequests.data', 1)
            ->where('purchaseRequests.data.0.id', $purchaseRequest->id)
            ->where('purchaseRequests.data.0.can.decide', true));
})->with([
    'approver' => UserRole::Approver,
    'administrator' => UserRole::Administrator,
]);

test('requesters and inventory officers cannot browse the approval queue', function (UserRole $role) {
    $user = User::factory()->create(['role' => $role]);

    $this->actingAs($user)
        ->get(route('approvals.index'))
        ->assertForbidden();
})->with([
    'requester' => UserRole::Requester,
    'inventory officer' => UserRole::InventoryOfficer,
]);

test('requesters and inventory officers cannot approve or reject requests', function (UserRole $role) {
    $user = User::factory()->create(['role' => $role]);
    $requester = User::factory()->create(['role' => UserRole::Requester]);
    $purchaseRequest = makeApprovalPurchaseRequest($requester);

    $this->actingAs($user)
        ->patch(route('approvals.approve', $purchaseRequest), [
            'remarks' => 'This must not be recorded.',
        ])
        ->assertForbidden();

    $this->patch(route('approvals.reject', $purchaseRequest), [
        'remarks' => 'This must not be recorded.',
    ])->assertForbidden();

    expect($purchaseRequest->refresh()->status)->toBe(PurchaseRequestStatus::Submitted);
    $this->assertDatabaseCount('purchase_request_decisions', 0);
})->with([
    'requester' => UserRole::Requester,
    'inventory officer' => UserRole::InventoryOfficer,
]);

test('an approver can approve a submitted request and create an audit record', function () {
    $this->travelTo(CarbonImmutable::parse('2026-07-23 10:30:00'));

    $approver = User::factory()->create(['role' => UserRole::Approver]);
    $requester = User::factory()->create(['role' => UserRole::Requester]);
    $purchaseRequest = makeApprovalPurchaseRequest($requester);

    $this->actingAs($approver)
        ->patch(route('approvals.approve', $purchaseRequest), [
            'remarks' => '  Budget and quantities verified.  ',
        ])
        ->assertSessionHasNoErrors()
        ->assertRedirect(route('approvals.index'));

    expect($purchaseRequest->refresh()->status)->toBe(PurchaseRequestStatus::Approved);

    $decision = PurchaseRequestDecision::query()->sole();

    expect($decision->purchase_request_id)->toBe($purchaseRequest->id)
        ->and($decision->decision)->toBe(PurchaseRequestDecisionType::Approved)
        ->and($decision->decided_by)->toBe($approver->id)
        ->and($decision->remarks)->toBe('Budget and quantities verified.')
        ->and($decision->decided_at?->equalTo(now()))->toBeTrue();
});

test('an administrator can reject a submitted request with required remarks', function () {
    $this->travelTo(CarbonImmutable::parse('2026-07-23 11:00:00'));

    $administrator = User::factory()->create(['role' => UserRole::Administrator]);
    $requester = User::factory()->create(['role' => UserRole::Requester]);
    $purchaseRequest = makeApprovalPurchaseRequest($requester);

    $this->actingAs($administrator)
        ->patch(route('approvals.reject', $purchaseRequest), [
            'remarks' => '  Attach the approved department budget.  ',
        ])
        ->assertSessionHasNoErrors()
        ->assertRedirect(route('approvals.index'));

    expect($purchaseRequest->refresh()->status)->toBe(PurchaseRequestStatus::Rejected);

    $decision = PurchaseRequestDecision::query()->sole();

    expect($decision->purchase_request_id)->toBe($purchaseRequest->id)
        ->and($decision->decision)->toBe(PurchaseRequestDecisionType::Rejected)
        ->and($decision->decided_by)->toBe($administrator->id)
        ->and($decision->remarks)->toBe('Attach the approved department budget.')
        ->and($decision->decided_at?->equalTo(now()))->toBeTrue();
});

test('rejection remarks cannot be blank', function () {
    $approver = User::factory()->create(['role' => UserRole::Approver]);
    $requester = User::factory()->create(['role' => UserRole::Requester]);
    $purchaseRequest = makeApprovalPurchaseRequest($requester);

    $this->actingAs($approver)
        ->from(route('approvals.index'))
        ->patch(route('approvals.reject', $purchaseRequest), [
            'remarks' => '   ',
        ])
        ->assertInvalid('remarks')
        ->assertRedirect(route('approvals.index'));

    expect($purchaseRequest->refresh()->status)->toBe(PurchaseRequestStatus::Submitted);
    $this->assertDatabaseCount('purchase_request_decisions', 0);
});

test('approval remarks are optional', function () {
    $approver = User::factory()->create(['role' => UserRole::Approver]);
    $requester = User::factory()->create(['role' => UserRole::Requester]);
    $purchaseRequest = makeApprovalPurchaseRequest($requester);

    $this->actingAs($approver)
        ->patch(route('approvals.approve', $purchaseRequest))
        ->assertSessionHasNoErrors();

    expect($purchaseRequest->refresh()->status)->toBe(PurchaseRequestStatus::Approved)
        ->and(PurchaseRequestDecision::query()->sole()->remarks)->toBeNull();
});

test('decision remarks cannot exceed two thousand characters', function (string $routeName) {
    $approver = User::factory()->create(['role' => UserRole::Approver]);
    $requester = User::factory()->create(['role' => UserRole::Requester]);
    $purchaseRequest = makeApprovalPurchaseRequest($requester);

    $this->actingAs($approver)
        ->patch(route($routeName, $purchaseRequest), [
            'remarks' => str_repeat('a', 2001),
        ])
        ->assertInvalid('remarks');

    expect($purchaseRequest->refresh()->status)->toBe(PurchaseRequestStatus::Submitted);
    $this->assertDatabaseCount('purchase_request_decisions', 0);
})->with([
    'approve' => 'approvals.approve',
    'reject' => 'approvals.reject',
]);

test('non-submitted requests cannot be decided', function (
    PurchaseRequestStatus $status,
    string $routeName,
) {
    $approver = User::factory()->create(['role' => UserRole::Approver]);
    $requester = User::factory()->create(['role' => UserRole::Requester]);
    $purchaseRequest = makeApprovalPurchaseRequest($requester, $status);

    $this->actingAs($approver)
        ->patch(route($routeName, $purchaseRequest), [
            'remarks' => 'A decision must not be recorded.',
        ])
        ->assertForbidden();

    expect($purchaseRequest->refresh()->status)->toBe($status);
    $this->assertDatabaseCount('purchase_request_decisions', 0);
})->with([
    'draft cannot be approved' => [PurchaseRequestStatus::Draft, 'approvals.approve'],
    'approved cannot be rejected' => [PurchaseRequestStatus::Approved, 'approvals.reject'],
    'rejected cannot be approved' => [PurchaseRequestStatus::Rejected, 'approvals.approve'],
    'converted cannot be rejected' => [
        PurchaseRequestStatus::ConvertedToPurchaseOrder,
        'approvals.reject',
    ],
]);

test('a request cannot be decided more than once from stale review actions', function () {
    $this->travelTo(CarbonImmutable::parse('2026-07-23 12:00:00'));

    $firstApprover = User::factory()->create(['role' => UserRole::Approver]);
    $secondApprover = User::factory()->create(['role' => UserRole::Approver]);
    $requester = User::factory()->create(['role' => UserRole::Requester]);
    $purchaseRequest = makeApprovalPurchaseRequest($requester);

    $this->actingAs($firstApprover)
        ->patch(route('approvals.approve', $purchaseRequest), [
            'remarks' => 'Original approval.',
        ])
        ->assertSessionHasNoErrors();

    $originalDecision = PurchaseRequestDecision::query()->sole();
    $originalDecisionDate = $originalDecision->decided_at;

    $this->travelTo(CarbonImmutable::parse('2026-07-23 13:00:00'));

    $this->actingAs($secondApprover)
        ->patch(route('approvals.reject', $purchaseRequest), [
            'remarks' => 'Stale rejection.',
        ])
        ->assertForbidden();

    expect($purchaseRequest->refresh()->status)->toBe(PurchaseRequestStatus::Approved)
        ->and(PurchaseRequestDecision::query()->count())->toBe(1);

    $originalDecision->refresh();

    expect($originalDecision->decision)->toBe(PurchaseRequestDecisionType::Approved)
        ->and($originalDecision->decided_by)->toBe($firstApprover->id)
        ->and($originalDecision->remarks)->toBe('Original approval.')
        ->and($originalDecision->decided_at?->equalTo($originalDecisionDate))->toBeTrue();
});

test('the decision action rechecks a stale request inside its transaction', function () {
    $approver = User::factory()->create(['role' => UserRole::Approver]);
    $requester = User::factory()->create(['role' => UserRole::Requester]);
    $stalePurchaseRequest = makeApprovalPurchaseRequest($requester);

    PurchaseRequest::query()
        ->whereKey($stalePurchaseRequest)
        ->update(['status' => PurchaseRequestStatus::Approved]);

    expect(fn () => app(DecidePurchaseRequest::class)->handle(
        $stalePurchaseRequest,
        $approver,
        PurchaseRequestDecisionType::Rejected,
        'This stale decision must not be saved.',
    ))->toThrow(ValidationException::class);

    expect($stalePurchaseRequest->refresh()->status)->toBe(PurchaseRequestStatus::Approved);
    $this->assertDatabaseCount('purchase_request_decisions', 0);
});

test('the approval queue can search and filter requests while exposing status counts', function () {
    $approver = User::factory()->create(['role' => UserRole::Approver]);
    $requester = User::factory()->create([
        'role' => UserRole::Requester,
        'name' => 'Queue Requester',
    ]);
    $matchingRequest = makeApprovalPurchaseRequest($requester, attributes: [
        'reference' => 'PR-2026-NEEDLE',
        'purpose' => 'Specialized safety equipment.',
    ]);
    makeApprovalPurchaseRequest($requester, attributes: [
        'reference' => 'PR-2026-OTHER',
        'purpose' => 'Routine stationery.',
    ]);
    makeApprovalPurchaseRequest($requester, PurchaseRequestStatus::Approved, [
        'reference' => 'PR-2026-APPROVED',
    ]);
    makeApprovalPurchaseRequest($requester, PurchaseRequestStatus::Draft, [
        'reference' => 'PR-2026-DRAFT',
    ]);

    $this->actingAs($approver)
        ->get(route('approvals.index', [
            'search' => 'NEEDLE',
            'status' => PurchaseRequestStatus::Submitted->value,
        ]))
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->component('approvals/index')
            ->has('purchaseRequests.data', 1)
            ->where('purchaseRequests.data.0.id', $matchingRequest->id)
            ->where('filters.search', 'NEEDLE')
            ->where('filters.status', PurchaseRequestStatus::Submitted->value)
            ->where('counts.submitted', 2)
            ->where('counts.approved', 1));
});

test('requesters see the decision and remarks for only their own requests', function () {
    $approver = User::factory()->create([
        'role' => UserRole::Approver,
        'name' => 'Avery Approver',
    ]);
    $requester = User::factory()->create(['role' => UserRole::Requester]);
    $otherRequester = User::factory()->create(['role' => UserRole::Requester]);
    $ownRequest = makeApprovalPurchaseRequest($requester);
    $otherRequest = makeApprovalPurchaseRequest($otherRequester);

    $this->actingAs($approver)
        ->patch(route('approvals.reject', $ownRequest), [
            'remarks' => 'Clarify the requested delivery schedule.',
        ])
        ->assertSessionHasNoErrors();

    $this->patch(route('approvals.approve', $otherRequest), [
        'remarks' => 'Other requester approval.',
    ])->assertSessionHasNoErrors();

    $this->actingAs($requester)
        ->get(route('purchase-requests.index'))
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->component('purchase-requests/index')
            ->has('purchaseRequests.data', 1)
            ->where('purchaseRequests.data.0.id', $ownRequest->id)
            ->where(
                'purchaseRequests.data.0.status',
                PurchaseRequestStatus::Rejected->value,
            )
            ->has('purchaseRequests.data.0.decisions', 1)
            ->where(
                'purchaseRequests.data.0.decisions.0.decision',
                PurchaseRequestDecisionType::Rejected->value,
            )
            ->where(
                'purchaseRequests.data.0.decisions.0.remarks',
                'Clarify the requested delivery schedule.',
            )
            ->where(
                'purchaseRequests.data.0.decisions.0.reviewer.id',
                $approver->id,
            ));
});

test('a rejected request can be resubmitted and decided again without losing history', function () {
    $firstApprover = User::factory()->create(['role' => UserRole::Approver]);
    $secondApprover = User::factory()->create(['role' => UserRole::Approver]);
    $requester = User::factory()->create(['role' => UserRole::Requester]);
    $purchaseRequest = makeApprovalPurchaseRequest($requester);

    $this->actingAs($firstApprover)
        ->patch(route('approvals.reject', $purchaseRequest), [
            'remarks' => 'Please provide a clearer business reason.',
        ])
        ->assertSessionHasNoErrors();

    $firstDecisionId = PurchaseRequestDecision::query()->sole()->id;

    $this->actingAs($requester)
        ->patch(route('purchase-requests.submit', $purchaseRequest))
        ->assertSessionHasNoErrors();

    expect($purchaseRequest->refresh()->status)->toBe(PurchaseRequestStatus::Submitted);

    $this->actingAs($secondApprover)
        ->patch(route('approvals.approve', $purchaseRequest), [
            'remarks' => 'The revised request is complete.',
        ])
        ->assertSessionHasNoErrors();

    expect($purchaseRequest->refresh()->status)->toBe(PurchaseRequestStatus::Approved)
        ->and(PurchaseRequestDecision::query()
            ->whereBelongsTo($purchaseRequest)
            ->count())->toBe(2);

    $this->assertDatabaseHas('purchase_request_decisions', [
        'id' => $firstDecisionId,
        'purchase_request_id' => $purchaseRequest->id,
        'decision' => PurchaseRequestDecisionType::Rejected->value,
        'decided_by' => $firstApprover->id,
        'remarks' => 'Please provide a clearer business reason.',
    ]);
    $this->assertDatabaseHas('purchase_request_decisions', [
        'purchase_request_id' => $purchaseRequest->id,
        'decision' => PurchaseRequestDecisionType::Approved->value,
        'decided_by' => $secondApprover->id,
        'remarks' => 'The revised request is complete.',
    ]);
});

test('a reviewer with approval history cannot delete their account', function () {
    $approver = User::factory()->create(['role' => UserRole::Approver]);
    $requester = User::factory()->create(['role' => UserRole::Requester]);
    $purchaseRequest = makeApprovalPurchaseRequest($requester);

    $this->actingAs($approver)
        ->patch(route('approvals.approve', $purchaseRequest))
        ->assertSessionHasNoErrors();

    $this->from(route('profile.edit'))
        ->delete(route('profile.destroy'), [
            'password' => 'password',
        ])
        ->assertSessionHasErrors('account')
        ->assertRedirect(route('profile.edit'));

    expect($approver->fresh())->not->toBeNull();
    $this->assertAuthenticatedAs($approver);
});
