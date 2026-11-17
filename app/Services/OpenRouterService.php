<?php

namespace App\Services;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;

class OpenRouterService
{
    private const BASE_URL = 'https://openrouter.ai/api/v1';

    public function models(): array
    {
        return Cache::remember('openrouter.models', now()->addHour(), function () {
            $response = Http::timeout(15)->get(self::BASE_URL . '/models');
            $response->throw();

            return collect($response->json('data', []))
                ->map(fn ($model) => [
                    'id' => $model['id'],
                    'name' => $model['name'] ?? $model['id'],
                    'context_length' => $model['context_length'] ?? null,
                ])
                ->sortBy('name', SORT_NATURAL | SORT_FLAG_CASE)
                ->values()
                ->all();
        });
    }

    public function isValidKey(string $key): bool
    {
        $response = Http::withToken($key)->timeout(15)->get(self::BASE_URL . '/key');

        return $response->successful();
    }

    public function modelExists(string $id): bool
    {
        return collect($this->models())->contains('id', $id);
    }

    public function chat(string $apiKey, string $model, array $messages): string
    {
        $response = Http::withToken($apiKey)
            ->timeout(60)
            ->post(self::BASE_URL . '/chat/completions', [
                'model' => $model,
                'messages' => $messages,
                'temperature' => 0.7,
            ]);

        $response->throw();

        $content = $response->json('choices.0.message.content');

        if (is_array($content)) {
            return collect($content)
                ->pluck('text')
                ->filter()
                ->implode('');
        }

        return (string) ($content ?? '');
    }
}
