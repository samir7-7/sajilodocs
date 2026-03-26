from django.contrib.auth.models import User
from django.contrib.auth import authenticate
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework_simplejwt.tokens import RefreshToken
from django.conf import settings
import urllib.request
import json
import logging
from django.contrib.auth.hashers import make_password


# Helper to create JWT tokens
def get_tokens_for_user(user):
    refresh = RefreshToken.for_user(user)
    return {
        'refresh': str(refresh),
        'access': str(refresh.access_token),
    }


# Register API
class RegisterAPI(APIView):
    def post(self, request):
        username = request.data.get("username")
        email = request.data.get("email")
        password = request.data.get("password")

        if User.objects.filter(username=username).exists():
            return Response({"error": "Username already taken"}, status=400)

        if User.objects.filter(email=email).exists():
            return Response({"error": "Email already registered"}, status=400)

        user = User.objects.create_user(username=username, email=email, password=password)
        tokens = get_tokens_for_user(user)
        return Response({"message": "User created", "tokens": tokens})
        

# Login API
class LoginAPI(APIView):
    def post(self, request):
        username = request.data.get("username")
        password = request.data.get("password")

        user = authenticate(username=username, password=password)

        if user is None:
            return Response({"error": "Invalid credentials"}, status=400)

        tokens = get_tokens_for_user(user)
        return Response({"tokens": tokens})


# Get authenticated user
class UserAPI(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        return Response({
            "username": user.username,
            "email": user.email,
        })


# Google social login using id_token from frontend
class GoogleLoginAPI(APIView):
    """Accepts POST { "id_token": "..." } from frontend Google Sign-In

    Verifies the token with Google's tokeninfo endpoint, creates or gets
    a Django user matching the email, and returns JWT tokens.
    """

    def post(self, request):
        id_token = request.data.get('id_token')

        if not id_token:
            return Response({"error": "id_token is required"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            # Verify token using Google's tokeninfo endpoint
            url = f"https://oauth2.googleapis.com/tokeninfo?id_token={id_token}"
            with urllib.request.urlopen(url) as resp:
                data = json.loads(resp.read().decode())
        except Exception:
            return Response({"error": "Invalid id_token or verification failed"}, status=status.HTTP_400_BAD_REQUEST)

        # Validate audience (client id)
        client_id = None
        try:
            client_id = settings.SOCIALACCOUNT_PROVIDERS['google']['APP']['client_id']
        except Exception:
            client_id = getattr(settings, 'GOOGLE_CLIENT_ID', None)

        if client_id and data.get('aud') != client_id:
            return Response({"error": "Token audience mismatch"}, status=status.HTTP_400_BAD_REQUEST)

        email = data.get('email')
        email_verified = data.get('email_verified') in ['true', 'True', True]

        if not email or not email_verified:
            return Response({"error": "Email not available or not verified by Google"}, status=status.HTTP_400_BAD_REQUEST)

        # Use email as username to avoid collisions; ensure uniqueness
        username = email

        user, created = User.objects.get_or_create(email=email, defaults={
            'username': username,
        })

        if created:
            # Set unusable password for social accounts
            user.set_unusable_password()
            # Attempt to fill first/last name from name claim
            name = data.get('name') or ''
            if name:
                parts = name.split(' ', 1)
                user.first_name = parts[0]
                if len(parts) > 1:
                    user.last_name = parts[1]
            user.save()

        tokens = get_tokens_for_user(user)
        return Response({"tokens": tokens, "email": user.email, "username": user.username})


# Register endpoint that does NOT use the database.
# It will hash the provided password and print the registration data
# (username, email, hashed_password) to the backend console for testing.
class RegisterNoDBAPI(APIView):
    """Accepts JSON { username, email, password } and logs the data with hashed password.

    This endpoint does not create a Django user or touch the database. Passwords
    are hashed using Django's `make_password` (uses the project's configured
    password hasher) before being logged.
    """

    def post(self, request):
        logger = logging.getLogger(__name__)

        username = request.data.get("username")
        email = request.data.get("email")
        password = request.data.get("password")

        if not username or not email or not password:
            return Response({"error": "username, email and password are required"}, status=400)

        hashed = make_password(password)

        # Log to console (and configured log handlers). This will not expose
        # the plain-text password; only the hashed value is logged.
        logger.info("Registration (no DB) received: username=%s email=%s hashed_password=%s",
                    username, email, hashed)

        # Also print to stdout for convenience when running the dev server.
        print(f"[RegisterNoDB] username={username} email={email} hashed_password={hashed}")

        return Response({"message": "Registration received (no DB). Check backend logs."})
