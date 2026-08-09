from rest_framework.routers import DefaultRouter

from .views import BidViewSet, FundingRoundViewSet

router = DefaultRouter()
router.register(r"funding-rounds", FundingRoundViewSet, basename="funding-round")
router.register(r"bids", BidViewSet, basename="bid")

urlpatterns = router.urls
