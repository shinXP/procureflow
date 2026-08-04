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
        Schema::table('purchase_requests', function (Blueprint $table) {
            $table->dropForeign(['requester_id']);
            $table->foreign('requester_id')
                ->references('id')
                ->on('users')
                ->restrictOnDelete();

            $table->string('status')->default('draft')->change();
            $table->timestamp('submitted_at')->nullable()->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('purchase_requests', function (Blueprint $table) {
            $table->dropForeign(['requester_id']);
            $table->foreign('requester_id')
                ->references('id')
                ->on('users')
                ->cascadeOnDelete();

            $table->string('status')->default('submitted')->change();
            $table->timestamp('submitted_at')->nullable(false)->change();
        });
    }
};
