from django.conf import settings
from django.core.exceptions import ValidationError
from django.db import models

from apps.users.models import UserRole


class FounderProfile(models.Model):
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="founder_profile",
    )
    company_name = models.CharField(max_length=255, blank=True)
    headline = models.CharField(max_length=255, blank=True)
    bio = models.TextField(blank=True)
    website_url = models.URLField(blank=True)
    location = models.CharField(max_length=255, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["user__first_name", "user__last_name"]

    def clean(self):
        if self.user_id and getattr(self.user, "role", None) != UserRole.FOUNDER:
            raise ValidationError({"user": "Only founder users can have a founder profile."})

    def save(self, *args, **kwargs):
        self.full_clean()
        super().save(*args, **kwargs)

    def __str__(self):
        return self.company_name or self.user.email