<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AuditLog extends Model
{
    /**
     * Audit logs are append-only — no updates or deletes ever occur.
     */
    public const UPDATED_AT = null;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'user_id',
        'action',
        'resource_type',
        'resource_id',
        'resource_name',
        'metadata',
        'ip_address',
        'user_agent',
        'status',
        'failure_reason',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'metadata'   => 'array',
            'created_at' => 'datetime',
        ];
    }

    // ─────────────────────────────────────────────
    // Relationships
    // ─────────────────────────────────────────────

    /**
     * The user who triggered this audit event (null for system events).
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    // ─────────────────────────────────────────────
    // Factory Method
    // ─────────────────────────────────────────────

    /**
     * Convenience factory to create an audit log entry from a request context.
     * Used inside controllers/services:
     *
     *   AuditLog::record($request, 'UPLOAD', 'DOCUMENT', $document->id, $document->name, [
     *       'version' => $version->version_number,
     *   ]);
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  string  $action
     * @param  string  $resourceType
     * @param  int|null  $resourceId
     * @param  string|null  $resourceName
     * @param  array  $metadata
     * @param  string  $status
     * @param  string|null  $failureReason
     * @return static
     */
    public static function record(
        $request,
        string $action,
        string $resourceType,
        ?int $resourceId = null,
        ?string $resourceName = null,
        array $metadata = [],
        string $status = 'success',
        ?string $failureReason = null
    ): static {
        return static::create([
            'user_id'        => $request->user()?->id,
            'action'         => $action,
            'resource_type'  => $resourceType,
            'resource_id'    => $resourceId,
            'resource_name'  => $resourceName,
            'metadata'       => $metadata,
            'ip_address'     => $request->ip(),
            'user_agent'     => $request->userAgent(),
            'status'         => $status,
            'failure_reason' => $failureReason,
        ]);
    }
}
