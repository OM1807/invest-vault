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

export default function ChatPage() {
  const { conversationId } = useParams<{ conversationId: string }>();
  const { user } = useAuth();

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState('');
  const wsRef = useRef<WebSocket | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const activeId = conversationId ? Number(conversationId) : null;

  useEffect(() => {
    chatApi.listConversations().then(setConversations).finally(() => setLoading(false));
  }, []);

  const loadMessages = useCallback(async (id: number) => {
    const msgs = await chatApi.listMessages(id);
    setMessages(msgs);
  }, []);

  useEffect(() => {
    if (!activeId) return;
    loadMessages(activeId);

    const ws = connectChatSocket(activeId);
    wsRef.current = ws;

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      setMessages((prev) => [
        ...prev,
        {
          id: data.id,
          conversation: activeId,
          sender: data.sender,
          sender_name: data.sender_name,
          text: data.text,
          created_at: data.created_at,
          is_read: false,
        },
      ]);
    };

    return () => ws.close();
  }, [activeId, loadMessages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = () => {
    if (!text.trim() || !wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
    wsRef.current.send(JSON.stringify({ text }));
    setText('');
  };

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
              <div className="flex-1 overflow-y-auto space-y-3 pr-2">
                {messages.map((m) => (
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
                ))}
                <div ref={bottomRef} />
              </div>
              <div className="flex items-center gap-2 mt-4">
                <input
                  className="input-base flex-1"
                  placeholder="Type a message..."
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                />
                <button
                  onClick={sendMessage}
                  className="rounded-lg bg-accent-500 p-2.5 text-white hover:bg-accent-600 transition-colors"
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