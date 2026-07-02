<?php

namespace Tests\Unit;

use Tests\TestCase;
use Illuminate\Foundation\Testing\RefreshDatabase;
use App\Models\User;
use App\Models\Document;
use App\Models\DocumentVersion;

class DocumentModelTest extends TestCase
{
    use RefreshDatabase;

    /**
     * Test that a document can be created and versions are correctly related.
     */
    public function test_document_has_many_versions_and_owner()
    {
        $user = User::factory()->create();

        $document = Document::create([
            'name' => 'Laporan Keuangan.pdf',
            'owner_id' => $user->id,
            'is_encrypted' => true
        ]);

        $version1 = DocumentVersion::create([
            'document_id' => $document->id,
            'version_number' => 1,
            'file_path' => 'docs/laporan_v1.pdf',
            'file_size' => 1024,
            'file_format' => 'pdf',
            'uploaded_by' => $user->id
        ]);

        $version2 = DocumentVersion::create([
            'document_id' => $document->id,
            'version_number' => 2,
            'file_path' => 'docs/laporan_v2.pdf',
            'file_size' => 2048,
            'file_format' => 'pdf',
            'uploaded_by' => $user->id
        ]);

        // Update current version
        $document->update(['current_version_id' => $version2->id]);

        $this->assertEquals(2, $document->versions()->count());
        $this->assertEquals(2, $document->currentVersion->version_number);
        $this->assertEquals($user->id, $document->owner->id);
    }
}
