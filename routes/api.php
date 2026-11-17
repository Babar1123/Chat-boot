<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\OpenRouterController;
use App\Http\Controllers\Api\SettingsController;
use Illuminate\Support\Facades\Route;

Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);

Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);

    Route::get('/settings', [SettingsController::class, 'show']);
    Route::put('/settings/api-key', [SettingsController::class, 'updateApiKey']);
    Route::delete('/settings/api-key', [SettingsController::class, 'deleteApiKey']);
    Route::put('/settings/model', [SettingsController::class, 'updateModel']);
    Route::put('/settings/profile', [SettingsController::class, 'updateProfile']);
    Route::put('/settings/password', [SettingsController::class, 'updatePassword']);

    Route::get('/models', [OpenRouterController::class, 'models']);
    Route::post('/chat', [OpenRouterController::class, 'chat']);
});
