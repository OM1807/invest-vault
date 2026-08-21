from rest_framework import permissions, viewsets
from rest_framework.exceptions import PermissionDenied

from apps.users.models import UserRole
from .models import Conversation, Message
from .serializers import ConversationSerializer, MessageSerializer


class ConversationViewSet(viewsets.ModelViewSet):
    serializer_class = ConversationSerializer
    permission_classes = [permissions.IsAuthenticated]
    http_method_names = ["get", "post", "head"]

    def get_queryset(self):
        user = self.request.user
        return Conversation.objects.filter(
            models_q(user)
        ).select_related("startup", "founder", "investor").order_by("-created_at")

    def perform_create(self, serializer):
        if self.request.user.role != UserRole.INVESTOR:
            raise PermissionDenied("Only investors can start a conversation.")
        serializer.save()


def models_q(user):
    from django.db.models import Q
    return Q(founder=user) | Q(investor=user)


class MessageViewSet(viewsets.ModelViewSet):
    serializer_class = MessageSerializer
    permission_classes = [permissions.IsAuthenticated]
    http_method_names = ["get", "post", "head"]

    def get_queryset(self):
        user = self.request.user
        qs = Message.objects.filter(
            models_q_conv(user)
        ).select_related("conversation", "sender").order_by("created_at")
        conversation_id = self.request.query_params.get("conversation")
        if conversation_id:
            qs = qs.filter(conversation_id=conversation_id)
        return qs

    def perform_create(self, serializer):
        conversation = serializer.validated_data["conversation"]
        user = self.request.user
        if user.id not in (conversation.founder_id, conversation.investor_id):
            raise PermissionDenied("You are not part of this conversation.")
        serializer.save(sender=user)


def models_q_conv(user):
    from django.db.models import Q
    return Q(conversation__founder=user) | Q(conversation__investor=user)