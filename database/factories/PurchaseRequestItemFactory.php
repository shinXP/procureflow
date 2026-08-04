<?php

namespace Database\Factories;

use App\Models\Product;
use App\Models\PurchaseRequest;
use App\Models\PurchaseRequestItem;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<PurchaseRequestItem>
 */
class PurchaseRequestItemFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'purchase_request_id' => PurchaseRequest::factory(),
            'product_id' => Product::factory(),
            'product_name' => fake()->words(3, true),
            'sku' => fake()->unique()->bothify('PRD-####'),
            'unit' => fake()->randomElement(['piece', 'box', 'pack', 'ream']),
            'quantity' => fake()->randomFloat(2, 1, 100),
            'notes' => fake()->optional()->sentence(),
        ];
    }
}
