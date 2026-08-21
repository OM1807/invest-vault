from rest_framework import serializers

from .models import Conversation, Message


class MessageSerializer(serializers.ModelSerializer):
    sender_name = serializers.CharField(source="sender.full_name", read_only=True)

    class Meta:
        model = Message
        fields = ("id", "conversation", "sender", "sender_name", "text", "created_at", "is_read")
        read_only_fields = ("sender", "created_at", "is_read")


class ConversationSerializer(serializers.ModelSerializer):
    startup_name = serializers.CharField(source="startup.name", read_only=True)
    founder_name = serializers.CharField(source="founder.full_name", read_only=True)
    investor_name = serializers.CharField(source="investor.full_name", read_only=True)
    last_message = serializers.SerializerMethodField()

    class Meta:
        model = Conversation
        fields = (
            "id", "startup", "startup_name", "founder", "founder_name",
            "investor", "investor_name", "created_at", "last_message",
        )
        read_only_fields = ("founder", "investor", "created_at")

    def get_last_message(self, obj):
        msg = obj.messages.order_by("-created_at").first()
        return MessageSerializer(msg).data if msg else None

    def create(self, validated_data):
        request = self.context["request"]
        startup = validated_data["startup"]
        validated_data["founder"] = startup.founder
        validated_data["investor"] = request.user
        return super().create(validated_data)