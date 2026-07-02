<?php

namespace Tests\Unit;

use Tests\TestCase;
use Illuminate\Foundation\Testing\RefreshDatabase;
use App\Models\User;
use Spatie\Permission\Models\Role;

class UserModelTest extends TestCase
{
    use RefreshDatabase;

    /**
     * Test that a user can be assigned a role successfully.
     */
    public function test_user_can_be_assigned_role()
    {
        // Setup Role
        $role = Role::create(['name' => 'admin', 'guard_name' => 'web']);

        // Create User
        $user = User::factory()->create();

        // Assign Role
        $user->assignRole('admin');

        // Assert
        $this->assertTrue($user->hasRole('admin'));
        $this->assertFalse($user->hasRole('user'));
    }
}
