<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Folder;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Log;

class FolderController extends Controller
{
    /**
     * Get all folders for the authenticated user
     */
    public function index(Request $request)
    {
        try {
            $user = Auth::user();
            $folders = Folder::where('owner_id', $user->id)
                ->withCount('documents')
                ->orderBy('name', 'asc')
                ->get();

            return response()->json([
                'status' => 'success',
                'data' => $folders
            ]);
        } catch (\Exception $e) {
            Log::error('Folder Index Error: ' . $e->getMessage());
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to retrieve folders'
            ], 500);
        }
    }

    /**
     * Create a new folder
     */
    public function store(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'name' => 'required|string|max:100',
                'parent_id' => 'nullable|exists:folders,id',
                'color' => 'nullable|string|max:20',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            $user = Auth::user();

            // Check if folder with same name already exists in the same level for this user
            $existing = Folder::where('owner_id', $user->id)
                ->where('name', $request->name)
                ->where('parent_id', $request->parent_id)
                ->first();

            if ($existing) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'A folder with this name already exists in this location.'
                ], 409);
            }

            $folder = Folder::create([
                'name' => $request->name,
                'parent_id' => $request->parent_id,
                'owner_id' => $user->id,
                'color' => $request->color ?? '#64748b', // default slate color
            ]);

            return response()->json([
                'status' => 'success',
                'message' => 'Folder created successfully',
                'data' => $folder
            ], 201);
        } catch (\Exception $e) {
            Log::error('Folder Store Error: ' . $e->getMessage());
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to create folder'
            ], 500);
        }
    }

    /**
     * Update an existing folder
     */
    public function update(Request $request, $id)
    {
        try {
            $folder = Folder::where('id', $id)->where('owner_id', Auth::id())->first();

            if (!$folder) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Folder not found'
                ], 404);
            }

            $validator = Validator::make($request->all(), [
                'name' => 'sometimes|required|string|max:100',
                'parent_id' => 'nullable|exists:folders,id',
                'color' => 'nullable|string|max:20',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            // Optional: Check circular references if changing parent_id, skipped for MVP simplicity
            
            $folder->update($request->only(['name', 'parent_id', 'color']));

            return response()->json([
                'status' => 'success',
                'message' => 'Folder updated successfully',
                'data' => $folder
            ]);
        } catch (\Exception $e) {
            Log::error('Folder Update Error: ' . $e->getMessage());
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to update folder'
            ], 500);
        }
    }

    /**
     * Delete a folder (soft delete)
     */
    public function destroy($id)
    {
        try {
            $folder = Folder::where('id', $id)->where('owner_id', Auth::id())->first();

            if (!$folder) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Folder not found'
                ], 404);
            }

            // Note: In real app, we might need to handle child folders and documents
            // Since we use soft deletes, child items are effectively "orphaned" visually 
            // unless we cascade the soft delete, but for MVP we just delete the folder itself.
            $folder->delete();

            return response()->json([
                'status' => 'success',
                'message' => 'Folder deleted successfully'
            ]);
        } catch (\Exception $e) {
            Log::error('Folder Destroy Error: ' . $e->getMessage());
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to delete folder'
            ], 500);
        }
    }
}
