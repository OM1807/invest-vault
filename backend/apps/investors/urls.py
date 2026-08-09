from rest_framework.routers import DefaultRouter

from .views import InvestorProfileViewSet

router = DefaultRouter()
router.register(r"investors", InvestorProfileViewSet, basename="investor-profile")

urlpatterns = router.urls