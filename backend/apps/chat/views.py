from rest_framework import permissions, status, viewsets
from rest_framework.exceptions import PermissionDenied
from rest_framework.response import Response

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

    def create(self, request, *args, **kwargs):
        if request.user.role != UserRole.INVESTOR:
            raise PermissionDenied("Only investors can start a conversation.")

        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        startup = serializer.validated_data["startup"]

        # A conversation for this (startup, founder, investor) triple is
        # unique in the DB. Re-opening a chat the investor already started
        # (revisiting the page, double-clicking "Message founder", etc.)
        # used to hit that constraint and crash with a 500 IntegrityError.
        # get_or_create makes re-opening idempotent: return the existing
        # conversation instead of trying to insert a duplicate row.
        conversation, created = Conversation.objects.get_or_create(
            startup=startup,
            founder=startup.founder,
            investor=request.user,
        )

        output_serializer = self.get_serializer(conversation)
        headers = self.get_success_headers(output_serializer.data)
        return Response(
            output_serializer.data,
            status=status.HTTP_201_CREATED if created else status.HTTP_200_OK,
            headers=headers,
        )


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