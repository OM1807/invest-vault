from rest_framework.routers import DefaultRouter

from .views import StartupViewSet

router = DefaultRouter()
router.register(r"startups", StartupViewSet, basename="startup")

urlpatterns = router.urls