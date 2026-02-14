import os
import django
import sys

# Setup Django environment
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'Backend.settings')
django.setup()

from django.contrib.auth import get_user_model
from api.models import OTPVerification
from rest_framework.test import APIClient
from rest_framework import status

User = get_user_model()
print(f"User model loaded: {User}")

def test_auth_flow():
    client = APIClient()
    email = "testuser@example.com"
    password = "TestPassword123!"
    
    print("1. Cleaning up old test user...")
    User.objects.filter(email=email).delete()
    
    print("2. Testing Registration...")
    response = client.post('/api/auth/register/', {
        'username': 'testuser',
        'email': email,
        'password': password,
        'first_name': 'Test',
        'last_name': 'User'
    }, format='json')
    
    if response.status_code != 201:
        print(f"FAILED: Registration failed with {response.status_code}")
        try:
            print(response.json())
        except:
            print(response.content[:200]) # Print first 200 chars
        return
    print("SUCCESS: Registration successful")
    
    print("3. Checking User Status (should be inactive)...")
    user = User.objects.get(email=email)
    if user.is_active:
        print("FAILED: User should be inactive before OTP verification")
        return
    print("SUCCESS: User is inactive")
    
    print("4. Retrieving OTP...")
    try:
        otp_obj = OTPVerification.objects.get(user=user)
        otp_code = otp_obj.otp_code
        print(f"SUCCESS: Found OTP: {otp_code}")
    except OTPVerification.DoesNotExist:
        print("FAILED: OTP not generated")
        return
        
    print("5. Testing OTP Verification...")
    response = client.post('/api/auth/verify-otp/', {
        'email': email,
        'otp': otp_code
    }, format='json')
    
    if response.status_code != 200:
        print(f"FAILED: OTP Verification failed with {response.status_code}")
        try:
            print(response.json())
        except:
            print(response.content[:200])
        return
    print("SUCCESS: OTP Verified")
    
    print("6. Checking User Status (should be active)...")
    user.refresh_from_db()
    if not user.is_active:
        print("FAILED: User should be active after OTP verification")
        return
    print("SUCCESS: User is active")
    
    print("\nALL TESTS PASSED!")

if __name__ == "__main__":
    test_auth_flow()
