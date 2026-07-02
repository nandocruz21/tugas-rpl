<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;
use App\Models\User;

class DocumentUploadTest extends TestCase
{
    use RefreshDatabase;

    /**
     * Test successful document upload and versioning.
     */
    public function test_user_can_upload_document()
    {
        // Mock Storage so we don't save actual files to disk during testing
        Storage::fake('local');

        // Create an authenticated user
        $user = User::factory()->create();

        // Create a fake file
        $file = UploadedFile::fake()->create('laporan.pdf', 1000, 'application/pdf');

        $response = $this->actingAs($user)->postJson('/api/v1/documents', [
            'name' => 'laporan_test',
            'file' => $file
        ]);

        $response->assertStatus(201)
                 ->assertJson([
                     'status' => 'success',
                     'message' => 'Document uploaded successfully',
                 ]);

        // Verify the file was stored (Laravel automatically hashes the filename or uses a unique ID)
        $this->assertDatabaseHas('documents', [
            'name' => 'laporan_test',
            'owner_id' => $user->id
        ]);

        $this->assertDatabaseHas('document_versions', [
            'version_number' => 1,
            'file_format' => 'pdf'
        ]);
        
        $this->assertDatabaseCount('audit_logs', 1);
    }
}
