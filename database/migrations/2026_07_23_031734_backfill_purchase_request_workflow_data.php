<?php

use Carbon\CarbonImmutable;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        DB::table('purchase_requests')
            ->where('status', 'under_review')
            ->update(['status' => 'submitted']);

        DB::table('purchase_requests')
            ->where('status', 'completed')
            ->update(['status' => 'converted_to_purchase_order']);

        DB::table('purchase_requests')
            ->select(['id', 'submitted_at', 'created_at'])
            ->whereNull('needed_at')
            ->orderBy('id')
            ->chunkById(100, function (Collection $purchaseRequests): void {
                foreach ($purchaseRequests as $purchaseRequest) {
                    $fallbackDate = $purchaseRequest->submitted_at
                        ?? $purchaseRequest->created_at
                        ?? now()->toDateString();

                    DB::table('purchase_requests')
                        ->where('id', (int) $purchaseRequest->id)
                        ->whereNull('needed_at')
                        ->update([
                            'needed_at' => CarbonImmutable::parse((string) $fallbackDate)->toDateString(),
                        ]);
                }
            });

        $yearlyMaximums = [];

        foreach (DB::table('purchase_requests')
            ->select(['reference'])
            ->orderBy('id')
            ->cursor() as $purchaseRequest) {
            if (preg_match('/^PR-(\d{4})-(\d+)$/', (string) $purchaseRequest->reference, $matches) !== 1) {
                continue;
            }

            $year = (int) $matches[1];
            $number = (int) $matches[2];
            $yearlyMaximums[$year] = max($yearlyMaximums[$year] ?? 0, $number);
        }

        foreach ($yearlyMaximums as $year => $lastNumber) {
            DB::table('document_sequences')->insertOrIgnore([
                'document_type' => 'purchase_request',
                'year' => $year,
                'last_number' => $lastNumber,
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            DB::table('document_sequences')
                ->where('document_type', 'purchase_request')
                ->where('year', $year)
                ->where('last_number', '<', $lastNumber)
                ->update([
                    'last_number' => $lastNumber,
                    'updated_at' => now(),
                ]);
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        DB::table('purchase_requests')
            ->where('status', 'converted_to_purchase_order')
            ->update(['status' => 'completed']);

        DB::table('purchase_requests')
            ->where('status', 'draft')
            ->update(['status' => 'submitted']);

        DB::table('purchase_requests')
            ->select(['id', 'updated_at', 'created_at'])
            ->whereNull('submitted_at')
            ->orderBy('id')
            ->chunkById(100, function (Collection $purchaseRequests): void {
                foreach ($purchaseRequests as $purchaseRequest) {
                    $fallbackDate = $purchaseRequest->updated_at
                        ?? $purchaseRequest->created_at
                        ?? now();

                    DB::table('purchase_requests')
                        ->where('id', (int) $purchaseRequest->id)
                        ->whereNull('submitted_at')
                        ->update([
                            'submitted_at' => CarbonImmutable::parse((string) $fallbackDate),
                        ]);
                }
            });
    }
};
