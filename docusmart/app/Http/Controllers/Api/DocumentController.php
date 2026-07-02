<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Document;
use App\Models\DocumentVersion;
use App\Models\AuditLog;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Log;

class DocumentController extends Controller
{
    /**
     * Get documents with search and filtering (UC-03)
     */
    public function index(Request $request)
    {
        try {
            $user = Auth::user();
            
            if ($request->scope === 'shared') {
                $query = Document::whereHas('shares', function($q) use ($user) {
                    $q->where('shared_with_user_id', $user->id);
                })
                ->where('status', 'active')
                ->with(['currentVersion', 'owner:id,name,email']);
            } else {
                $query = Document::where('owner_id', $user->id)
                    ->where('status', 'active')
                    ->with('currentVersion');
            }

            // Filter by folder
            if ($request->has('folder_id')) {
                $query->where('folder_id', $request->folder_id);
            }

            // Filter by category
            if ($request->has('category')) {
                $query->where('category', $request->category);
            }

            // Keyword search (by name or tags)
            if ($request->has('search')) {
                $searchTerm = '%' . $request->search . '%';
                $query->where(function ($q) use ($searchTerm) {
                    $q->where('name', 'LIKE', $searchTerm)
                      ->orWhere('tags', 'LIKE', $searchTerm);
                });
            }

            // Filter by file format (requires joining/checking versions)
            if ($request->has('format')) {
                $format = $request->format;
                $query->whereHas('currentVersion', function ($q) use ($format) {
                    $q->where('file_format', strtolower($format));
                });
            }

            $documents = $query->orderBy('updated_at', 'desc')->paginate(15);

            return response()->json([
                'status' => 'success',
                'data' => $documents
            ]);
        } catch (\Exception $e) {
            Log::error('Document Index Error: ' . $e->getMessage());
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to retrieve documents'
            ], 500);
        }
    }

    /**
     * Download or preview a document (UC-06)
     */
    public function download(Request $request, $id)
    {
        try {
            // Include logic to check if user has access (either owner or shared)
            $user = Auth::user();
            
            $document = Document::with('currentVersion')->findOrFail($id);

            // Simple authorization check for MVP
            if ($document->owner_id !== $user->id) {
                // Check if shared
                $isShared = \App\Models\DocumentShare::where('document_id', $id)
                    ->where('shared_with_user_id', $user->id)
                    ->exists();

                if (!$isShared) {
                    return response()->json([
                        'status' => 'error',
                        'message' => 'Unauthorized access to this document'
                    ], 403);
                }
            }

            $version = $document->currentVersion;

            if (!$version || !Storage::exists($version->file_path)) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'File not found on server'
                ], 404);
            }

            // Record audit log for download/view
            AuditLog::record(
                $request,
                $request->has('preview') ? 'VIEW' : 'DOWNLOAD',
                'DOCUMENT',
                $document->id,
                $document->name,
                ['version' => $version->label]
            );

            $headers = [
                'Content-Type' => $version->mime_type,
            ];

            if ($request->has('preview')) {
                return Storage::response($version->file_path, $version->original_filename, $headers);
            }

            return Storage::download($version->file_path, $version->original_filename, $headers);

        } catch (\Exception $e) {
            Log::error('Document Download Error: ' . $e->getMessage());
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to download document'
            ], 500);
        }
    }

    /**
     * Preview a document (UC-06)
     */
    public function preview(Request $request, $id)
    {
        // Add the preview flag to the request so the download method streams the file
        $request->merge(['preview' => true]);
        return $this->download($request, $id);
    }

    /**
     * Handle document upload: UC-02 (Upload) and UC-07 (Automatic Versioning)
     */
    public function store(Request $request)
    {
        try {
            // 1. Validate Request
            $validator = Validator::make($request->all(), [
                'file' => 'required|file|mimes:pdf,docx,xlsx|max:51200', // max 50MB
                'name' => 'required|string|max:255',
                'category' => 'nullable|string|max:50',
                'folder_id' => 'nullable|exists:folders,id',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            $user = Auth::user();

            DB::beginTransaction();

            // 2. Check Existing Document (same owner, name, and folder)
            $document = Document::where('owner_id', $user->id)
                ->where('name', $request->name)
                ->where('folder_id', $request->folder_id)
                ->first();

            $file = $request->file('file');
            $originalFilename = $file->getClientOriginalName();
            $fileFormat = strtolower($file->getClientOriginalExtension());
            $mimeType = $file->getMimeType();
            $fileSize = $file->getSize();

            if (!$document) {
                // ─────────────────────────────────────────────
                // UC-02: NEW DOCUMENT UPLOAD
                // ─────────────────────────────────────────────
                
                // Store physical file (generates unique path)
                $path = $file->store('documents');

                // Create Document record
                $document = Document::create([
                    'name' => $request->name,
                    'category' => $request->category,
                    'folder_id' => $request->folder_id,
                    'owner_id' => $user->id,
                    'status' => 'active',
                ]);

                // Create Version 1
                $version = DocumentVersion::create([
                    'document_id' => $document->id,
                    'version_number' => 1,
                    'label' => 'v1.0',
                    'file_path' => $path,
                    'file_size' => $fileSize,
                    'file_format' => $fileFormat,
                    'mime_type' => $mimeType,
                    'original_filename' => $originalFilename,
                    'uploaded_by' => $user->id,
                    'is_current' => true,
                    'change_summary' => 'Initial upload'
                ]);

                // Update document's current_version_id
                $document->update(['current_version_id' => $version->id]);

                // Record Audit Log
                AuditLog::record(
                    $request,
                    'UPLOAD',
                    'DOCUMENT',
                    $document->id,
                    $document->name,
                    ['version' => 'v1.0']
                );

                DB::commit();

                return response()->json([
                    'status' => 'success',
                    'message' => 'Document uploaded successfully',
                    'data' => [
                        'document' => $document->load('currentVersion')
                    ]
                ], 201);

            } else {
                // ─────────────────────────────────────────────
                // UC-07: AUTOMATIC VERSIONING (Document Exists)
                // ─────────────────────────────────────────────
                
                // Store new physical file without overwriting the old one
                $path = $file->store('documents');

                // Get latest version to calculate next version number
                $latestVersion = DocumentVersion::where('document_id', $document->id)
                    ->orderBy('version_number', 'desc')
                    ->first();
                
                $nextVersionNumber = $latestVersion ? $latestVersion->version_number + 1 : 1;
                $nextLabel = 'v' . $nextVersionNumber . '.0';

                // Mark previous version as not current
                if ($latestVersion) {
                    $latestVersion->update(['is_current' => false]);
                }

                // Create New Version record
                $newVersion = DocumentVersion::create([
                    'document_id' => $document->id,
                    'version_number' => $nextVersionNumber,
                    'label' => $nextLabel,
                    'file_path' => $path,
                    'file_size' => $fileSize,
                    'file_format' => $fileFormat,
                    'mime_type' => $mimeType,
                    'original_filename' => $originalFilename,
                    'uploaded_by' => $user->id,
                    'is_current' => true,
                    'change_summary' => 'Automatic versioning on re-upload'
                ]);

                // Update document current_version_id pointer
                $document->update(['current_version_id' => $newVersion->id]);

                // Record Audit Log for the new version update
                AuditLog::record(
                    $request,
                    'NEW_VERSION',
                    'DOCUMENT',
                    $document->id,
                    $document->name,
                    [
                        'from_version' => $latestVersion ? $latestVersion->label : null,
                        'to_version' => $nextLabel
                    ]
                );

                DB::commit();

                return response()->json([
                    'status' => 'success',
                    'message' => 'New document version uploaded successfully',
                    'data' => [
                        'document' => $document->load('currentVersion')
                    ]
                ], 200);
            }

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Document Upload Error: ' . $e->getMessage() . "\n" . $e->getTraceAsString());
            
            // Cleanup physical file if it was saved during the failed transaction
            if (isset($path) && Storage::exists($path)) {
                Storage::delete($path);
            }

            return response()->json([
                'status' => 'error',
                'message' => 'Failed to process document upload: ' . $e->getMessage()
            ], 500);
        }
    }
}
