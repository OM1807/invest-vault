from django.contrib import admin
from django.http import JsonResponse
from django.urls import include, path


def health_check(request):
    return JsonResponse({"status": "ok"})


urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/health/", health_check),
    path("api/auth/", include("apps.authentication.urls")),
    path("api/", include("apps.startups.urls")),
    path("api/", include("apps.founders.urls")),
    path("api/", include("apps.investors.urls")),
    path("api/investments/", include("apps.investments.urls")),
    path("api/chat/", include("apps.chat.urls")),
]