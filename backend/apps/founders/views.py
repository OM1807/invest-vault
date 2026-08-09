from rest_framework import permissions, viewsets

from .models import FounderProfile
from .serializers import FounderProfileSerializer


class FounderProfileViewSet(viewsets.ModelViewSet):
    serializer_class = FounderProfileSerializer

    def get_permissions(self):
        if self.action in {"list", "retrieve"}:
            return [permissions.AllowAny()]
        return [permissions.IsAuthenticated()]

    def get_queryset(self):
        queryset = FounderProfile.objects.select_related("user").order_by("-created_at")
        if self.request.user.is_authenticated and self.request.user.is_staff:
            return queryset
        return queryset.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)
