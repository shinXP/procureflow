<?php

namespace App\Actions;

use App\Models\DocumentSequence;
use App\Models\PurchaseRequest;
use Illuminate\Support\Facades\DB;

class GenerateDocumentNumber
{
    public function handle(string $documentType, string $prefix, int $year): string
    {
        $existingMaximum = $this->existingMaximum(
            $documentType,
            $prefix,
            $year,
        );

        DB::table('document_sequences')->insertOrIgnore([
            'document_type' => $documentType,
            'year' => $year,
            'last_number' => $existingMaximum,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $sequence = DocumentSequence::query()
            ->where('document_type', $documentType)
            ->where('year', $year)
            ->lockForUpdate()
            ->firstOrFail();

        $nextNumber = max($sequence->last_number, $existingMaximum) + 1;

        $sequence->update(['last_number' => $nextNumber]);

        return sprintf('%s-%d-%04d', $prefix, $year, $nextNumber);
    }

    private function existingMaximum(
        string $documentType,
        string $prefix,
        int $year,
    ): int {
        if ($documentType !== 'purchase_request') {
            return 0;
        }

        $pattern = sprintf('/^%s-%d-(\d+)$/', preg_quote($prefix, '/'), $year);

        return PurchaseRequest::query()
            ->where('reference', 'like', "{$prefix}-{$year}-%")
            ->pluck('reference')
            ->reduce(function (int $maximum, string $reference) use ($pattern): int {
                if (preg_match($pattern, $reference, $matches) !== 1) {
                    return $maximum;
                }

                return max($maximum, (int) $matches[1]);
            }, 0);
    }
}
