Django Backend Authentication

This document explains how to use the REST authentication endpoints (username/password + Google sign-in) provided by the Django backend.

Available endpoints (base: `/api/auth/`):

- `POST /api/auth/register/`

  - Body JSON: `{ "username": "alice", "email": "alice@example.com", "password": "secret" }`
  - Returns: `{ "message": "User created", "tokens": { "access": "...", "refresh": "..." } }`

- `POST /api/auth/login/`

  - Body JSON: `{ "username": "alice", "password": "secret" }`
  - Returns: `{ "tokens": { "access": "...", "refresh": "..." } }`

- `POST /api/auth/refresh/`

  - Body JSON: `{ "refresh": "<refresh_token>" }`
  - Uses `rest_framework_simplejwt` token refresh view.

- `GET /api/auth/user/` (authenticated)

  - Provide `Authorization: Bearer <access_token>` header
  - Returns basic user info: `{"username":..., "email":...}`

- `POST /api/auth/google/`
  - Body JSON: `{ "id_token": "<google-id-token>" }`
  - This endpoint expects a Google `id_token` obtained on the frontend (Google Sign-In / OAuth2).
  - The server verifies the token with Google's `tokeninfo` endpoint, then creates or fetches a Django `User` with the verified email and returns JWT tokens (access + refresh).

How the frontend should obtain `id_token`:

- Use Google Identity Services (recommended) or the older Google Sign-In library.
- When the user signs in, the client receives an `id_token` (a JWT). Send that `id_token` to `POST /api/auth/google/`.

Example fetch (frontend):

```js
// After receiving id_token from Google client
fetch("http://localhost:8000/api/auth/google/", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  credentials: "include",
  body: JSON.stringify({ id_token }),
})
  .then((r) => r.json())
  .then((data) => {
    // store data.tokens.access / data.tokens.refresh
  });
```

Important configuration notes:

- `SOCIALACCOUNT_PROVIDERS['google']['APP']['client_id']` in `Backend/settings.py` is used to validate the `id_token` audience (`aud`). Make sure it matches your Google Cloud OAuth client ID.
- Do NOT keep client secrets in source control for production. Use environment variables or a secrets manager.
- Ensure `CORS_ALLOWED_ORIGINS` includes your frontend origin(s) so the browser can call the API.

Setup (one-time)

```powershell
# from Backend folder
python -m pip install -r requirements.txt  # ensure packages: django, djangorestframework, djangorestframework-simplejwt, django-allauth, django-cors-headers
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver
```

Security and production:

- For production, enforce HTTPS, set `DEBUG = False`, add proper `ALLOWED_HOSTS`, and secure secret keys.
- Consider using a dedicated package (e.g., `dj-rest-auth`) for richer social-auth flows and token management.

If you want, I can:

- Add a `requirements.txt` and run a quick local test script.
- Add a small frontend snippet to obtain `id_token` using Google Identity Services.
