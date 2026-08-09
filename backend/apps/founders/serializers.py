from rest_framework import serializers

from apps.users.models import UserRole
from .models import FounderProfile


class FounderProfileSerializer(serializers.ModelSerializer):
    user_email = serializers.EmailField(source="user.email", read_only=True)

    class Meta:
        model = FounderProfile
        fields = (
            "id",
            "user",
            "user_email",
            "company_name",
            "headline",
            "bio",
            "website_url",
            "location",
            "created_at",
            "updated_at",
        )
        read_only_fields = ("user", "created_at", "updated_at")

    def validate(self, attrs):
        request = self.context["request"]
        if request.user.role != UserRole.FOUNDER:
            raise serializers.ValidationError(
                {"detail": "Only founder users can create a founder profile."}
            )
        return attrs