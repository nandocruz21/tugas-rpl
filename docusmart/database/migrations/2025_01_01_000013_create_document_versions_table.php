<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Stores every version of a document. The automatic versioning logic (UC-07)
     * increments version_number and updates documents.current_version_id on each upload.
     * We also add the deferred FK from documents.current_version_id here.
     */
    public function up(): void
    {
        Schema::create('document_versions', function (Blueprint $table) {
            $table->id();

            $table->foreignId('document_id')
                  ->constrained('documents')
                  ->onDelete('cascade');

            $table->unsignedInteger('version_number')->comment('Auto-incremented per document');
            $table->string('label', 50)->nullable()->comment('e.g., "v1.0", "Draft", user-defined');

            // File storage
            $table->text('file_path')->comment('Encrypted path on local/S3 storage');
            $table->unsignedBigInteger('file_size')->nullable()->comment('Bytes, max 50MB enforced in controller');
            $table->string('file_format', 10)->nullable()->comment('pdf, docx, xlsx, etc.');
            $table->string('mime_type', 100)->nullable();
            $table->string('original_filename', 255)->nullable();

            // Integrity & security
            $table->string('checksum', 64)->nullable()->comment('SHA-256 hash for integrity verification');
            $table->string('encryption_key_id', 100)->nullable()->comment('Reference to AES-256 key vault entry');

            // Who uploaded this version
            $table->foreignId('uploaded_by')
                  ->constrained('users')
                  ->onDelete('cascade');

            $table->text('change_summary')->nullable()->comment('Optional description of changes in this version');
            $table->boolean('is_current')->default(false);

            $table->timestamp('created_at')->useCurrent();

            // Composite unique: one version_number per document
            $table->unique(['document_id', 'version_number']);
            $table->index(['document_id', 'is_current']);
        });

        // Now add the deferred FK for documents.current_version_id
        Schema::table('documents', function (Blueprint $table) {
            $table->foreign('current_version_id')
                  ->references('id')
                  ->on('document_versions')
                  ->onDelete('set null');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('documents', function (Blueprint $table) {
            $table->dropForeign(['current_version_id']);
        });

        Schema::dropIfExists('document_versions');
    }
};
