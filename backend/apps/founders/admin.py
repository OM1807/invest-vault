from django.contrib import admin

from .models import FounderProfile


@admin.register(FounderProfile)
class FounderProfileAdmin(admin.ModelAdmin):
    list_display = ("user", "company_name", "location", "created_at")
    search_fields = ("user__email", "company_name", "headline", "location")
    list_filter = ("created_at",)