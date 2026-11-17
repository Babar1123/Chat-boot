<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\OpenRouterService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class OpenRouterController extends Controller
{
    public function models(OpenRouterService $openRouter): JsonResponse
    {
        return response()->json(['data' => $openRouter->models()]);
    }

    public function chat(Request $request, OpenRouterService $openRouter): JsonResponse
    {
        $data = $request->validate([
            'model' => ['required', 'string'],
            'messages' => ['required', 'array'],
            'messages.*.role' => ['required', 'in:user,assistant,system'],
            'messages.*.content' => ['required', 'string'],
        ]);

        $apiKey = $request->user()->openrouter_api_key;

        if (! filled($apiKey)) {
            return response()->json(['message' => 'Please save an OpenRouter API key first.'], 422);
        }

        $reply = $openRouter->chat($apiKey, $data['model'], $data['messages']);

        return response()->json(['reply' => $reply]);
    }
}
