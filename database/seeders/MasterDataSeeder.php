<?php

namespace Database\Seeders;

use App\Models\Category;
use App\Models\Product;
use App\Models\Supplier;
use Illuminate\Database\Seeder;

class MasterDataSeeder extends Seeder
{
    public function run(): void
    {
        $officeSupplies = Category::query()->updateOrCreate(
            ['name' => 'Office Supplies'],
            ['description' => 'Paper, writing materials, and everyday office consumables.', 'is_active' => true],
        );

        $itEquipment = Category::query()->updateOrCreate(
            ['name' => 'IT Equipment'],
            ['description' => 'Computers, accessories, and information technology equipment.', 'is_active' => true],
        );

        Category::query()->updateOrCreate(
            ['name' => 'Cleaning Supplies'],
            ['description' => 'Cleaning products and workplace sanitation supplies.', 'is_active' => true],
        );

        Product::query()->updateOrCreate(
            ['sku' => 'OFF-0001'],
            [
                'category_id' => $officeSupplies->id,
                'name' => 'A4 Copy Paper',
                'description' => 'Standard 80 gsm white copy paper.',
                'unit' => 'ream',
                'reorder_level' => 20,
                'is_active' => true,
            ],
        );

        Product::query()->updateOrCreate(
            ['sku' => 'OFF-0002'],
            [
                'category_id' => $officeSupplies->id,
                'name' => 'Black Ballpoint Pen',
                'description' => 'Black ink pen for general office use.',
                'unit' => 'box',
                'reorder_level' => 10,
                'is_active' => true,
            ],
        );

        Product::query()->updateOrCreate(
            ['sku' => 'IT-0001'],
            [
                'category_id' => $itEquipment->id,
                'name' => 'USB Keyboard',
                'description' => 'Wired full-size USB keyboard.',
                'unit' => 'piece',
                'reorder_level' => 5,
                'is_active' => true,
            ],
        );

        Supplier::query()->updateOrCreate(
            ['code' => 'SUP-001'],
            [
                'name' => 'Prime Office Solutions',
                'contact_person' => 'Maria Santos',
                'email' => 'sales@primeoffice.test',
                'phone' => '0917 000 0001',
                'address' => 'Isulan, Sultan Kudarat',
                'is_active' => true,
            ],
        );

        Supplier::query()->updateOrCreate(
            ['code' => 'SUP-002'],
            [
                'name' => 'Mindanao Tech Supply',
                'contact_person' => 'John Dela Cruz',
                'email' => 'orders@mindanaotech.test',
                'phone' => '0917 000 0002',
                'address' => 'General Santos City',
                'is_active' => true,
            ],
        );
    }
}
