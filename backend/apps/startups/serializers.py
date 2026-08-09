from django.utils.text import slugify
from rest_framework import serializers

from apps.users.models import UserRole
from .models import Startup


class StartupSerializer(serializers.ModelSerializer):
    founder_email = serializers.EmailField(source="founder.email", read_only=True)

    class Meta:
        model = Startup
        fields = (
            "id",
            "founder",
            "founder_email",
            "name",
            "slug",
            "tagline",
            "description",
            "sector",
            "website_url",
            "pitch_deck_url",
            "target_amount",
            "equity_offered",
            "status",
            "created_at",
            "updated_at",
        )
        read_only_fields = ("founder", "created_at", "updated_at")

    def validate(self, attrs):
        request = self.context["request"]
        if request.user.role != UserRole.FOUNDER:
            raise serializers.ValidationError(
                {"detail": "Only founder users can create or edit startups."}
            )
        return attrs

    def create(self, validated_data):
        request = self.context["request"]
        validated_data["founder"] = request.user
        if not validated_data.get("slug"):
            validated_data["slug"] = slugify(validated_data["name"])
        return super().create(validated_data)