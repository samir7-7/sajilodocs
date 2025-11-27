from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),

    # Django Auth (allauth routes removed so project can run without installing it)

    # API authentication endpoints
    path('api/auth/', include('Backend.auth_urls')),
]
