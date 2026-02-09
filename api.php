<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\JourneyController;
use App\Http\Controllers\LocationController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\PasswordController;

/*
|--------------------------------------------------------------------------
| Public Auth Routes
|--------------------------------------------------------------------------
*/
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);

// Forgot/Reset Password
Route::post('/forgot-password', [PasswordController::class, 'forgotPassword']);
Route::post('/reset-password', [PasswordController::class, 'resetPassword']);

/*
|--------------------------------------------------------------------------
| Test / Health Routes
|--------------------------------------------------------------------------
*/
Route::get('/ping', function () {
    return response()->json(['message' => 'API alive']);
});
Route::get('/test', function () {
    return response()->json(['status' => 'API working']);
});

/*
|--------------------------------------------------------------------------
| Authenticated User Route
|--------------------------------------------------------------------------
*/
Route::middleware('auth:sanctum')->get('/me', function (Request $request) {
    return response()->json([
        'user' => $request->user()
    ]);
});
Route::middleware('auth:sanctum')->post('/profile/update', [AuthController::class, 'updateProfile']);



// Admin Dashboard
Route::middleware(['auth:sanctum','role:admin'])->group(function () {
    Route::get('/admin/dashboard', [DashboardController::class, 'adminDashboard']);
    Route::get('/admin/journeys/recent', [DashboardController::class, 'adminRecentJourneys']);
    Route::get('/admin/alerts/recent', [DashboardController::class, 'adminRecentAlerts']);
    Route::get('/admin/journey/{id}', [DashboardController::class, 'adminJourneyDetails']);
    Route::put('/admin/journey/{id}', [DashboardController::class, 'adminUpdateJourney']);
    Route::get('/admin/alert/{id}', [DashboardController::class, 'adminAlertDetails']);
    Route::get('/admin/children', [DashboardController::class, 'adminAllChildren']);
    Route::get('/admin/parents', [DashboardController::class, 'adminAllParents']);
    Route::delete('/admin/user/{id}', [DashboardController::class, 'adminDeleteUser']);
});

// Parent Dashboard
Route::middleware(['auth:sanctum','role:parent'])->get('/parent/dashboard', [DashboardController::class, 'parentDashboard']);

// Child Dashboard
Route::middleware(['auth:sanctum','role:child'])->get('/child/dashboard', [DashboardController::class, 'childStats']);

// Child Journey Actions
Route::middleware(['auth:sanctum','role:child'])->group(function () {
    Route::post('/journeys/start', [JourneyController::class, 'start']);
    Route::post('/journeys/stop', [JourneyController::class, 'stop']);
    Route::post('/journeys/sos', [JourneyController::class, 'sos']);
    Route::get('/child/journeys', [JourneyController::class, 'childJourneys']);
});

// Parent Journey Actions
Route::middleware(['auth:sanctum','role:parent'])->group(function () {
    Route::get('/parent/journeys', [JourneyController::class, 'parentJourneys']);
    Route::put('/journeys/{id}', [JourneyController::class, 'update']);
    Route::delete('/journeys/{id}', [JourneyController::class, 'destroy']);
    Route::post('/parent/add-child', [AuthController::class, 'addChild']);
    Route::post('/parent/link-child', [AuthController::class, 'linkChild']);
    Route::get('/parent/child/{id}', [DashboardController::class, 'getChildDetails']);
    Route::put('/parent/child/{id}', [AuthController::class, 'updateChild']);
    Route::delete('/parent/child/{id}', [AuthController::class, 'unlinkChild']);
    Route::post('/parent/journeys', [JourneyController::class, 'store']);
});

// Journey file upload (Child/Parent can upload for own journey)
Route::middleware(['auth:sanctum'])->post('/journeys/{id}/upload', [JourneyController::class, 'uploadDocument']);
