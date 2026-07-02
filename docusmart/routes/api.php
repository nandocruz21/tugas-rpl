<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\DocumentController;
use App\Http\Controllers\Api\DocumentVersionController;
use App\Http\Controllers\Api\DocumentShareController;
use App\Http\Controllers\Api\FolderController;
use App\Http\Controllers\Api\AuditLogController;
use App\Http\Controllers\Api\UserController;

/*
|--------------------------------------------------------------------------
| DocuSmart API Routes
|--------------------------------------------------------------------------
|
| All routes use Sanctum token authentication unless marked [public].
| Role-based middleware uses Spatie's role() / permission() helpers.
|
| Base URL: /api/v1
|
*/

Route::prefix('v1')->group(function () {

    // =====================================================================
    // [PUBLIC] Authentication Routes
    // =====================================================================
    Route::prefix('auth')->name('auth.')->group(function () {
        // POST /api/v1/auth/register
        Route::post('/register', [AuthController::class, 'register'])->name('register');

        // POST /api/v1/auth/login
        Route::post('/login', [AuthController::class, 'login'])->name('login');

        // POST /api/v1/auth/forgot-password
        Route::post('/forgot-password', [AuthController::class, 'forgotPassword'])->name('password.forgot');

        // POST /api/v1/auth/reset-password
        Route::post('/reset-password', [AuthController::class, 'resetPassword'])->name('password.reset');
    });

    // =====================================================================
    // [AUTHENTICATED] Routes — require valid Sanctum Bearer token
    // =====================================================================
    Route::middleware('auth:sanctum')->group(function () {

        // -----------------------------------------------------------------
        // Auth (Authenticated actions)
        // -----------------------------------------------------------------
        Route::prefix('auth')->name('auth.')->group(function () {
            // POST /api/v1/auth/logout
            Route::post('/logout', [AuthController::class, 'logout'])->name('logout');

            // GET /api/v1/auth/me
            Route::get('/me', [AuthController::class, 'me'])->name('me');

            // PUT /api/v1/auth/profile
            Route::put('/profile', [AuthController::class, 'updateProfile'])->name('profile.update');

            // PUT /api/v1/auth/password
            Route::put('/password', [AuthController::class, 'changePassword'])->name('password.change');
        });

        // -----------------------------------------------------------------
        // Folders
        // -----------------------------------------------------------------
        Route::prefix('folders')->name('folders.')->group(function () {
            // GET    /api/v1/folders           — list root folders + tree
            Route::get('/', [FolderController::class, 'index'])->name('index');

            // POST   /api/v1/folders           — create folder
            Route::post('/', [FolderController::class, 'store'])->name('store');

            // GET    /api/v1/folders/{folder}  — show folder with children + documents
            Route::get('/{folder}', [FolderController::class, 'show'])->name('show');

            // PUT    /api/v1/folders/{folder}  — rename/move folder
            Route::put('/{folder}', [FolderController::class, 'update'])->name('update');

            // DELETE /api/v1/folders/{folder}  — soft delete
            Route::delete('/{folder}', [FolderController::class, 'destroy'])->name('destroy');
        });

        // -----------------------------------------------------------------
        // Documents (Core CRUD + Versioning)
        // -----------------------------------------------------------------
        Route::prefix('documents')->name('documents.')->group(function () {
            // GET    /api/v1/documents          — paginated list (with filters: category, folder, search)
            Route::get('/', [DocumentController::class, 'index'])->name('index');

            // POST   /api/v1/documents          — create new document AND upload first version
            Route::post('/', [DocumentController::class, 'store'])->name('store');

            // GET    /api/v1/documents/{document} — metadata + current version info
            Route::get('/{document}', [DocumentController::class, 'show'])->name('show');

            // PUT    /api/v1/documents/{document} — update metadata only (name, category, tags)
            Route::put('/{document}', [DocumentController::class, 'update'])->name('update');

            // DELETE /api/v1/documents/{document} — soft delete document
            Route::delete('/{document}', [DocumentController::class, 'destroy'])->name('destroy');

            // GET    /api/v1/documents/{document}/preview — stream/signed URL for in-browser preview
            Route::get('/{document}/preview', [DocumentController::class, 'preview'])->name('preview');

            // GET    /api/v1/documents/{document}/download — force download current version
            Route::get('/{document}/download', [DocumentController::class, 'download'])->name('download');

            // -----------------------------------------------------------
            // Document Versioning (UC-07: Automatic Versioning)
            // -----------------------------------------------------------
            Route::prefix('/{document}/versions')->name('versions.')->group(function () {
                // GET  /api/v1/documents/{document}/versions          — list all versions
                Route::get('/', [DocumentVersionController::class, 'index'])->name('index');

                // POST /api/v1/documents/{document}/versions          — upload new version (triggers UC-07)
                Route::post('/', [DocumentVersionController::class, 'store'])->name('store');

                // GET  /api/v1/documents/{document}/versions/{version} — single version detail
                Route::get('/{version}', [DocumentVersionController::class, 'show'])->name('show');

                // POST /api/v1/documents/{document}/versions/{version}/restore — restore to this version
                Route::post('/{version}/restore', [DocumentVersionController::class, 'restore'])->name('restore');

                // GET  /api/v1/documents/{document}/versions/{version}/download — download specific version
                Route::get('/{version}/download', [DocumentVersionController::class, 'download'])->name('download');
            });

            // -----------------------------------------------------------
            // Document Sharing / ACL (Pratinjau Kontrol Akses)
            // -----------------------------------------------------------
            Route::prefix('/{document}/share')->name('share.')->group(function () {
                // GET    /api/v1/documents/{document}/share          — list all shares for this document
                Route::get('/', [DocumentShareController::class, 'index'])->name('index');

                // POST   /api/v1/documents/{document}/share          — grant access to a user
                Route::post('/', [DocumentShareController::class, 'store'])->name('store');

                // PUT    /api/v1/documents/{document}/share/{share}  — update access level
                Route::put('/{share}', [DocumentShareController::class, 'update'])->name('update');

                // DELETE /api/v1/documents/{document}/share/{share}  — revoke access
                Route::delete('/{share}', [DocumentShareController::class, 'destroy'])->name('destroy');
            });
        });

        // -----------------------------------------------------------------
        // [ADMIN ONLY] User Management
        // -----------------------------------------------------------------
        Route::prefix('users')
             ->name('users.')
             ->middleware('role:admin')
             ->group(function () {
            // GET    /api/v1/users              — list all users with roles
            Route::get('/', [UserController::class, 'index'])->name('index');

            // POST   /api/v1/users              — create new user
            Route::post('/', [UserController::class, 'store'])->name('store');

            // GET    /api/v1/users/{user}       — user detail
            Route::get('/{user}', [UserController::class, 'show'])->name('show');

            // PUT    /api/v1/users/{user}       — update user profile/status
            Route::put('/{user}', [UserController::class, 'update'])->name('update');

            // POST   /api/v1/users/{user}/roles — assign roles (admin/user/viewer)
            Route::post('/{user}/roles', [UserController::class, 'assignRole'])->name('roles.assign');

            // DELETE /api/v1/users/{user}/roles — revoke roles
            Route::delete('/{user}/roles', [UserController::class, 'revokeRole'])->name('roles.revoke');

            // POST   /api/v1/users/{user}/activate   — toggle user active status
            Route::post('/{user}/activate', [UserController::class, 'activate'])->name('activate');
            Route::post('/{user}/deactivate', [UserController::class, 'deactivate'])->name('deactivate');
        });

        // -----------------------------------------------------------------
        // [ADMIN ONLY] Audit Logs (Admin Audit Trail & Restore screen)
        // -----------------------------------------------------------------
        Route::prefix('audit-logs')
             ->name('audit.')
             ->middleware('role:admin')
             ->group(function () {
            // GET /api/v1/audit-logs              — paginated list (filter: user, action, date range)
            Route::get('/', [AuditLogController::class, 'index'])->name('index');

            // GET /api/v1/audit-logs/{log}        — single log entry detail
            Route::get('/{log}', [AuditLogController::class, 'show'])->name('show');

            // GET /api/v1/audit-logs/export       — export as CSV
            Route::get('/export', [AuditLogController::class, 'export'])->name('export');

            // GET /api/v1/audit-logs/stats        — dashboard stats (action counts, timeline)
            Route::get('/stats', [AuditLogController::class, 'stats'])->name('stats');
        });
    });
});
