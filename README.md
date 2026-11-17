# Lumio AI Laravel Backend

## Local setup

1. Configure your MySQL database in `.env`:
   ```env
   DB_CONNECTION=mysql
   DB_HOST=127.0.0.1
   DB_PORT=3306
   DB_DATABASE=lumio_ai
   DB_USERNAME=root
   DB_PASSWORD=
   ```
2. Create the database in MySQL:
   ```sql
   CREATE DATABASE lumio_ai;
   ```
3. Run the database migrations:
   ```bash
   php artisan migrate
   ```
4. Start the API server:
   ```bash
   php artisan serve
   ```

## API routes

- `POST /api/register` — register a user and return a Sanctum token.
- `POST /api/login` — log in and return a token.
- `POST /api/logout` — revoke the current token.
- `GET /api/settings` — fetch profile and API key metadata.
- `PUT /api/settings/api-key` — validate and save the OpenRouter key.
- `DELETE /api/settings/api-key` — remove the saved key.
- `PUT /api/settings/model` — store the default model.
- `PUT /api/settings/profile` — update profile info.
- `PUT /api/settings/password` — change the password.
- `GET /api/models` — fetch the available OpenRouter models.
- `POST /api/chat` — send conversation history to OpenRouter and return the reply.

## Notes

- OpenRouter keys are encrypted before saving with Laravel's `APP_KEY`.
- The frontend gets only a masked hint such as `sk-or-••••abcd`.
- Model data is cached for one hour (`openrouter.models`).
- The app also includes `.env.testing` for SQLite-based PHPUnit verification.
