from django.contrib import admin

from .models import InvestorProfile


@admin.register(InvestorProfile)
class InvestorProfileAdmin(admin.ModelAdmin):
    list_display = ("user", "firm_name", "investment_focus", "created_at")
    search_fields = ("user__email", "firm_name", "headline", "investment_focus")
    list_filter = ("created_at",)