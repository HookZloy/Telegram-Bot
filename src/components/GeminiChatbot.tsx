import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage } from '../types';
import {
  Bot,
  Send,
  Sparkles,
  Zap,
  Brain,
  Globe,
  Copy,
  Check,
  RefreshCw,
  ExternalLink,
  Search,
  MessageSquare,
  HelpCircle,
  Terminal,
  ChevronDown,
  CheckCircle2
} from 'lucide-react';

export const GeminiChatbot: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome_1',
      role: 'assistant',
      content:
        '👋 Welcome to **Downloader_GodBot Copilot**! I can help you analyze media links, debug stream extractions (YouTube, TikTok, Reels, Twitter), generate FFmpeg transcoding commands, configure Telegram Bot API settings, and deploy via TGCloud CLI. What can I help you extract or transcode today?',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      modelUsed: 'gemini-3.8-flash',
    },
  ]);

  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  // Model selection state
  // gemini-3.1-flash-lite for low latency
  // gemini-3.8-flash for general tasks + search grounding
  // gemini-4-argon for deep thinking (with fallback to gemini-3.8-flash high thinking if paid key declined)
  const [selectedModel, setSelectedModel] = useState<'gemini-3.1-flash-lite' | 'gemini-3.8-flash' | 'gemini-4-argon'>('gemini-3.8-flash');
  const [useSearch, setUseSearch] = useState(true);
  const [thinking, setThinking] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const quickPrompts = [
    'How to strip TikTok watermarks in Downloader_GodBot?',
    'Generate FFmpeg command to compress video under 50MB for Telegram',
    'How to use TGCloud CLI to deploy Downloader_GodBot',
    'Troubleshoot YouTube 403 Forbidden extraction error',
    'Extract 320kbps MP3 audio from Instagram Reel',
  ];

  const handleToggleSearchGrounding = () => {
    const nextVal = !useSearch;
    setUseSearch(nextVal);
    // If turning on search grounding, ensure an appropriate model (gemini-3.8-flash) is active
    if (nextVal && selectedModel === 'gemini-3.1-flash-lite') {
      setSelectedModel('gemini-3.8-flash');
    }
  };

  const handleSend = async (textToSend?: string) => {
    const text = (textToSend || input).trim();
    if (!text || loading) return;

    const userMessage: ChatMessage = {
      id: 'msg_' + Date.now().toString(36),
      role: 'user',
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/gemini/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMessages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
          model: selectedModel,
          useSearch: useSearch && selectedModel === 'gemini-3.8-flash',
          thinking: thinking || selectedModel === 'gemini-4-argon',
        }),
      });

      const data = await res.json();
      if (data.error) {
        throw new Error(data.error);
      }

      const assistantMessage: ChatMessage = {
        id: 'msg_res_' + Date.now().toString(36),
        role: 'assistant',
        content: data.text || 'No response returned from model.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        modelUsed: data.modelUsed || selectedModel,
        groundingChunks: data.groundingChunks || [],
        isThinking: data.thinking,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: 'msg_err_' + Date.now().toString(36),
          role: 'assistant',
          content: `⚠️ Error executing request: ${err.message}`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (content: string, id: string) => {
    navigator.clipboard.writeText(content);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const clearChat = () => {
    setMessages([
      {
        id: 'welcome_' + Date.now(),
        role: 'assistant',
        content: 'Conversation history cleared. How can I assist you with Telegram bot media downloads?',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        modelUsed: selectedModel,
      },
    ]);
  };

  return (
    <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-6 shadow-xl flex flex-col h-[650px] relative">
      {/* Header with Model Selectors */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-zinc-800/80">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-sky-500/20 text-sky-400 flex items-center justify-center">
              <Bot className="w-4 h-4" />
            </div>
            <h2 className="text-base font-bold text-white">Gemini Media Copilot</h2>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300 font-mono">
              Multi-turn
            </span>
          </div>
          <p className="text-xs text-zinc-400 mt-0.5">
            Switch between low-latency fast mode, Google Search Grounding, and Deep Thinking.
          </p>
        </div>

        <button
          onClick={clearChat}
          className="text-xs text-zinc-400 hover:text-zinc-200 transition-colors self-start sm:self-auto"
        >
          Clear History
        </button>
      </div>

      {/* Model & Feature Controls bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 py-3 border-b border-zinc-800/60 bg-zinc-950/40 -mx-6 px-6">
        <div className="flex items-center gap-1.5 flex-wrap">
          {/* Low-Latency: gemini-3.1-flash-lite */}
          <button
            type="button"
            onClick={() => {
              setSelectedModel('gemini-3.1-flash-lite');
              setThinking(false);
            }}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
              selectedModel === 'gemini-3.1-flash-lite'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                : 'bg-zinc-900 text-zinc-400 hover:text-zinc-200 border border-zinc-800'
            }`}
          >
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span>Fast Lite (gemini-3.1-flash-lite)</span>
          </button>

          {/* Balanced: gemini-3.8-flash */}
          <button
            type="button"
            onClick={() => setSelectedModel('gemini-3.8-flash')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
              selectedModel === 'gemini-3.8-flash'
                ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40 shadow-sm'
                : 'bg-zinc-900 text-zinc-400 hover:text-zinc-200 border border-zinc-800'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-sky-400" />
            <span>General (gemini-3.8-flash)</span>
          </button>

          {/* Thinking / Complex: gemini-4-argon / ThinkingLevel.HIGH */}
          <button
            type="button"
            onClick={() => {
              setSelectedModel('gemini-4-argon');
              setThinking(true);
            }}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
              selectedModel === 'gemini-4-argon'
                ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40 shadow-sm'
                : 'bg-zinc-900 text-zinc-400 hover:text-zinc-200 border border-zinc-800'
            }`}
          >
            <Brain className="w-3.5 h-3.5 text-purple-400" />
            <span>Deep Thinking (gemini-4-argon / ThinkingLevel.HIGH)</span>
          </button>
        </div>

        {/* Search Grounding Toggle and Thinking Mode Controls */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Dedicated Search Grounding Toggle */}
          <div
            onClick={handleToggleSearchGrounding}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border cursor-pointer select-none transition-all shadow-sm ${
              useSearch
                ? 'bg-emerald-950/40 border-emerald-500/60 text-emerald-300 ring-1 ring-emerald-500/30'
                : 'bg-zinc-950/60 border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700'
            }`}
            title="Toggle Google Search Grounding to verify AI responses against live web results"
          >
            <div className="flex items-center gap-1.5">
              <Globe className={`w-3.5 h-3.5 ${useSearch ? 'text-emerald-400 animate-pulse' : 'text-zinc-500'}`} />
              <span className="text-xs font-semibold">Search Grounding</span>
            </div>

            {/* Switch Slider */}
            <div
              className={`relative inline-flex h-4 w-8 shrink-0 rounded-full border border-transparent transition-colors duration-200 ease-in-out ${
                useSearch ? 'bg-emerald-500' : 'bg-zinc-700'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition duration-200 ease-in-out ${
                  useSearch ? 'translate-x-4' : 'translate-x-0'
                }`}
              />
            </div>

            <span
              className={`text-[10px] uppercase font-mono font-bold px-1.5 py-0.2 rounded ${
                useSearch
                  ? 'bg-emerald-500/20 text-emerald-300'
                  : 'bg-zinc-800 text-zinc-400'
              }`}
            >
              {useSearch ? 'Live On' : 'Off'}
            </span>
          </div>

          {/* Thinking Mode Toggle */}
          {selectedModel !== 'gemini-3.1-flash-lite' && (
            <button
              type="button"
              onClick={() => setThinking(!thinking)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition-all ${
                thinking
                  ? 'bg-purple-500/20 text-purple-300 border-purple-500/40'
                  : 'bg-zinc-900 text-zinc-500 border-zinc-800'
              }`}
            >
              <Brain className="w-3.5 h-3.5 text-purple-400" />
              <span>Thinking: {thinking ? 'HIGH' : 'OFF'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Search Grounding Active Banner */}
      {useSearch && (
        <div className="bg-emerald-950/30 border-b border-emerald-900/40 px-6 py-1.5 -mx-6 flex items-center justify-between text-[11px] text-emerald-300">
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
            <span>
              <strong>Search Grounding Active:</strong> Verifying responses with live Google Search results &amp; web citations.
            </span>
          </span>
          <span className="text-[10px] text-emerald-400/80 font-mono hidden sm:inline">
            gemini-3.8-flash + googleSearch
          </span>
        </div>
      )}

      {/* Messages Scrollable Thread */}
      <div className="flex-1 overflow-y-auto py-4 space-y-4 pr-1">
        {messages.map((msg) => {
          const isUser = msg.role === 'user';
          return (
            <div
              key={msg.id}
              className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}
            >
              <div
                className={`max-w-[85%] sm:max-w-[80%] rounded-2xl p-4 shadow-md ${
                  isUser
                    ? 'bg-sky-600 text-white rounded-br-none'
                    : 'bg-zinc-950/90 text-zinc-200 border border-zinc-800 rounded-bl-none'
                }`}
              >
                {/* Meta info header */}
                <div className="flex items-center justify-between gap-3 text-[10px] text-zinc-400 mb-1.5">
                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold text-zinc-300">
                      {isUser ? 'You' : 'Downloader GodBot AI'}
                    </span>
                    {!isUser && msg.modelUsed && (
                      <span className="font-mono text-zinc-400 px-1 py-0.2 rounded bg-zinc-900 border border-zinc-800">
                        {msg.modelUsed}
                      </span>
                    )}
                    {msg.isThinking && (
                      <span className="text-purple-400 flex items-center gap-0.5">
                        <Brain className="w-2.5 h-2.5" /> High Thinking
                      </span>
                    )}
                  </div>
                  <span>{msg.timestamp}</span>
                </div>

                {/* Message Body */}
                <div className="text-xs sm:text-sm whitespace-pre-line leading-relaxed font-sans select-text">
                  {msg.content}
                </div>

                {/* Grounding Citations */}
                {msg.groundingChunks && msg.groundingChunks.length > 0 && (
                  <div className="mt-3 pt-2 border-t border-zinc-800">
                    <div className="flex items-center justify-between text-[11px] mb-1.5">
                      <span className="font-semibold text-emerald-400 flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Verified with {msg.groundingChunks.length} Live Web {msg.groundingChunks.length === 1 ? 'Source' : 'Sources'}</span>
                      </span>
                      <span className="text-[10px] text-zinc-500 font-mono">Google Search Grounding</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {msg.groundingChunks.map((chunk, cIdx) => {
                        const uri = chunk.web?.uri;
                        const title = chunk.web?.title || uri;
                        if (!uri) return null;
                        return (
                          <a
                            key={cIdx}
                            href={uri}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[11px] text-sky-400 hover:text-sky-300 bg-sky-950/50 border border-sky-800/60 px-2 py-0.5 rounded flex items-center gap-1 max-w-[220px] truncate"
                          >
                            <span className="truncate">{title}</span>
                            <ExternalLink className="w-2.5 h-2.5 flex-shrink-0" />
                          </a>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Copy message button */}
              {!isUser && (
                <button
                  onClick={() => handleCopy(msg.content, msg.id)}
                  className="mt-1 text-[11px] text-zinc-500 hover:text-zinc-300 flex items-center gap-1 px-1"
                >
                  {copiedId === msg.id ? (
                    <Check className="w-3 h-3 text-emerald-400" />
                  ) : (
                    <Copy className="w-3 h-3" />
                  )}
                  <span>{copiedId === msg.id ? 'Copied' : 'Copy'}</span>
                </button>
              )}
            </div>
          );
        })}

        {loading && (
          <div className="flex items-start">
            <div className="bg-zinc-950 border border-zinc-800 rounded-2xl rounded-bl-none p-4 max-w-sm">
              <div className="flex items-center gap-2 text-xs text-zinc-400">
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-sky-400" />
                <span>
                  {thinking
                    ? 'Thinking in depth (ThinkingLevel.HIGH)...'
                    : useSearch
                    ? 'Consulting Google Search & analyzing streams...'
                    : 'Generating response...'}
                </span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Quick Prompts */}
      <div className="pt-2 pb-1 overflow-x-auto flex items-center gap-1.5 no-scrollbar">
        {quickPrompts.map((q, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => handleSend(q)}
            className="text-[11px] whitespace-nowrap bg-zinc-950 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 border border-zinc-800 px-2.5 py-1 rounded-full transition-colors flex-shrink-0"
          >
            {q}
          </button>
        ))}
      </div>

      {/* Chat Input Bar */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend();
        }}
        className="mt-2 flex items-center gap-2"
      >
        <div className="relative flex-1">
          <input
            type="text"
            placeholder={`Ask Downloader GodBot Copilot (${selectedModel})...`}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={loading}
            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 disabled:opacity-50"
          />
        </div>
        <button
          type="submit"
          disabled={!input.trim() || loading}
          className="flex items-center justify-center p-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-medium shadow-md transition-all disabled:opacity-50"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
};
