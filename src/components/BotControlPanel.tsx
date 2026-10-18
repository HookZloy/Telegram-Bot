import React, { useState } from 'react';
import { TelegramBotInfo } from '../types';
import {
  Send,
  Terminal,
  Key,
  Layers,
  Copy,
  Check,
  RefreshCw,
  Cpu,
  Wifi,
  Sparkles,
  MessageSquare
} from 'lucide-react';

interface BotControlPanelProps {
  botInfo: TelegramBotInfo | null;
  botLoading: boolean;
  onRefresh: () => void;
}

export const BotControlPanel: React.FC<BotControlPanelProps> = ({
  botInfo,
  botLoading,
  onRefresh,
}) => {
  const [copiedToken, setCopiedToken] = useState(false);
  const [copiedCli, setCopiedCli] = useState(false);
  const [copiedAppId, setCopiedAppId] = useState(false);

  // Send message test state
  const [chatId, setChatId] = useState('');
  const [testMessage, setTestMessage] = useState('⚡ Downloader_GodBot online & operational! Ready for media downloads.');
  const [sendingMsg, setSendingMsg] = useState(false);
  const [sendResult, setSendResult] = useState<{ success: boolean; text: string } | null>(null);

  const BOT_TOKEN = '8701498346:AAHrGsDhrK8TLLP-KGl_8SmRqyc3JcOseFo';
  const CLI_COMMAND = 'npm create @tgcloud/bot Downloader_GodBot';
  const CLI_APP_ID = 'app8701498346:4HMOowhjWhUjjP8RpHQIVYIcC-biEdOo6yYTM5cClHU';

  const handleCopy = (text: string, setter: (val: boolean) => void) => {
    navigator.clipboard.writeText(text);
    setter(true);
    setTimeout(() => setter(false), 2000);
  };

  const handleSendTest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatId.trim() || !testMessage.trim()) return;

    setSendingMsg(true);
    setSendResult(null);

    try {
      const res = await fetch('/api/bot/send-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chatId: chatId.trim(), message: testMessage }),
      });
      const data = await res.json();
      if (data.success) {
        setSendResult({ success: true, text: `Message sent successfully! (ID: ${data.result?.message_id})` });
      } else {
        setSendResult({ success: false, text: data.error || 'Failed to send message.' });
      }
    } catch (err: any) {
      setSendResult({ success: false, text: err.message || 'Network error' });
    } finally {
      setSendingMsg(false);
    }
  };

  return (
    <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-5 shadow-xl relative overflow-hidden">
      {/* Glow background accent */}
      <div className="absolute -right-20 -top-20 w-64 h-64 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 pb-4 border-b border-zinc-800/80">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Cpu className="w-5 h-5 text-sky-400" />
              Telegram Bot API &amp; Cloud CLI Center
            </h2>
            <span className="px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              Live Verified
            </span>
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            Connected to Telegram Bot Engine via official Bot API and TGCloud CLI.
          </p>
        </div>

        <button
          onClick={onRefresh}
          disabled={botLoading}
          className="flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700/80 text-zinc-200 text-xs font-medium transition-colors disabled:opacity-50 self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${botLoading ? 'animate-spin text-sky-400' : ''}`} />
          <span>{botLoading ? 'Refreshing...' : 'Ping Bot API'}</span>
        </button>
      </div>

      {/* Bot credentials and stats grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
        {/* Card 1: Bot Identity */}
        <div className="bg-zinc-950/60 border border-zinc-800/80 rounded-xl p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs text-zinc-400 mb-2">
              <span className="flex items-center gap-1.5 font-medium">
                <Wifi className="w-3.5 h-3.5 text-emerald-400" /> Telegram Identity
              </span>
              <span className="text-[10px] bg-emerald-950/60 text-emerald-400 px-1.5 py-0.5 rounded border border-emerald-800/50">
                Online
              </span>
            </div>
            <div className="text-sm font-bold text-white mb-1">
              {botInfo?.first_name || 'Downloader God'}
            </div>
            <div className="text-xs text-sky-400 font-mono flex items-center gap-1">
              @{botInfo?.username || 'Downloader_GodBot'}
            </div>
          </div>

          <div className="mt-3 pt-3 border-t border-zinc-800/60 grid grid-cols-2 gap-2 text-[11px] text-zinc-400">
            <div>
              <span className="text-zinc-500 block">Bot ID:</span>
              <span className="font-mono text-zinc-300 font-medium">8701498346</span>
            </div>
            <div>
              <span className="text-zinc-500 block">Groups:</span>
              <span className="text-zinc-300 font-medium">{botInfo?.can_join_groups ? 'Supported' : 'Enabled'}</span>
            </div>
          </div>
        </div>

        {/* Card 2: CLI Access */}
        <div className="bg-zinc-950/60 border border-zinc-800/80 rounded-xl p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs text-zinc-400 mb-2">
              <span className="flex items-center gap-1.5 font-medium">
                <Terminal className="w-3.5 h-3.5 text-sky-400" /> TGCloud CLI Access
              </span>
              <button
                onClick={() => handleCopy(CLI_COMMAND, setCopiedCli)}
                className="text-[11px] text-zinc-400 hover:text-white flex items-center gap-1 transition-colors"
              >
                {copiedCli ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copiedCli ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
            <code className="text-xs font-mono bg-zinc-900 text-sky-300 px-2 py-1.5 rounded block overflow-x-auto whitespace-nowrap border border-zinc-800">
              {CLI_COMMAND}
            </code>
          </div>

          <div className="mt-3 pt-3 border-t border-zinc-800/60 text-[11px] text-zinc-400 flex items-center justify-between">
            <span className="truncate max-w-[170px] font-mono text-zinc-300">
              {CLI_APP_ID.slice(0, 20)}...
            </span>
            <button
              onClick={() => handleCopy(CLI_APP_ID, setCopiedAppId)}
              className="text-xs text-sky-400 hover:underline flex items-center gap-1"
            >
              {copiedAppId ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              <span>App ID</span>
            </button>
          </div>
        </div>

        {/* Card 3: Bot API Token */}
        <div className="bg-zinc-950/60 border border-zinc-800/80 rounded-xl p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs text-zinc-400 mb-2">
              <span className="flex items-center gap-1.5 font-medium">
                <Key className="w-3.5 h-3.5 text-amber-400" /> Telegram Bot Token
              </span>
              <button
                onClick={() => handleCopy(BOT_TOKEN, setCopiedToken)}
                className="text-[11px] text-zinc-400 hover:text-white flex items-center gap-1 transition-colors"
              >
                {copiedToken ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copiedToken ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
            <div className="font-mono text-xs bg-zinc-900 text-amber-300/90 px-2 py-1.5 rounded border border-zinc-800 flex items-center justify-between">
              <span>8701498346:••••••••••••••</span>
            </div>
          </div>

          <div className="mt-3 pt-3 border-t border-zinc-800/60 flex items-center justify-between text-[11px] text-zinc-400">
            <span>Webhook: Active (TGCloud)</span>
            <span className="text-emerald-400 flex items-center gap-1">
              <Sparkles className="w-3 h-3" /> Ready
            </span>
          </div>
        </div>
      </div>

      {/* Live Telegram Message Dispatcher & Test Form */}
      <div className="bg-zinc-950/40 border border-zinc-800/70 rounded-xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <MessageSquare className="w-4 h-4 text-sky-400" />
          <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-200">
            Send Test Message or Media Link via Bot
          </h3>
          <span className="text-[11px] text-zinc-500">
            (Enter your Telegram User ID or Channel ID to test live delivery)
          </span>
        </div>

        <form onSubmit={handleSendTest} className="flex flex-col sm:flex-row gap-3">
          <div className="w-full sm:w-44">
            <input
              type="text"
              placeholder="Telegram Chat ID (e.g. 123456789)"
              value={chatId}
              onChange={(e) => setChatId(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-sky-500 font-mono"
            />
          </div>
          <div className="flex-1">
            <input
              type="text"
              placeholder="Message content or /dl command link..."
              value={testMessage}
              onChange={(e) => setTestMessage(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-sky-500"
            />
          </div>
          <button
            type="submit"
            disabled={sendingMsg || !chatId.trim()}
            className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-medium text-xs shadow-md transition-all disabled:opacity-50 disabled:pointer-events-none"
          >
            {sendingMsg ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Send className="w-3.5 h-3.5" />
            )}
            <span>{sendingMsg ? 'Sending...' : 'Dispatch'}</span>
          </button>
        </form>

        {sendResult && (
          <div
            className={`mt-2.5 p-2 rounded-lg text-xs font-medium flex items-center justify-between ${
              sendResult.success
                ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-800/60'
                : 'bg-red-950/60 text-red-300 border border-red-800/60'
            }`}
          >
            <span>{sendResult.text}</span>
            <button
              onClick={() => setSendResult(null)}
              className="text-zinc-400 hover:text-white text-xs px-1"
            >
              ×
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
