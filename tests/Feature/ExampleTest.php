<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class ExampleTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_can_register_login_and_update_settings(): void
    {
        Http::fake([
            'https://openrouter.ai/api/v1/*' => Http::response([
                'data' => [[
                    'id' => 'openai/gpt-4o',
                    'name' => 'GPT-4o',
                    'context_length' => 128000,
                ]],
            ], 200),
        ]);

        $register = $this->postJson('/api/register', [
            'name' => 'Alice Tester',
            'email' => 'alice@example.com',
            'password' => 'secret123',
            'password_confirmation' => 'secret123',
        ]);

        $register->assertStatus(201)
            ->assertJsonPath('user.email', 'alice@example.com')
            ->assertJsonStructure(['token', 'user' => ['name', 'email']]);

        $token = $register->json('token');

        $this->withHeader('Authorization', 'Bearer ' . $token)
            ->getJson('/api/settings')
            ->assertOk()
            ->assertJsonPath('email', 'alice@example.com');

        $this->withHeader('Authorization', 'Bearer ' . $token)
            ->putJson('/api/settings/api-key', ['api_key' => 'sk-or-v1-1234567890abcdef'])
            ->assertOk();

        $this->withHeader('Authorization', 'Bearer ' . $token)
            ->putJson('/api/settings/model', ['default_model' => 'openai/gpt-4o'])
            ->assertOk();
    }
}
