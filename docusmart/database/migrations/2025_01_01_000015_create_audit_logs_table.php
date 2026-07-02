<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Immutable audit trail — no update/delete operations ever run on this table.
     * Maps to the "Admin Audit Trail & Restore" Stitch screen.
     */
    public function up(): void
    {
        Schema::create('audit_logs', function (Blueprint $table) {
            $table->id();

            // Actor (nullable for system-generated events)
            $table->foreignId('user_id')
                  ->nullable()
                  ->constrained('users')
                  ->onDelete('set null');

            // Action taxonomy matching UC definitions
            $table->string('action', 50)
                  ->comment('UPLOAD, DOWNLOAD, VIEW, EDIT, DELETE, RESTORE, SHARE, UNSHARE, LOGIN, LOGOUT, PERMISSION_GRANT, PERMISSION_REVOKE');

            // Target resource
            $table->string('resource_type', 50)
                  ->comment('DOCUMENT, DOCUMENT_VERSION, FOLDER, USER');
            $table->unsignedBigInteger('resource_id')->nullable();
            $table->string('resource_name', 255)->nullable()->comment('Snapshot of name at time of action');

            // Rich metadata for audit detail panel
            $table->json('metadata')->nullable()->comment('e.g., {from_version: 2, to_version: 1} for RESTORE');

            // Context
            $table->string('ip_address', 45)->nullable();
            $table->text('user_agent')->nullable();

            // Result
            $table->enum('status', ['success', 'failed'])->default('success');
            $table->text('failure_reason')->nullable();

            $table->timestamp('created_at')->useCurrent();

            // Indexes for the audit trail list view (filtered by date, user, action)
            $table->index(['user_id', 'created_at']);
            $table->index(['resource_type', 'resource_id']);
            $table->index(['action', 'created_at']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('audit_logs');
    }
};
