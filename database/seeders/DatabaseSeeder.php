<?php

namespace Database\Seeders;

use App\Enums\UserRole;
use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $demoUsers = [
            ['name' => 'Admin User', 'email' => 'admin@procureflow.test', 'role' => UserRole::Administrator],
            ['name' => 'Requesting User', 'email' => 'requester@procureflow.test', 'role' => UserRole::Requester],
            ['name' => 'Approving User', 'email' => 'approver@procureflow.test', 'role' => UserRole::Approver],
            ['name' => 'Inventory Officer', 'email' => 'inventory@procureflow.test', 'role' => UserRole::InventoryOfficer],
        ];

        foreach ($demoUsers as $demoUser) {
            User::query()->updateOrCreate(
                ['email' => $demoUser['email']],
                [
                    'name' => $demoUser['name'],
                    'password' => 'password',
                    'email_verified_at' => now(),
                    'role' => $demoUser['role'],
                ],
            );
        }

        $this->call(MasterDataSeeder::class);
    }
}
