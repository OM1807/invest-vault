import json

from channels.db import database_sync_to_async
from channels.generic.websocket import AsyncWebsocketConsumer


class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.conversation_id = self.scope["url_route"]["kwargs"]["conversation_id"]
        self.group_name = f"chat_{self.conversation_id}"
        user = self.scope.get("user")

        if not user or not user.is_authenticated:
            await self.close()
            return

        allowed = await self.user_in_conversation(user.id, self.conversation_id)
        if not allowed:
            await self.close()
            return

        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.accept()

    async def disconnect(self, close_code):
        if hasattr(self, "group_name"):
            await self.channel_layer.group_discard(self.group_name, self.channel_name)

    async def receive(self, text_data):
        data = json.loads(text_data)
        text = data.get("text", "").strip()
        if not text:
            return

        user = self.scope["user"]
        message = await self.save_message(user.id, self.conversation_id, text)

        await self.channel_layer.group_send(
            self.group_name,
            {
                "type": "chat.message",
                "id": message.id,
                "text": message.text,
                "sender": user.id,
                "sender_name": user.full_name,
                "created_at": message.created_at.isoformat(),
            },
        )

    async def chat_message(self, event):
        await self.send(text_data=json.dumps(event))

    @database_sync_to_async
    def user_in_conversation(self, user_id, conversation_id):
        from .models import Conversation
        return Conversation.objects.filter(
            id=conversation_id
        ).filter(
            models_q_id(user_id)
        ).exists()

    @database_sync_to_async
    def save_message(self, user_id, conversation_id, text):
        from .models import Message
        return Message.objects.create(
            conversation_id=conversation_id, sender_id=user_id, text=text
        )


def models_q_id(user_id):
    from django.db.models import Q
    return Q(founder_id=user_id) | Q(investor_id=user_id)