from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from django.http import JsonResponse
from django.views.decorators.http import require_GET
# pyrefly: ignore [missing-import]
from drf_spectacular.views import SpectacularAPIView, SpectacularRedocView, SpectacularSwaggerView


@require_GET
def health_check(request):
    """
    Railway health-check endpoint.
    Returns 200 OK with basic app status.
    Railway pings this to determine if the service is healthy.
    """
    return JsonResponse({
        'status': 'ok',
        'service': 'prepsync-api',
        'version': '3.0.0',
    }, status=200)


urlpatterns = [
    # Health check — must be first and unauthenticated
    path('api/health/', health_check, name='health_check'),

    # Django admin panel
    path('admin_django/', admin.site.urls),

    # All API routes
    path('api/', include('users.urls')),

    # API Schema & Swagger UI
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    path('api/docs/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
    path('api/redoc/', SpectacularRedocView.as_view(url_name='schema'), name='redoc'),
]

# Serve user-uploaded media files:
# - In development (DEBUG=True): served by Django's built-in static server
# - In production: served from the Render persistent volume mount path /data/media/
#   WhiteNoise handles static files; media files are served by gunicorn directly.
#   For production scale, consider moving to S3 (AWS/Cloudflare R2).
urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
