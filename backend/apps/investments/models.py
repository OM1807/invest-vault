from django.conf import settings
from django.core.exceptions import ValidationError
from django.db import models

from apps.startups.models import Startup
from apps.users.models import UserRole


class FundingRoundStatus(models.TextChoices):
    OPEN = "open", "Open"
    CLOSED = "closed", "Closed"
    FUNDED = "funded", "Funded"


class FundingRound(models.Model):
    startup = models.ForeignKey(
        Startup,
        on_delete=models.CASCADE,
        related_name="funding_rounds",
    )
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    target_amount = models.DecimalField(max_digits=14, decimal_places=2)
    minimum_ticket_size = models.DecimalField(max_digits=14, decimal_places=2)
    maximum_ticket_size = models.DecimalField(max_digits=14, decimal_places=2)
    status = models.CharField(
        max_length=20,
        choices=FundingRoundStatus.choices,
        default=FundingRoundStatus.OPEN,
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def clean(self):
        if self.startup_id and getattr(self.startup.founder, "role", None) != UserRole.FOUNDER:
            raise ValidationError({"startup": "Funding rounds must belong to a founder-owned startup."})
        if self.minimum_ticket_size and self.maximum_ticket_size:
            if self.minimum_ticket_size > self.maximum_ticket_size:
                raise ValidationError({"maximum_ticket_size": "Maximum ticket size cannot be smaller than the minimum."})

    def save(self, *args, **kwargs):
        self.full_clean()
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.startup.name} - {self.name}"


class BidStatus(models.TextChoices):
    PENDING = "pending", "Pending"
    ACCEPTED = "accepted", "Accepted"
    REJECTED = "rejected", "Rejected"


class Bid(models.Model):
    funding_round = models.ForeignKey(
        FundingRound,
        on_delete=models.CASCADE,
        related_name="bids",
    )
    investor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="bids",
    )
    amount = models.DecimalField(max_digits=14, decimal_places=2)
    equity_requested = models.DecimalField(max_digits=5, decimal_places=2)
    message = models.TextField(blank=True)
    status = models.CharField(
        max_length=20,
        choices=BidStatus.choices,
        default=BidStatus.PENDING,
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def clean(self):
        if self.investor_id and getattr(self.investor, "role", None) != UserRole.INVESTOR:
            raise ValidationError({"investor": "Only investor users can place bids."})
        if self.amount is not None and self.funding_round_id:
            if self.amount < self.funding_round.minimum_ticket_size:
                raise ValidationError({"amount": "Bid amount is below the minimum ticket size."})
            if self.amount > self.funding_round.maximum_ticket_size:
                raise ValidationError({"amount": "Bid amount exceeds the maximum ticket size."})

    def save(self, *args, **kwargs):
        self.full_clean()
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.investor.email} -> {self.funding_round}"
