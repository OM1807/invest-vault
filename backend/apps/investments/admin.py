from django.contrib import admin

from .models import Bid, FundingRound


@admin.register(FundingRound)
class FundingRoundAdmin(admin.ModelAdmin):
    list_display = ("startup", "name", "status", "target_amount", "created_at")


@admin.register(Bid)
class BidAdmin(admin.ModelAdmin):
    list_display = ("funding_round", "investor", "amount", "status", "created_at")
