from django.db import models
from django.conf import settings
from django.core.exceptions import ValidationError
from django.utils.text import slugify

from apps.users.models import UserRole
# Create your models here.

class StartupStatus(models.TextChoices):
    DRAFT = "draft", "Draft"
    PUBLISHED = "published", "Published"
    ARCHIVED = "archived", "Archived"


class Startup(models.Model):
    founder = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="startups",        
    )
    name = models.CharField(max_length=255)
    slug = models.SlugField(max_length=255, blank=True)
    tagline = models.CharField(max_length=255, blank=True)
    description = models.TextField()
    sector = models.CharField(max_length=120)
    website_url = models.URLField(blank=True)
    pitch_deck_url = models.URLField(blank=True)
    target_amount = models.DecimalField(max_digits=14, decimal_places=2)
    equity_offered = models.DecimalField(max_digits=5, decimal_places=2)
    status = models.CharField(
        max_length=20,
        choices=StartupStatus.choices,
        default=StartupStatus.DRAFT,
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]
        constraints = [
            models.UniqueConstraint(
                fields=["founder","slug"],
                name="unique_startup_slug_per_founder",
            )
        ]

    def clean(self):
        if self.founder_id and getattr(self.founder, "role", None) != UserRole.FOUNDER:
            raise ValidationError({"founder":"Only founder users can own startups"})

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        self.full_clean()
        super().save(*args, **kwargs)

    def __str__(self):
        return self.name