import { useState, useRef, useEffect, useMemo } from 'react';
import axios from 'axios';
import { Send, Bot, User, Loader2 } from 'lucide-react';
import { useStore } from '../store/useStore';

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  toolCalls?: { name: string; success: boolean; error?: string }[];
}

function getDateContext(): string {
  const now = new Date();
  const date = now.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  const time = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  const offset = -now.getTimezoneOffset() / 60;
  const tz = `UTC${offset >= 0 ? '+' : ''}${offset}`;
  return `Current date: ${date}. Current time: ${time} (${tz}). When the user refers to "today", "tomorrow", "next Friday", "in two days", or any other relative date, calculate the corresponding ISO 8601 date from this reference point.`;
}

export default function ChatView() {
  const initialSystemContent = useMemo(() => {
    const dateCtx = getDateContext();
    return `${dateCtx}\n\nYou are a personal organizer assistant. You MUST use the available tools (create_calendar_event, create_diary_entry) whenever the user asks you to create, schedule, or log anything. Do NOT describe what you would do — actually call the tools. If the user provides enough information, call the tool immediately. Only ask clarifying questions if essential information like time or title is missing. Never refuse to use a tool when the user wants to create an event or diary entry. Always respond in the same language as the user.`;
  }, []);

  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'system', content: initialSystemContent },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const triggerRefresh = useStore((s) => s.triggerRefresh);

  const visibleMessages = messages.filter((m) => m.role !== 'system');

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [visibleMessages, loading]);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;
    const userMsg: ChatMessage = { role: 'user', content: input.trim() };
    const nextMessages = [...messages, userMsg];
    setMessages(nextMessages);
    setInput('');
    setLoading(true);

    try {
      const apiMessages = nextMessages.map((m) => ({
        role: m.role,
        content: m.content,
      }));
      const res = await axios.post('/api/chat', { messages: apiMessages });
      const msg = res.data.message;
      const toolCallResults = res.data.toolCallResults || [];
      const assistantMsg: ChatMessage = { role: 'assistant', content: msg.content || '' };

      if (toolCallResults.length > 0) {
        assistantMsg.toolCalls = toolCallResults.map((tr: any) => ({
          name: tr.name,
          success: tr.success,
          error: tr.error,
        }));
        const hasCreated = toolCallResults.some(
          (tr: any) =>
            tr.success &&
            (tr.name === 'create_calendar_event' || tr.name === 'create_diary_entry')
        );
        if (hasCreated) {
          triggerRefresh();
        }
      }
      setMessages([...nextMessages, assistantMsg]);
    } catch (err: any) {
      setMessages([
        ...nextMessages,
        { role: 'assistant', content: `Error: ${err.response?.data?.error || err.message}` },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-full flex flex-col p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">AI Assistant</h2>
        <div className="text-sm text-gray-500 dark:text-gray-400">
          Can create events and diary entries for you
        </div>
      </div>
      <div className="flex-1 overflow-auto space-y-4 pr-2 mb-4">
        {visibleMessages.map((msg, idx) => (
          <div key={idx} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {msg.role === 'assistant' && (
              <div className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center flex-shrink-0">
                <Bot size={18} className="text-primary-600 dark:text-primary-300" />
              </div>
            )}
            <div
              className={`max-w-[80%] rounded-xl px-4 py-3 ${
                msg.role === 'user'
                  ? 'bg-primary-600 text-white'
                  : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700'
              }`}
            >
              <div className="text-sm whitespace-pre-wrap">{msg.content}</div>
              {msg.toolCalls && msg.toolCalls.length > 0 && (
                <div className="mt-2 space-y-1">
                  {msg.toolCalls.map((tc, i) => (
                    <div
                      key={i}
                      className={`text-xs px-2 py-1 rounded inline-flex items-center gap-1 ${
                        tc.success
                          ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                          : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                      }`}
                    >
                      {tc.success ? 'Created' : 'Failed'}: {tc.name}
                      {tc.error && <span className="opacity-75"> — {tc.error}</span>}
                    </div>
                  ))}
                </div>
              )}
            </div>
            {msg.role === 'user' && (
              <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center flex-shrink-0">
                <User size={18} className="text-gray-600 dark:text-gray-300" />
              </div>
            )}
          </div>
        ))}
        {loading && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center flex-shrink-0">
              <Bot size={18} className="text-primary-600 dark:text-primary-300" />
            </div>
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3">
              <Loader2 size={18} className="animate-spin text-primary-500" />
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>
      <div className="flex gap-2">
        <input
          className="flex-1 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-3 outline-none focus:ring-2 focus:ring-primary-500"
          placeholder="Ask me to create an event, write a diary entry, or anything else..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
        />
        <button
          onClick={sendMessage}
          disabled={loading || !input.trim()}
          className="bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white px-4 py-3 rounded-lg transition-colors"
        >
          <Send size={18} />
        </button>
      </div>
    </div>
  );
}
