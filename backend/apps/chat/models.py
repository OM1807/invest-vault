from django.conf import settings
from django.db import models

from apps.startups.models import Startup


class Conversation(models.Model):
    startup = models.ForeignKey(
        Startup, on_delete=models.CASCADE, related_name="conversations"
    )
    founder = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="founder_conversations"
    )
    investor = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="investor_conversations"
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
        constraints = [
            models.UniqueConstraint(
                fields=["startup", "founder", "investor"],
                name="unique_conversation_per_startup_pair",
            )
        ]

    def __str__(self):
        return f"{self.founder.email} <-> {self.investor.email} ({self.startup.name})"


class Message(models.Model):
    conversation = models.ForeignKey(
        Conversation, on_delete=models.CASCADE, related_name="messages"
    )
    sender = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="sent_messages"
    )
    text = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    is_read = models.BooleanField(default=False)

    class Meta:
        ordering = ["created_at"]

    def __str__(self):
        return f"{self.sender.email}: {self.text[:30]}"