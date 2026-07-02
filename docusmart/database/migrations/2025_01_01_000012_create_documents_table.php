<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Core documents table. current_version_id is denormalized for performance.
     * It is populated AFTER document_versions is created via a foreign key set later.
     */
    public function up(): void
    {
        Schema::create('documents', function (Blueprint $table) {
            $table->id();
            $table->string('name', 255);
            $table->string('category', 50)->nullable()->comment('e.g., Contract, Report, Invoice');
            $table->text('description')->nullable();
            $table->string('tags')->nullable()->comment('Comma-separated tags for search');

            // Relationships
            $table->foreignId('folder_id')
                  ->nullable()
                  ->constrained('folders')
                  ->onDelete('set null');
            $table->foreignId('owner_id')
                  ->constrained('users')
                  ->onDelete('cascade');

            // Denormalized pointer to the latest version (updated on every upload/restore)
            $table->unsignedBigInteger('current_version_id')->nullable();

            // Security & status
            $table->boolean('is_encrypted')->default(true);
            $table->boolean('is_locked')->default(false)->comment('Prevents edits when true');
            $table->enum('status', ['active', 'archived', 'deleted'])->default('active');

            $table->timestamps();
            $table->softDeletes();

            $table->index(['owner_id', 'folder_id', 'status']);
            $table->index('category');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('documents');
    }
};
