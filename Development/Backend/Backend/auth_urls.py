from django.urls import path
from .views import RegisterAPI, LoginAPI, UserAPI
from .views import GoogleLoginAPI, RegisterNoDBAPI
from rest_framework_simplejwt.views import TokenRefreshView

urlpatterns = [
    path('register/', RegisterAPI.as_view(), name='register'),
    path('register-no-db/', RegisterNoDBAPI.as_view(), name='register_no_db'),
    path('login/', LoginAPI.as_view(), name='login'),
    path('user/', UserAPI.as_view(), name='user'),
    path('google/', GoogleLoginAPI.as_view(), name='google_login'),
    path('refresh/', TokenRefreshView.as_view(), name='token_refresh'),
]
