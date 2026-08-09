from rest_framework import permissions, viewsets
from rest_framework.response import Response
from rest_framework import status

from apps.users.models import UserRole
from .models import Bid, BidStatus, FundingRound
from .serializers import BidDecisionSerializer, BidSerializer, FundingRoundSerializer


class FundingRoundViewSet(viewsets.ModelViewSet):
    serializer_class = FundingRoundSerializer

    def get_permissions(self):
        if self.action in {"list", "retrieve"}:
            return [permissions.AllowAny()]
        return [permissions.IsAuthenticated()]

    def get_queryset(self):
        queryset = FundingRound.objects.select_related("startup", "startup__founder").order_by("-created_at")
        if self.request.user.is_authenticated and self.request.user.is_staff:
            return queryset
        if self.request.user.is_authenticated and self.request.user.role == UserRole.FOUNDER:
            return queryset.filter(startup__founder=self.request.user)
        return queryset.filter(status="open")

    def perform_create(self, serializer):
        serializer.save()


class BidViewSet(viewsets.ModelViewSet):
    serializer_class = BidSerializer

    def get_permissions(self):
        if self.action in {"list", "retrieve"}:
            return [permissions.IsAuthenticated()]
        return [permissions.IsAuthenticated()]

    def get_serializer_class(self):
        if self.action in {"partial_update", "update"}:
            return BidDecisionSerializer
        return BidSerializer

    def get_queryset(self):
        queryset = Bid.objects.select_related("funding_round", "funding_round__startup", "investor").order_by("-created_at")
        if self.request.user.is_authenticated and self.request.user.is_staff:
            return queryset
        if self.request.user.is_authenticated and self.request.user.role == UserRole.FOUNDER:
            return queryset.filter(funding_round__startup__founder=self.request.user)
        return queryset.filter(investor=self.request.user)

    def update(self, request, *args, **kwargs):
        instance = self.get_object()
        if request.user.role != UserRole.FOUNDER and request.data.get("status") in {BidStatus.ACCEPTED, BidStatus.REJECTED}:
            return Response(
                {"detail": "Only founders can accept or reject bids."},
                status=status.HTTP_403_FORBIDDEN,
            )
        return super().update(request, *args, **kwargs)

    def perform_create(self, serializer):
        serializer.save()
