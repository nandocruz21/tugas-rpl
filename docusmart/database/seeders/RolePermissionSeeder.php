<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use App\Models\User;

class RolePermissionSeeder extends Seeder
{
    /**
     * Run the database seeds.
     * Creates DocuSmart roles and granular permissions, then seeds a default admin user.
     */
    public function run(): void
    {
        // Reset cached roles and permissions
        app()[\Spatie\Permission\PermissionRegistrar::class]->forgetCachedPermissions();

        // ─────────────────────────────────────────────
        // 1. Define granular permissions
        // ─────────────────────────────────────────────
        $permissions = [
            // Document permissions
            'document.view',
            'document.create',
            'document.edit',
            'document.delete',
            'document.download',
            'document.share',
            'document.restore',

            // Folder permissions
            'folder.view',
            'folder.create',
            'folder.edit',
            'folder.delete',

            // Version permissions
            'version.view',
            'version.upload',
            'version.restore',

            // Admin permissions
            'user.view',
            'user.manage',
            'audit.view',
            'audit.export',
            'role.assign',
        ];

        foreach ($permissions as $permName) {
            Permission::firstOrCreate(['name' => $permName, 'guard_name' => 'web']);
        }

        // ─────────────────────────────────────────────
        // 2. Create roles and assign permissions
        // ─────────────────────────────────────────────

        // VIEWER — read-only access
        $viewer = Role::firstOrCreate(['name' => 'viewer', 'guard_name' => 'web']);
        $viewer->syncPermissions([
            'document.view',
            'folder.view',
            'version.view',
        ]);

        // USER — standard collaborator
        $user = Role::firstOrCreate(['name' => 'user', 'guard_name' => 'web']);
        $user->syncPermissions([
            'document.view',
            'document.create',
            'document.edit',
            'document.delete',
            'document.download',
            'document.share',
            'document.restore',
            'folder.view',
            'folder.create',
            'folder.edit',
            'folder.delete',
            'version.view',
            'version.upload',
            'version.restore',
        ]);

        // ADMIN — full access
        $admin = Role::firstOrCreate(['name' => 'admin', 'guard_name' => 'web']);
        $admin->syncPermissions(Permission::where('guard_name', 'web')->get());

        // ─────────────────────────────────────────────
        // 3. Seed default admin user
        // ─────────────────────────────────────────────
        $adminUser = User::firstOrCreate(
            ['email' => 'admin@docusmart.local'],
            [
                'name'       => 'DocuSmart Admin',
                'password'   => bcrypt('Admin@123!'),
                'department' => 'IT',
                'job_title'  => 'System Administrator',
                'is_active'  => true,
            ]
        );

        $adminUser->assignRole('admin');

        $this->command->info('✅ Roles, permissions, and default admin user seeded successfully.');
        $this->command->info('   Admin credentials: admin@docusmart.local / Admin@123!');
        $this->command->warn('   ⚠️  Change the admin password immediately in production!');
    }
}
