import React, { useState, useEffect } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { auth, testConnection } from './firebase';
import { Header } from './components/Header';
import { BotControlPanel } from './components/BotControlPanel';
import { MediaDownloader } from './components/MediaDownloader';
import { DownloadHistory } from './components/DownloadHistory';
import { GeminiChatbot } from './components/GeminiChatbot';
import { BotSettingsModal } from './components/BotSettingsModal';
import { TelemetryMonitor } from './components/TelemetryMonitor';
import { PlaylistBatchDownloader } from './components/PlaylistBatchDownloader';
import { ParallelStreamAccelerator } from './components/ParallelStreamAccelerator';
import { SmartMediaTrimmerModal } from './components/SmartMediaTrimmerModal';
import { DownloadTask, TelegramBotInfo } from './types';
import {
  Download,
  Bot,
  Terminal,
  Cpu,
  Settings,
  Sparkles,
  Layers,
  ArrowRight,
  Shield,
  Zap,
  Globe,
  Activity,
  ListMusic,
  Radio
} from 'lucide-react';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);

  // Telegram bot state
  const [botInfo, setBotInfo] = useState<TelegramBotInfo | null>(null);
  const [botLoading, setBotLoading] = useState(false);

  // Guest download tasks (persisted in session)
  const [guestTasks, setGuestTasks] = useState<DownloadTask[]>([]);

  // Active view tab
  const [activeTab, setActiveTab] = useState<'downloader' | 'playlist-batch' | 'accelerator' | 'telemetry' | 'ai-copilot' | 'bot-control'>('downloader');

  // Trimmer modal opened from History
  const [historyTrimmerTask, setHistoryTrimmerTask] = useState<DownloadTask | null>(null);

  // Settings modal
  const [settingsOpen, setSettingsOpen] = useState(false);

  // Run initial Firebase connection test on startup as required by Skill
  useEffect(() => {
    testConnection();
  }, []);

  // Listen to Firebase Auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthReady(true);
    });
    return () => unsubscribe();
  }, []);

  // Fetch Telegram Bot status from Express backend
  const fetchBotStatus = async () => {
    setBotLoading(true);
    try {
      const res = await fetch('/api/bot/status');
      const data = await res.json();
      if (data.success && data.result) {
        setBotInfo(data.result);
      }
    } catch (err) {
      console.error('Failed to load bot status:', err);
    } finally {
      setBotLoading(false);
    }
  };

  useEffect(() => {
    fetchBotStatus();
  }, []);

  const handleTaskCreated = (newTask: DownloadTask) => {
    if (!user) {
      setGuestTasks((prev) => [newTask, ...prev]);
    }
  };

  const handleBatchTasksCreated = (newTasks: DownloadTask[]) => {
    if (!user) {
      setGuestTasks((prev) => [...newTasks, ...prev]);
    }
  };

  const handleRemoveGuestTask = (taskId: string) => {
    setGuestTasks((prev) => prev.filter((t) => t.id !== taskId));
  };

  const dynamicStorageMB = 4820 + guestTasks.length * 42;
  const isDownloading = guestTasks.some((t) => t.status === 'downloading');

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans selection:bg-sky-500/30 selection:text-white">
      {/* Top Header with Storage Usage Indicator */}
      <Header
        user={user}
        botInfo={botInfo}
        botLoading={botLoading}
        usedStorageMB={dynamicStorageMB}
      />

      {/* Hero Banner with Quick Stats & Navigation */}
      <div className="border-b border-zinc-800/80 bg-gradient-to-b from-zinc-900/60 to-zinc-950 px-4 sm:px-6 pt-6 pb-5">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-sky-500/10 text-sky-400 border border-sky-500/30">
                  <Terminal className="w-3 h-3" /> TGCloud Bot Node Active
                </span>
                <span className="text-xs text-zinc-400 font-mono">
                  app8701498346:4HMOowhj...
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                Downloader_GodBot Control Hub
              </h1>
              <p className="text-xs sm:text-sm text-zinc-400 mt-1 max-w-2xl">
                Universal multimedia link downloader, live Telegram bot API tester, and Gemini AI extraction copilot powered by Google Search Grounding and Deep Thinking.
              </p>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setSettingsOpen(true)}
                className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white text-xs font-medium border border-zinc-800 transition-colors"
              >
                <Settings className="w-4 h-4 text-zinc-400" />
                <span>Preferences</span>
              </button>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-2 mt-6 overflow-x-auto no-scrollbar">
            <button
              onClick={() => setActiveTab('downloader')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                activeTab === 'downloader'
                  ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-600/20'
                  : 'bg-zinc-900/80 text-zinc-400 hover:text-white hover:bg-zinc-800/80 border border-zinc-800'
              }`}
            >
              <Download className="w-4 h-4" />
              <span>4K Downloader</span>
            </button>

            <button
              onClick={() => setActiveTab('playlist-batch')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                activeTab === 'playlist-batch'
                  ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-600/20'
                  : 'bg-zinc-900/80 text-zinc-400 hover:text-white hover:bg-zinc-800/80 border border-zinc-800'
              }`}
            >
              <ListMusic className="w-4 h-4 text-cyan-400" />
              <span>Playlists &amp; Batch 4K</span>
            </button>

            <button
              onClick={() => setActiveTab('accelerator')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                activeTab === 'accelerator'
                  ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-600/20'
                  : 'bg-zinc-900/80 text-zinc-400 hover:text-white hover:bg-zinc-800/80 border border-zinc-800'
              }`}
            >
              <Zap className="w-4 h-4 text-amber-400" />
              <span>Parallel Accelerator &amp; Cache</span>
            </button>

            <button
              onClick={() => setActiveTab('telemetry')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                activeTab === 'telemetry'
                  ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-600/20'
                  : 'bg-zinc-900/80 text-zinc-400 hover:text-white hover:bg-zinc-800/80 border border-zinc-800'
              }`}
            >
              <Activity className="w-4 h-4 text-emerald-400" />
              <span>Live Telemetry Monitor</span>
            </button>

            <button
              onClick={() => setActiveTab('ai-copilot')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                activeTab === 'ai-copilot'
                  ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-600/20'
                  : 'bg-zinc-900/80 text-zinc-400 hover:text-white hover:bg-zinc-800/80 border border-zinc-800'
              }`}
            >
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>Gemini AI Copilot</span>
            </button>

            <button
              onClick={() => setActiveTab('bot-control')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                activeTab === 'bot-control'
                  ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-600/20'
                  : 'bg-zinc-900/80 text-zinc-400 hover:text-white hover:bg-zinc-800/80 border border-zinc-800'
              }`}
            >
              <Cpu className="w-4 h-4 text-cyan-400" />
              <span>Telegram Bot API &amp; CLI</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 py-6">
        {activeTab === 'downloader' && (
          <div className="space-y-6 animate-fadeIn">
            {/* Live Telemetry monitor strip */}
            <TelemetryMonitor isDownloading={isDownloading} activeCount={guestTasks.length} />
            <MediaDownloader user={user} onTaskCreated={handleTaskCreated} />
            <DownloadHistory
              user={user}
              guestTasks={guestTasks}
              onRemoveGuestTask={handleRemoveGuestTask}
              onOpenTrimmer={(task) => setHistoryTrimmerTask(task)}
            />
          </div>
        )}

        {activeTab === 'playlist-batch' && (
          <div className="space-y-6 animate-fadeIn">
            <PlaylistBatchDownloader user={user} onTasksCreated={handleBatchTasksCreated} />
            <DownloadHistory
              user={user}
              guestTasks={guestTasks}
              onRemoveGuestTask={handleRemoveGuestTask}
              onOpenTrimmer={(task) => setHistoryTrimmerTask(task)}
            />
          </div>
        )}

        {activeTab === 'accelerator' && (
          <div className="space-y-6 animate-fadeIn">
            <ParallelStreamAccelerator />
            <DownloadHistory
              user={user}
              guestTasks={guestTasks}
              onRemoveGuestTask={handleRemoveGuestTask}
              onOpenTrimmer={(task) => setHistoryTrimmerTask(task)}
            />
          </div>
        )}

        {activeTab === 'telemetry' && (
          <div className="space-y-6 animate-fadeIn">
            <TelemetryMonitor isDownloading={isDownloading} activeCount={guestTasks.length} />
            <div className="bg-[#090D16] border border-cyan-950/60 rounded-2xl p-6 text-zinc-300">
              <h3 className="text-sm font-bold text-white uppercase font-mono mb-2 flex items-center gap-2">
                <Radio className="w-4 h-4 text-cyan-400" /> Cluster Worker Nodes Status
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs font-mono mt-3">
                <div className="bg-zinc-950/80 p-3 rounded-xl border border-zinc-800">
                  <span className="text-zinc-500 block">Primary Downloader Bot</span>
                  <span className="text-cyan-400 font-bold">@Downloader_GodBot</span>
                  <span className="text-emerald-400 text-[10px] block mt-1">Status: Active (TGCloud)</span>
                </div>
                <div className="bg-zinc-950/80 p-3 rounded-xl border border-zinc-800">
                  <span className="text-zinc-500 block">Hardware Muxer</span>
                  <span className="text-white font-bold">FFmpeg 6.1 Transcoder</span>
                  <span className="text-cyan-400 text-[10px] block mt-1">AV1/VP9 4K Muxing</span>
                </div>
                <div className="bg-zinc-950/80 p-3 rounded-xl border border-zinc-800">
                  <span className="text-zinc-500 block">Stream Packet Buffer</span>
                  <span className="text-white font-bold">Ring Buffer (64 MB)</span>
                  <span className="text-emerald-400 text-[10px] block mt-1">Zero Jitter Drop</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'ai-copilot' && (
          <div className="space-y-6 animate-fadeIn">
            <GeminiChatbot />
          </div>
        )}

        {activeTab === 'bot-control' && (
          <div className="space-y-6 animate-fadeIn">
            <BotControlPanel
              botInfo={botInfo}
              botLoading={botLoading}
              onRefresh={fetchBotStatus}
            />
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-800/80 bg-zinc-950 px-4 sm:px-6 py-4 mt-auto">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-zinc-500">
          <div className="flex items-center gap-2">
            <Bot className="w-4 h-4 text-sky-400" />
            <span>Downloader_GodBot Control Center</span>
            <span>•</span>
            <span className="font-mono text-zinc-400">TGCloud CLI</span>
          </div>

          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1 text-emerald-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
              Telegram Bot Online
            </span>
            <span>•</span>
            <span className="flex items-center gap-1 text-sky-400">
              <Globe className="w-3 h-3" />
              Search Grounding Ready
            </span>
          </div>
        </div>
      </footer>

      {/* Settings Modal */}
      <BotSettingsModal
        user={user}
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
      />

      {/* Smart Media Trimmer & Preview Modal for History items */}
      {historyTrimmerTask && (
        <SmartMediaTrimmerModal
          isOpen={!!historyTrimmerTask}
          onClose={() => setHistoryTrimmerTask(null)}
          mediaUrl={historyTrimmerTask.url}
          mediaTitle={historyTrimmerTask.title}
          defaultFormat={historyTrimmerTask.format}
          onExportTrimmed={(trimmed) => {
            handleTaskCreated({
              id: 'trim_' + Date.now().toString(36),
              userId: user?.uid || 'guest_user',
              url: trimmed.url,
              platform: historyTrimmerTask.platform,
              format: trimmed.format,
              status: 'downloading',
              title: trimmed.title,
              fileSize: `${(trimmed.trimRange.duration * 1.8).toFixed(1)} MB`,
              muxingStatus: 'muxed',
              trimRange: trimmed.trimRange,
              parallelWorkers: trimmed.parallelWorkers,
              chunkCacheHit: true,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            });
            setHistoryTrimmerTask(null);
          }}
        />
      )}
    </div>
  );
}
