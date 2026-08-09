from rest_framework.routers import DefaultRouter

from .views import FounderProfileViewSet

router = DefaultRouter()
router.register(r"founders", FounderProfileViewSet, basename="founder-profile")

urlpatterns = router.urls