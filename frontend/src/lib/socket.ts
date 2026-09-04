import { getAccessToken } from './api';

const WS_BASE_URL = import.meta.env.VITE_WS_BASE_URL || 'ws://localhost:8000';

export function connectChatSocket(conversationId: number): WebSocket {
  const token = getAccessToken();
  const url = `${WS_BASE_URL}/ws/chat/${conversationId}/?token=${token}`;
  return new WebSocket(url);
}