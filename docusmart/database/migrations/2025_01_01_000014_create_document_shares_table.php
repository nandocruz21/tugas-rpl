<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Per-document per-user Access Control List (ACL).
     * Visible in the "Pratinjau Kontrol Akses" screens.
     */
    public function up(): void
    {
        Schema::create('document_shares', function (Blueprint $table) {
            $table->id();

            $table->foreignId('document_id')
                  ->constrained('documents')
                  ->onDelete('cascade');

            $table->foreignId('shared_with_user_id')
                  ->constrained('users')
                  ->onDelete('cascade');

            $table->foreignId('shared_by_user_id')
                  ->constrained('users')
                  ->onDelete('cascade');

            $table->enum('access_level', ['view', 'edit', 'download', 'full'])
                  ->default('view')
                  ->comment('Granular ACL: view=read-only, edit=can upload new versions, download=can export, full=all+share');

            $table->boolean('can_reshare')->default(false);
            $table->timestamp('expires_at')->nullable()->comment('Optional share expiry');
            $table->text('message')->nullable()->comment('Optional note sent with share invitation');

            $table->timestamps();

            // One row per document per user (upsert on re-share)
            $table->unique(['document_id', 'shared_with_user_id']);
            $table->index('shared_with_user_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('document_shares');
    }
};
