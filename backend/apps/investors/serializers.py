from rest_framework import serializers

from apps.users.models import UserRole
from .models import InvestorProfile


class InvestorProfileSerializer(serializers.ModelSerializer):
    user_email = serializers.EmailField(source="user.email", read_only=True)

    class Meta:
        model = InvestorProfile
        fields = (
            "id",
            "user",
            "user_email",
            "firm_name",
            "headline",
            "bio",
            "investment_focus",
            "min_ticket_size",
            "max_ticket_size",
            "website_url",
            "created_at",
            "updated_at",
        )
        read_only_fields = ("user", "created_at", "updated_at")

    def validate(self, attrs):
        request = self.context["request"]
        if request.user.role != UserRole.INVESTOR:
            raise serializers.ValidationError(
                {"detail": "Only investor users can create an investor profile."}
            )
        return attrs