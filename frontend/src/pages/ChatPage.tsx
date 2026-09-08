import { useCallback, useEffect, useRef, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Send, MessageCircle } from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import Spinner from '@/components/ui/Spinner';
import EmptyState from '@/components/ui/EmptyState';
import { chatApi } from '@/lib/api';
import { connectChatSocket } from '@/lib/socket';
import type { Conversation, Message } from '@/lib/types';
import { useAuth } from '@/context/AuthContext';
import { formatDate } from '@/lib/format';

type SocketStatus = 'connecting' | 'open' | 'closed';

const RECONNECT_DELAY_MS = 2000;

export default function ChatPage() {
  const { conversationId } = useParams<{ conversationId: string }>();
  const { user } = useAuth();

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [socketStatus, setSocketStatus] = useState<SocketStatus>('connecting');
  const [text, setText] = useState('');

  const wsRef = useRef<WebSocket | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const unmountingRef = useRef(false);

  const activeId = conversationId ? Number(conversationId) : null;

  useEffect(() => {
    chatApi.listConversations().then(setConversations).finally(() => setLoading(false));
  }, []);

  const loadMessages = useCallback(async (id: number) => {
    setMessagesLoading(true);
    try {
      const msgs = await chatApi.listMessages(id);
      setMessages(msgs);
    } finally {
      setMessagesLoading(false);
    }
  }, []);

  // Bumps a conversation's preview text and re-sorts the sidebar, the way
  // a real chat app (WhatsApp, Slack, etc.) keeps the most recently active
  // thread on top.
  const touchConversationPreview = useCallback((conversationIdForMsg: number, message: Message) => {
    setConversations((prev) => {
      const next = prev.map((c) =>
        c.id === conversationIdForMsg ? { ...c, last_message: message } : c
      );
      next.sort((a, b) => {
        const at = a.last_message?.created_at ?? a.created_at;
        const bt = b.last_message?.created_at ?? b.created_at;
        return new Date(bt).getTime() - new Date(at).getTime();
      });
      return next;
    });
  }, []);

  useEffect(() => {
    if (!activeId) return;

    unmountingRef.current = false;
    setMessages([]); // don't show the previous conversation's messages while switching
    loadMessages(activeId);

    const openSocket = () => {
      setSocketStatus('connecting');
      const ws = connectChatSocket(activeId);
      wsRef.current = ws;

      ws.onopen = () => setSocketStatus('open');

      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        const incoming: Message = {
          id: data.id,
          conversation: activeId,
          sender: data.sender,
          sender_name: data.sender_name,
          text: data.text,
          created_at: data.created_at,
          is_read: false,
        };
        // Guard against duplicate delivery on reconnect.
        setMessages((prev) => (prev.some((m) => m.id === incoming.id) ? prev : [...prev, incoming]));
        touchConversationPreview(activeId, incoming);
      };

      ws.onclose = () => {
        setSocketStatus('closed');
        if (!unmountingRef.current) {
          reconnectTimerRef.current = setTimeout(openSocket, RECONNECT_DELAY_MS);
        }
      };

      ws.onerror = () => {
        ws.close();
      };
    };

    openSocket();

    return () => {
      unmountingRef.current = true;
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
      wsRef.current?.close();
      wsRef.current = null;
    };
  }, [activeId, loadMessages, touchConversationPreview]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = () => {
    if (!text.trim() || !wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
    wsRef.current.send(JSON.stringify({ text: text.trim() }));
    setText('');
  };

  const isConnected = socketStatus === 'open';

  return (
    <div className="min-h-screen bg-ink-900">
      <Navbar />
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-8 grid md:grid-cols-3 gap-6">
        <div className="glass-card p-4 md:col-span-1 h-[70vh] overflow-y-auto">
          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wide mb-4">
            Conversations
          </h2>
          {loading ? (
            <Spinner />
          ) : conversations.length === 0 ? (
            <EmptyState icon={MessageCircle} title="No conversations" description="Start a chat from a startup page." />
          ) : (
            <div className="space-y-2">
              {conversations.map((c) => (
                <Link
                  key={c.id}
                  to={`/chat/${c.id}`}
                  className={`block rounded-lg px-3 py-2 text-sm transition-colors ${
                    activeId === c.id ? 'bg-accent-500/20 text-white' : 'text-slate-300 hover:bg-white/5'
                  }`}
                >
                  <div className="font-medium">{c.startup_name}</div>
                  <div className="text-xs text-slate-500 truncate">
                    {user?.role === 'founder' ? c.investor_name : c.founder_name}
                  </div>
                  {c.last_message && (
                    <div className="text-xs text-slate-500 truncate mt-0.5">
                      {c.last_message.sender === user?.id ? 'You: ' : ''}
                      {c.last_message.text}
                    </div>
                  )}
                </Link>
              ))}
            </div>
          )}
        </div>

        <div className="glass-card p-4 md:col-span-2 h-[70vh] flex flex-col">
          {!activeId ? (
            <EmptyState icon={MessageCircle} title="Select a conversation" description="Pick a conversation from the list to start chatting." />
          ) : (
            <>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <span
                    className={`h-2 w-2 rounded-full ${
                      isConnected ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'
                    }`}
                  />
                  {isConnected ? 'Connected' : socketStatus === 'connecting' ? 'Connecting…' : 'Reconnecting…'}
                </div>
              </div>

              <div className="flex-1 overflow-y-auto space-y-3 pr-2">
                {messagesLoading ? (
                  <Spinner />
                ) : messages.length === 0 ? (
                  <EmptyState icon={MessageCircle} title="No messages yet" description="Say hello to get the conversation started." />
                ) : (
                  messages.map((m) => (
                    <div
                      key={m.id}
                      className={`max-w-[75%] rounded-xl px-3 py-2 text-sm ${
                        m.sender === user?.id
                          ? 'ml-auto bg-accent-500 text-white'
                          : 'bg-ink-800/60 text-slate-200'
                      }`}
                    >
                      <div>{m.text}</div>
                      <div className="text-[10px] opacity-60 mt-1">{formatDate(m.created_at)}</div>
                    </div>
                  ))
                )}
                <div ref={bottomRef} />
              </div>
              <div className="flex items-center gap-2 mt-4">
                <input
                  className="input-base flex-1 disabled:opacity-50"
                  placeholder={isConnected ? 'Type a message...' : 'Reconnecting to chat...'}
                  value={text}
                  disabled={!isConnected}
                  onChange={(e) => setText(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                />
                <button
                  onClick={sendMessage}
                  disabled={!isConnected || !text.trim()}
                  className="rounded-lg bg-accent-500 p-2.5 text-white hover:bg-accent-600 transition-colors disabled:opacity-50 disabled:hover:bg-accent-500"
                >
                  <Send className="h-4 w-4" />
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}