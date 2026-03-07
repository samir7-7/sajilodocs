from django.contrib import admin
from django.urls import path, include
from django.views.generic import TemplateView
from django.conf import settings
from django.conf.urls.static import static
from django.views.static import serve
from pathlib import Path
import os

# View to serve React's index.html for all non-API routes (SPA fallback)
class ReactAppView(TemplateView):
    template_name = 'index.html'
    
    def get_context_data(self, **kwargs):
        return {}

urlpatterns = [
    path('admin/', admin.site.urls),

    # API endpoints
    path('api/', include('api.urls')),
    
    # Serve React app for all other routes
    path('', ReactAppView.as_view(), name='react-app'),
]

# Serve static files and React build output
if settings.DEBUG:
    # For development, serve React dist folder as static
    REACT_DIST = Path(settings.BASE_DIR).parent.parent / 'Development' / 'Frontend' / 'dist'
    
    urlpatterns += [
        path('assets/<path:path>', serve, {'document_root': REACT_DIST / 'assets'}),
    ]
    
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
