<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('purchase_request_decisions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('purchase_request_id')
                ->constrained()
                ->cascadeOnDelete();
            $table->string('decision')->index();
            $table->text('remarks')->nullable();
            $table->foreignId('decided_by')
                ->constrained('users')
                ->restrictOnDelete();
            $table->timestamp('decided_at')->index();
            $table->timestamps();

            $table->index(
                ['purchase_request_id', 'decided_at', 'id'],
                'pr_decisions_request_decided_index',
            );
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('purchase_request_decisions');
    }
};
