<?php

use App\Http\Controllers\MasterData\CategoryController;
use App\Http\Controllers\MasterData\ProductController;
use App\Http\Controllers\MasterData\SupplierController;
use App\Http\Controllers\PurchaseRequestApprovalController;
use App\Http\Controllers\PurchaseRequestController;
use App\Http\Controllers\RequesterCatalogController;
use Illuminate\Support\Facades\Route;

Route::inertia('/', 'welcome')->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::inertia('dashboard', 'dashboard')->name('dashboard');

    Route::get('admin', fn () => redirect()->route('dashboard'))
        ->middleware('role:admin')
        ->name('admin.index');

    Route::middleware('role:admin,requester')->group(function () {
        Route::get('catalog', RequesterCatalogController::class)->name('catalog.index');
        Route::patch('purchase-requests/{purchase_request}/submit', [PurchaseRequestController::class, 'submit'])
            ->name('purchase-requests.submit');
        Route::resource('purchase-requests', PurchaseRequestController::class)
            ->only(['index', 'store', 'update', 'destroy']);
    });

    Route::middleware('role:admin,approver')->group(function () {
        Route::get('approvals', [PurchaseRequestApprovalController::class, 'index'])
            ->name('approvals.index');
        Route::patch('approvals/{purchase_request}/approve', [PurchaseRequestApprovalController::class, 'approve'])
            ->name('approvals.approve');
        Route::patch('approvals/{purchase_request}/reject', [PurchaseRequestApprovalController::class, 'reject'])
            ->name('approvals.reject');
    });

    Route::middleware('role:admin,inventory_officer')->group(function () {
        Route::resource('categories', CategoryController::class)
            ->only(['index', 'store', 'update', 'destroy']);

        Route::resource('products', ProductController::class)
            ->only(['index', 'store', 'update', 'destroy']);

        Route::resource('suppliers', SupplierController::class)
            ->only(['index', 'store', 'update', 'destroy']);
    });
});

require __DIR__.'/settings.php';
