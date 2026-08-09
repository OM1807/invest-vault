from rest_framework import serializers

from apps.users.models import UserRole
from .models import Bid, BidStatus, FundingRound


class FundingRoundSerializer(serializers.ModelSerializer):
    startup_name = serializers.CharField(source="startup.name", read_only=True)

    class Meta:
        model = FundingRound
        fields = (
            "id",
            "startup",
            "startup_name",
            "name",
            "description",
            "target_amount",
            "minimum_ticket_size",
            "maximum_ticket_size",
            "status",
            "created_at",
            "updated_at",
        )
        read_only_fields = ("created_at", "updated_at")

    def validate(self, attrs):
        request = self.context["request"]
        if request.user.role != UserRole.FOUNDER:
            raise serializers.ValidationError(
                {"detail": "Only founders can create funding rounds."}
            )
        return attrs


class BidSerializer(serializers.ModelSerializer):
    investor_name = serializers.CharField(source="investor.full_name", read_only=True)
    funding_round_name = serializers.CharField(source="funding_round.name", read_only=True)

    class Meta:
        model = Bid
        fields = (
            "id",
            "funding_round",
            "funding_round_name",
            "investor",
            "investor_name",
            "amount",
            "equity_requested",
            "message",
            "status",
            "created_at",
            "updated_at",
        )
        read_only_fields = ("investor", "status", "created_at", "updated_at")

    def validate(self, attrs):
        request = self.context["request"]
        if request.user.role != UserRole.INVESTOR:
            raise serializers.ValidationError(
                {"detail": "Only investors can place bids."}
            )
        funding_round = attrs.get("funding_round")
        if funding_round and funding_round.status != "open":
            raise serializers.ValidationError(
                {"detail": "Funding round is not accepting bids."}
            )
        return attrs

    def create(self, validated_data):
        request = self.context["request"]
        validated_data["investor"] = request.user
        validated_data["status"] = BidStatus.PENDING
        return super().create(validated_data)


class BidDecisionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Bid
        fields = ("status",)
