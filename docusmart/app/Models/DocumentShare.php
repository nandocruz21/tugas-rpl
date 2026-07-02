<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DocumentShare extends Model
{
    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'document_id',
        'shared_with_user_id',
        'shared_by_user_id',
        'access_level',
        'can_reshare',
        'expires_at',
        'message',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'can_reshare' => 'boolean',
            'expires_at'  => 'datetime',
        ];
    }

    // ─────────────────────────────────────────────
    // Relationships
    // ─────────────────────────────────────────────

    /**
     * The document being shared.
     */
    public function document(): BelongsTo
    {
        return $this->belongsTo(Document::class);
    }

    /**
     * The user who received the share.
     */
    public function sharedWith(): BelongsTo
    {
        return $this->belongsTo(User::class, 'shared_with_user_id');
    }

    /**
     * The user who granted the share.
     */
    public function sharedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'shared_by_user_id');
    }

    // ─────────────────────────────────────────────
    // Helpers
    // ─────────────────────────────────────────────

    /**
     * Check if this share has expired.
     */
    public function isExpired(): bool
    {
        return $this->expires_at !== null && $this->expires_at->isPast();
    }

    /**
     * Check if user has at least a given access level.
     * Hierarchy: view < download < edit < full
     */
    public function hasAccess(string $requiredLevel): bool
    {
        $hierarchy = ['view' => 1, 'download' => 2, 'edit' => 3, 'full' => 4];

        return ($hierarchy[$this->access_level] ?? 0) >= ($hierarchy[$requiredLevel] ?? 999);
    }
}
