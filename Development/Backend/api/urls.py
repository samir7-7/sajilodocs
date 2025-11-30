from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from .views import (
    RegisterView, UserView, FolderViewSet, FileViewSet, 
    FolderShareViewSet, FileShareViewSet, NotificationViewSet
)

router = DefaultRouter()
router.register(r'folders', FolderViewSet, basename='folder')
router.register(r'files', FileViewSet, basename='file')
router.register(r'shares/folder', FolderShareViewSet, basename='folder-share')
router.register(r'shares/file', FileShareViewSet, basename='file-share')
router.register(r'notifications', NotificationViewSet, basename='notification')

urlpatterns = [
    path('auth/register/', RegisterView.as_view(), name='register'),
    path('auth/login/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('auth/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('auth/user/', UserView.as_view(), name='user_detail'),
    path('', include(router.urls)),
]
