<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Document;
use App\Models\DocumentShare;
use App\Models\User;
use App\Models\AuditLog;
use App\Mail\DocumentSharedMail;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Log;

class DocumentShareController extends Controller
{
    /**
     * Share a document with another user (UC-11)
     */
    public function store(Request $request, $documentId)
    {
        try {
            $validator = Validator::make($request->all(), [
                'email' => 'required|email|exists:users,email',
                'role' => 'required|in:viewer,editor',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            $user = Auth::user();
            $document = Document::findOrFail($documentId);

            // MVP: Only owner can share
            if ($document->owner_id !== $user->id) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Unauthorized. Only the owner can share this document.'
                ], 403);
            }

            $targetUser = User::where('email', $request->email)->first();

            if ($targetUser->id === $user->id) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'You cannot share a document with yourself.'
                ], 400);
            }

            // Check if already shared
            $existingShare = DocumentShare::where('document_id', $document->id)
                ->where('shared_with_user_id', $targetUser->id)
                ->first();

            if ($existingShare) {
                // Update role if already shared
                $existingShare->update(['role' => $request->role]);
                $share = $existingShare;
                $message = 'Document share updated successfully';
            } else {
                // Create new share
                $share = DocumentShare::create([
                    'document_id' => $document->id,
                    'shared_by_user_id' => $user->id,
                    'shared_with_user_id' => $targetUser->id,
                    'role' => $request->role,
                ]);
                $message = 'Document shared successfully';
            }

            // Record Audit Log
            AuditLog::record(
                $request,
                'SHARE',
                'DOCUMENT',
                $document->id,
                $document->name,
                [
                    'shared_with' => $targetUser->email,
                    'role' => $request->role
                ]
            );

            // Send Email Notification (Queueing would be better for production)
            Mail::to($targetUser->email)->send(new DocumentSharedMail($document, $user, $request->role));

            return response()->json([
                'status' => 'success',
                'message' => $message,
                'data' => $share
            ], 200);

        } catch (\Exception $e) {
            Log::error('Document Share Error: ' . $e->getMessage());
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to share document'
            ], 500);
        }
    }
}
