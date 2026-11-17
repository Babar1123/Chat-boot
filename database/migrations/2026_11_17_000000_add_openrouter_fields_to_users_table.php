<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            if (! Schema::hasColumn('users', 'openrouter_api_key')) {
                $table->text('openrouter_api_key')->nullable()->after('password');
            }

            if (! Schema::hasColumn('users', 'default_model')) {
                $table->string('default_model')->nullable()->after('openrouter_api_key');
            }
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            if (Schema::hasColumn('users', 'openrouter_api_key')) {
                $table->dropColumn('openrouter_api_key');
            }

            if (Schema::hasColumn('users', 'default_model')) {
                $table->dropColumn('default_model');
            }
        });
    }
};
