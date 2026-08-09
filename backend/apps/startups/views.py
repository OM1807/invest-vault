from rest_framework import permissions, viewsets

from apps.users.models import UserRole
from .models import Startup
from .serializers import StartupSerializer


class StartupViewSet(viewsets.ModelViewSet):
    serializer_class = StartupSerializer

    def get_permissions(self):
        if self.action in {"list", "retrieve"}:
            return [permissions.AllowAny()]
        return [permissions.IsAuthenticated()]

    def get_queryset(self):
        queryset = Startup.objects.select_related("founder").order_by("-created_at")
        if self.request.user.is_authenticated and self.request.user.is_staff:
            return queryset
        if self.request.user.is_authenticated and self.request.user.role == UserRole.FOUNDER:
            return queryset.filter(founder=self.request.user)
        return queryset.filter(status="published")

    def perform_create(self, serializer):
        serializer.save(founder=self.request.user)