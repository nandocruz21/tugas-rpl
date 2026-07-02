<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Document;
use App\Models\DocumentVersion;
use App\Models\AuditLog;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

class DocumentVersionController extends Controller
{
    /**
     * Restore a document to a previous version (UC-09)
     */
    public function restore(Request $request, $documentId, $versionId)
    {
        try {
            $user = Auth::user();

            // 1. Validate Document and Access
            $document = Document::findOrFail($documentId);

            // Simple MVP authorization (owner only for restoring)
            if ($document->owner_id !== $user->id) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Unauthorized. Only document owner can restore versions.'
                ], 403);
            }

            // 2. Validate Version
            $versionToRestore = DocumentVersion::where('document_id', $documentId)
                ->where('id', $versionId)
                ->firstOrFail();

            if ($versionToRestore->is_current) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'This version is already the current version.'
                ], 400);
            }

            DB::beginTransaction();

            // 3. Create a NEW version based on the old one's physical file
            // Note: In a robust system, we might duplicate the physical file to ensure true immutability.
            // For MVP, we'll create a new version record pointing to the SAME physical file to save space,
            // or copy it. Copying is safer.
            
            $newPath = 'documents/' . \Illuminate\Support\Str::random(40) . '.' . $versionToRestore->file_format;
            Storage::copy($versionToRestore->file_path, $newPath);

            $latestVersion = DocumentVersion::where('document_id', $document->id)
                ->orderBy('version_number', 'desc')
                ->first();

            $nextVersionNumber = $latestVersion ? $latestVersion->version_number + 1 : 1;
            $nextLabel = 'v' . $nextVersionNumber . '.0';

            // Unset current
            if ($latestVersion) {
                $latestVersion->update(['is_current' => false]);
            }

            // Create restored version
            $newVersion = DocumentVersion::create([
                'document_id' => $document->id,
                'version_number' => $nextVersionNumber,
                'label' => $nextLabel,
                'file_path' => $newPath,
                'file_size' => $versionToRestore->file_size,
                'file_format' => $versionToRestore->file_format,
                'mime_type' => $versionToRestore->mime_type,
                'original_filename' => $versionToRestore->original_filename,
                'uploaded_by' => $user->id,
                'is_current' => true,
                'change_summary' => 'Restored from ' . $versionToRestore->label
            ]);

            // Update document's pointer
            $document->update(['current_version_id' => $newVersion->id]);

            // Record Audit Log
            AuditLog::record(
                $request,
                'RESTORE',
                'DOCUMENT',
                $document->id,
                $document->name,
                [
                    'from_version' => $versionToRestore->label,
                    'to_version' => $nextLabel
                ]
            );

            DB::commit();

            return response()->json([
                'status' => 'success',
                'message' => 'Document restored successfully to ' . $nextLabel,
                'data' => [
                    'document' => $document->load('currentVersion')
                ]
            ], 200);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Document Restore Error: ' . $e->getMessage());
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to restore document version'
            ], 500);
        }
    }
}
