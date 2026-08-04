<?php

namespace Database\Factories;

use App\Enums\PurchaseRequestStatus;
use App\Models\PurchaseRequest;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<PurchaseRequest>
 */
class PurchaseRequestFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'requester_id' => User::factory(),
            'reference' => sprintf(
                'PR-%d-%04d',
                now()->year,
                fake()->unique()->numberBetween(1, 9999),
            ),
            'purpose' => fake()->sentence(),
            'status' => PurchaseRequestStatus::Draft,
            'needed_at' => fake()->dateTimeBetween('+1 day', '+2 months'),
            'submitted_at' => null,
        ];
    }

    public function submitted(): static
    {
        return $this->state(fn (): array => [
            'status' => PurchaseRequestStatus::Submitted,
            'submitted_at' => now(),
        ]);
    }

    public function rejected(): static
    {
        return $this->state(fn (): array => [
            'status' => PurchaseRequestStatus::Rejected,
            'submitted_at' => now()->subDay(),
        ]);
    }
}
