<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\OpenRouterService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;

class SettingsController extends Controller
{
    public function show(Request $request): JsonResponse
    {
        $user = $request->user();
        $key = $user->openrouter_api_key;

        return response()->json([
            'name' => $user->name,
            'email' => $user->email,
            'has_api_key' => filled($key),
            'api_key_hint' => filled($key) ? 'sk-or-••••' . substr($key, -4) : null,
            'default_model' => $user->default_model,
        ]);
    }

    public function updateApiKey(Request $request, OpenRouterService $openRouter): JsonResponse
    {
        $data = $request->validate([
            'api_key' => ['required', 'string', 'min:20', 'max:255'],
        ]);

        if (! $openRouter->isValidKey($data['api_key'])) {
            return response()->json(['message' => 'This API key is not valid on OpenRouter.'], 422);
        }

        $request->user()->update(['openrouter_api_key' => $data['api_key']]);

        return response()->json(['message' => 'API key saved.']);
    }

    public function deleteApiKey(Request $request): JsonResponse
    {
        $request->user()->update(['openrouter_api_key' => null]);

        return response()->json(['message' => 'API key deleted.']);
    }

    public function updateModel(Request $request, OpenRouterService $openRouter): JsonResponse
    {
        $data = $request->validate([
            'default_model' => ['required', 'string', 'max:255'],
        ]);

        if (! $openRouter->modelExists($data['default_model'])) {
            return response()->json(['message' => 'This model is not available.'], 422);
        }

        $request->user()->update(['default_model' => $data['default_model']]);

        return response()->json(['message' => 'Default chatbot saved.']);
    }

    public function updateProfile(Request $request): JsonResponse
    {
        $user = $request->user();

        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', Rule::unique('users')->ignore($user->id)],
        ]);

        $user->update($data);

        return response()->json(['message' => 'Profile updated.']);
    }

    public function updatePassword(Request $request): JsonResponse
    {
        $data = $request->validate([
            'current_password' => ['required', 'string'],
            'password' => ['required', 'confirmed', Password::min(8)],
        ]);

        $user = $request->user();

        if (! Hash::check($data['current_password'], $user->password)) {
            return response()->json(['message' => 'Current password is incorrect.'], 422);
        }

        $user->update(['password' => $data['password']]);

        return response()->json(['message' => 'Password changed.']);
    }
}
