<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;

class AuditLogController extends Controller
{
    /**
     * Get audit logs (UC-12)
     */
    public function index(Request $request)
    {
        try {
            $user = Auth::user();

            // MVP logic: Admin can see all, normal user sees logs related to their documents/actions
            // For simplicity in this iteration, we return logs where user is actor 
            // OR where the user owns the document (requires join/relation check).
            // Let's implement a straightforward query for now:

            $query = AuditLog::with('user:id,name,email')
                ->orderBy('created_at', 'desc');

            if (!$user->hasRole('admin')) {
                // User only sees their own actions in MVP
                // To see actions on their documents by OTHERS, we'd need more complex logic.
                $query->where('user_id', $user->id);
            }

            // Filter by action
            if ($request->has('action')) {
                $query->where('action', strtoupper($request->action));
            }

            // General search
            if ($request->has('search') && !empty($request->search)) {
                $search = strtolower($request->search);
                $query->where(function($q) use ($search) {
                    $q->whereRaw('LOWER(action) LIKE ?', ["%{$search}%"])
                      ->orWhereRaw('LOWER(resource_type) LIKE ?', ["%{$search}%"])
                      ->orWhereRaw('CAST(metadata AS TEXT) LIKE ?', ["%{$search}%"])
                      ->orWhereHas('user', function($uq) use ($search) {
                          $uq->whereRaw('LOWER(name) LIKE ?', ["%{$search}%"]);
                      });
                });
            }

            // Filter by date range
            if ($request->has('start_date')) {
                $query->whereDate('created_at', '>=', $request->start_date);
            }
            if ($request->has('end_date')) {
                $query->whereDate('created_at', '<=', $request->end_date);
            }

            $logs = $query->paginate(20);

            return response()->json([
                'status' => 'success',
                'data' => $logs
            ]);
        } catch (\Exception $e) {
            Log::error('AuditLog Index Error: ' . $e->getMessage());
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to retrieve audit logs'
            ], 500);
        }
    }
}
