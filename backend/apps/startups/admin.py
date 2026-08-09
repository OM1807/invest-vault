from django.contrib import admin

from .models import Startup


@admin.register(Startup)
class StartupAdmin(admin.ModelAdmin):
    list_display = ("name", "founder", "sector", "status", "target_amount", "created_at")
    list_filter = ("status", "sector", "created_at")
    search_fields = ("name", "slug", "founder__email", "sector")
    prepopulated_fields = {"slug": ("name",)}