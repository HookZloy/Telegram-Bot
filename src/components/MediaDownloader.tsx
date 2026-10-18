import React, { useState } from 'react';
import { User } from 'firebase/auth';
import { doc, setDoc, updateDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { DownloadTask } from '../types';
import {
  Download,
  Sparkles,
  Link,
  Film,
  Music,
  Video,
  FileText,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  Search,
  ExternalLink,
  Terminal,
  Zap,
  Loader2,
  Scissors
} from 'lucide-react';
import { SmartMediaTrimmerModal } from './SmartMediaTrimmerModal';

interface MediaDownloaderProps {
  user: User | null;
  onTaskCreated?: (task: DownloadTask) => void;
}

export const MediaDownloader: React.FC<MediaDownloaderProps> = ({ user, onTaskCreated }) => {
  const [url, setUrl] = useState('');
  const [format, setFormat] = useState<DownloadTask['format']>('video_1080p');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isTrimmerOpen, setIsTrimmerOpen] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<{
    analysis: string;
    groundingChunks?: any[];
  } | null>(null);

  // Active download state
  const [activeDownload, setActiveDownload] = useState<{
    id: string;
    progress: number;
    status: 'starting' | 'extracting' | 'transcoding' | 'ready';
    speed: string;
    fileName: string;
    fileSize: string;
  } | null>(null);

  const [copiedCmd, setCopiedCmd] = useState(false);

  // Quick preset links
  const samplePresets = [
    { label: 'YouTube 4K / Music', url: 'https://youtube.com/watch?v=dQw4w9WgXcQ' },
    { label: 'Instagram Reel', url: 'https://instagram.com/reel/C8qL8x2y1Z/' },
    { label: 'TikTok (No Watermark)', url: 'https://www.tiktok.com/@creator/video/738291028' },
    { label: 'Twitter / X Clip', url: 'https://x.com/tech_insider/status/179281739' },
  ];

  // Helper to detect platform
  const detectPlatform = (inputUrl: string): DownloadTask['platform'] => {
    const lower = inputUrl.toLowerCase();
    if (lower.includes('youtube.com') || lower.includes('youtu.be')) return 'youtube';
    if (lower.includes('instagram.com')) return 'instagram';
    if (lower.includes('tiktok.com')) return 'tiktok';
    if (lower.includes('twitter.com') || lower.includes('x.com')) return 'twitter';
    if (lower.includes('facebook.com') || lower.includes('fb.watch')) return 'facebook';
    return 'other';
  };

  // Helper to get platform label & color
  const getPlatformBadge = (platform: DownloadTask['platform']) => {
    switch (platform) {
      case 'youtube':
        return { label: 'YouTube', color: 'bg-red-500/10 text-red-400 border-red-500/20' };
      case 'instagram':
        return { label: 'Instagram', color: 'bg-pink-500/10 text-pink-400 border-pink-500/20' };
      case 'tiktok':
        return { label: 'TikTok', color: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20' };
      case 'twitter':
        return { label: 'Twitter / X', color: 'bg-sky-500/10 text-sky-400 border-sky-500/20' };
      case 'facebook':
        return { label: 'Facebook', color: 'bg-blue-500/10 text-blue-400 border-blue-500/20' };
      default:
        return { label: 'Web Stream', color: 'bg-zinc-700/30 text-zinc-300 border-zinc-700/50' };
    }
  };

  // Deep inspect media using Gemini 3.8 Flash with Google Search Grounding
  const handleInspectWithGemini = async () => {
    if (!url.trim()) return;
    setIsAnalyzing(true);
    setAnalysisResult(null);

    try {
      const res = await fetch('/api/gemini/analyze-media', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url.trim(), format }),
      });
      const data = await res.json();
      if (data.error) {
        throw new Error(data.error);
      }
      setAnalysisResult({
        analysis: data.analysis,
        groundingChunks: data.groundingChunks || [],
      });
    } catch (err: any) {
      setAnalysisResult({
        analysis: `Error during AI link analysis: ${err.message}`,
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Start cloud download & queue task in Firestore
  const handleStartDownload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;

    const platform = detectPlatform(url);
    const taskId = 'task_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 6);
    const nowIso = new Date().toISOString();

    const taskTitle =
      url.split('/').filter(Boolean).pop()?.slice(0, 40) ||
      `${platform.toUpperCase()} Media Extraction`;

    const newTask: DownloadTask = {
      id: taskId,
      userId: user?.uid || 'guest_user',
      url: url.trim(),
      platform,
      format,
      status: 'downloading',
      title: taskTitle,
      fileSize:
        format === 'video_4k'
          ? '1.24 GB'
          : format === 'video_2k'
          ? '680 MB'
          : format === 'audio_mp3'
          ? '9.6 MB'
          : '48.2 MB',
      muxingStatus: format === 'video_4k' || format === 'video_2k' ? 'muxing' : 'direct',
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    // Save to Firestore if authenticated
    if (user) {
      const docPath = `users/${user.uid}/downloads/${taskId}`;
      try {
        await setDoc(doc(db, 'users', user.uid, 'downloads', taskId), newTask);
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, docPath);
      }
    }

    if (onTaskCreated) {
      onTaskCreated(newTask);
    }

    // Launch progress simulation
    setActiveDownload({
      id: taskId,
      progress: 10,
      status: 'starting',
      speed: '12.4 MB/s',
      fileName: `${taskTitle}.${format === 'audio_mp3' ? 'mp3' : 'mp4'}`,
      fileSize: newTask.fileSize || '35 MB',
    });

    // Simulate multi-phase download pipeline
    setTimeout(() => {
      setActiveDownload((prev) => prev && { ...prev, progress: 45, status: 'extracting', speed: '24.1 MB/s' });
    }, 800);

    setTimeout(() => {
      setActiveDownload((prev) => prev && { ...prev, progress: 85, status: 'transcoding', speed: '38.6 MB/s' });
    }, 1800);

    setTimeout(async () => {
      setActiveDownload((prev) => prev && { ...prev, progress: 100, status: 'ready', speed: 'Completed' });
      // Update in Firestore
      if (user) {
        const docPath = `users/${user.uid}/downloads/${taskId}`;
        try {
          await updateDoc(doc(db, 'users', user.uid, 'downloads', taskId), {
            status: 'completed',
            updatedAt: new Date().toISOString(),
          });
        } catch (err) {
          handleFirestoreError(err, OperationType.UPDATE, docPath);
        }
      }
    }, 2800);
  };

  const handleExportTrimmed = async (trimmedData: {
    url: string;
    title: string;
    format: DownloadTask['format'];
    trimRange: any;
    parallelWorkers: number;
  }) => {
    const platform = detectPlatform(trimmedData.url || 'https://youtube.com/watch?v=sample');
    const taskId = 'trim_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 6);
    const nowIso = new Date().toISOString();

    const newTask: DownloadTask = {
      id: taskId,
      userId: user?.uid || 'guest_user',
      url: trimmedData.url || 'https://youtube.com/watch?v=sample',
      platform,
      format: trimmedData.format,
      status: 'downloading',
      title: trimmedData.title,
      fileSize: `${(trimmedData.trimRange.duration * 1.8).toFixed(1)} MB`,
      muxingStatus: 'muxed',
      trimRange: trimmedData.trimRange,
      parallelWorkers: trimmedData.parallelWorkers,
      chunkCacheHit: true,
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    if (user) {
      const docPath = `users/${user.uid}/downloads/${taskId}`;
      try {
        await setDoc(doc(db, 'users', user.uid, 'downloads', taskId), newTask);
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, docPath);
      }
    }

    if (onTaskCreated) {
      onTaskCreated(newTask);
    }

    // Launch progress simulation
    setActiveDownload({
      id: taskId,
      progress: 25,
      status: 'extracting',
      speed: '48.2 MB/s',
      fileName: `${newTask.title}.mp4`,
      fileSize: newTask.fileSize || '25 MB',
    });

    setTimeout(async () => {
      setActiveDownload((prev) => prev && { ...prev, progress: 100, status: 'ready', speed: 'Completed' });
      if (user) {
        const docPath = `users/${user.uid}/downloads/${taskId}`;
        try {
          await updateDoc(doc(db, 'users', user.uid, 'downloads', taskId), {
            status: 'completed',
            updatedAt: new Date().toISOString(),
          });
        } catch (err) {
          handleFirestoreError(err, OperationType.UPDATE, docPath);
        }
      }
    }, 1500);
  };

  const currentPlatform = url ? detectPlatform(url) : 'other';
  const badge = getPlatformBadge(currentPlatform);

  return (
    <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-5">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Download className="w-5 h-5 text-sky-400" />
            Media Link Downloader &amp; Smart Extractor
          </h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            Extract videos, reels, shorts, stories, and audio at original high bitrates.
          </p>
        </div>

        {url && (
          <div className="flex items-center gap-2">
            <span className={`px-2.5 py-1 text-xs font-semibold rounded-lg border ${badge.color}`}>
              {badge.label} Detected
            </span>
          </div>
        )}
      </div>

      {/* Preset suggestions */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <span className="text-[11px] text-zinc-500 font-medium">Quick Presets:</span>
        {samplePresets.map((preset, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => setUrl(preset.url)}
            className="text-[11px] px-2.5 py-1 rounded-md bg-zinc-800/80 hover:bg-zinc-700/80 text-zinc-300 hover:text-white border border-zinc-700/50 transition-colors"
          >
            {preset.label}
          </button>
        ))}
      </div>

      {/* Main Download Form */}
      <form onSubmit={handleStartDownload} className="space-y-4">
        {/* URL Input */}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-500">
            <Link className="w-4 h-4" />
          </div>
          <input
            type="url"
            required
            placeholder="Paste media link (YouTube, Instagram, TikTok, Twitter/X, Reddit...)"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-10 pr-24 py-3 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-all shadow-inner"
          />
          {url && (
            <button
              type="button"
              onClick={() => setUrl('')}
              className="absolute inset-y-0 right-3 flex items-center text-xs text-zinc-500 hover:text-zinc-300 px-2"
            >
              Clear
            </button>
          )}
        </div>

        {/* Quality / Format Selection */}
        <div>
          <div className="flex items-center justify-between text-xs text-zinc-400 mb-2">
            <span className="font-medium text-zinc-300">Select Resolution &amp; Format:</span>
            {(format === 'video_4k' || format === 'video_2k') && (
              <span className="text-[11px] font-mono text-cyan-400 flex items-center gap-1">
                <Zap className="w-3 h-3 text-cyan-400" />
                4K Stream Audio Muxing Enabled
              </span>
            )}
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
            {[
              { id: 'video_4k', label: '4K Ultra HD', icon: Film, desc: '2160p Muxed Audio', badge: 'UHD' },
              { id: 'video_2k', label: '2K Quad HD', icon: Video, desc: '1440p Muxed Audio', badge: 'QHD' },
              { id: 'video_1080p', label: '1080p Full HD', icon: Film, desc: 'High Quality 60fps' },
              { id: 'video_720p', label: '720p HD', icon: Video, desc: 'Standard MP4' },
              { id: 'audio_mp3', label: 'MP3 Audio', icon: Music, desc: '320kbps Lossless' },
              { id: 'gif', label: 'Animated GIF', icon: FileText, desc: 'Looping Preview' },
            ].map((item) => {
              const Icon = item.icon;
              const isSelected = format === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setFormat(item.id as DownloadTask['format'])}
                  className={`p-2.5 rounded-xl border text-left flex flex-col justify-between transition-all ${
                    isSelected
                      ? 'bg-cyan-500/10 border-cyan-500 text-white ring-1 ring-cyan-500/50 shadow-sm'
                      : 'bg-zinc-950/60 border-zinc-800 text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <Icon className={`w-4 h-4 ${isSelected ? 'text-cyan-400' : 'text-zinc-500'}`} />
                    {item.badge && (
                      <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-amber-500/10 text-amber-300 border border-amber-500/30">
                        {item.badge}
                      </span>
                    )}
                  </div>
                  <div>
                    <div className="text-xs font-semibold">{item.label}</div>
                    <div className="text-[10px] text-zinc-500">{item.desc}</div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Action Buttons: AI Deep Inspect vs Trimmer vs Direct Download */}
        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <button
            type="button"
            onClick={handleInspectWithGemini}
            disabled={!url.trim() || isAnalyzing}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-zinc-800 hover:bg-zinc-700/80 text-zinc-200 font-medium text-xs border border-zinc-700 transition-all disabled:opacity-50"
          >
            {isAnalyzing ? (
              <Loader2 className="w-4 h-4 animate-spin text-sky-400" />
            ) : (
              <Sparkles className="w-4 h-4 text-amber-400" />
            )}
            <span>
              {isAnalyzing
                ? 'Inspecting via Gemini Grounding...'
                : 'Inspect Media with Gemini'}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setIsTrimmerOpen(true)}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-cyan-950/80 to-emerald-950/80 hover:from-cyan-900/80 hover:to-emerald-900/80 text-cyan-300 font-semibold text-xs border border-cyan-500/40 shadow-sm transition-all"
          >
            <Scissors className="w-4 h-4 text-cyan-400" />
            <span>Smart Video Trimmer &amp; Preview</span>
          </button>

          <button
            type="submit"
            disabled={!url.trim()}
            className="flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-semibold text-sm shadow-lg shadow-sky-500/25 transition-all disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            <span>Start Cloud Download</span>
          </button>
        </div>
      </form>

      {/* Live Active Download Simulation Card */}
      {activeDownload && (
        <div className="mt-5 bg-zinc-950 border border-sky-500/30 rounded-xl p-4 shadow-inner animate-fadeIn">
          <div className="flex items-center justify-between text-xs mb-2">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-sky-400 animate-ping"></span>
              <span className="font-semibold text-white truncate max-w-[220px]">
                {activeDownload.fileName}
              </span>
            </div>
            <span className="font-mono text-sky-400 font-bold">{activeDownload.progress}%</span>
          </div>

          {/* Progress bar */}
          <div className="w-full bg-zinc-900 rounded-full h-2 overflow-hidden mb-2.5">
            <div
              className="bg-gradient-to-r from-sky-500 to-blue-500 h-full rounded-full transition-all duration-300"
              style={{ width: `${activeDownload.progress}%` }}
            ></div>
          </div>

          <div className="flex items-center justify-between text-[11px] text-zinc-400">
            <span className="flex items-center gap-1">
              <Zap className="w-3 h-3 text-amber-400" /> Speed: {activeDownload.speed}
            </span>
            <span>Size: {activeDownload.fileSize}</span>
            {activeDownload.status === 'ready' ? (
              <span className="text-emerald-400 font-medium flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Ready to Save
              </span>
            ) : (
              <span className="text-sky-400 capitalize">{activeDownload.status}...</span>
            )}
          </div>

          {activeDownload.status === 'ready' && (
            <div className="mt-3 pt-3 border-t border-zinc-800/80 flex items-center justify-between gap-3">
              <div className="text-xs text-zinc-300">
                Processed via <strong>Downloader_GodBot</strong> cloud node.
              </div>
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium flex items-center gap-1.5 transition-colors"
              >
                <Download className="w-3 h-3" /> Save File
              </a>
            </div>
          )}
        </div>
      )}

      {/* Gemini Media Analysis Result with Grounding Sources */}
      {analysisResult && (
        <div className="mt-5 bg-zinc-950/80 border border-zinc-800 rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-200">
                Gemini 3.8 Flash Media Breakdown
              </h3>
            </div>
            <button
              onClick={() => {
                navigator.clipboard.writeText(analysisResult.analysis);
                setCopiedCmd(true);
                setTimeout(() => setCopiedCmd(false), 2000);
              }}
              className="text-[11px] text-zinc-400 hover:text-white flex items-center gap-1"
            >
              {copiedCmd ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              <span>{copiedCmd ? 'Copied' : 'Copy Analysis'}</span>
            </button>
          </div>

          {/* Analysis Markdown/Text */}
          <div className="text-xs text-zinc-300 whitespace-pre-line leading-relaxed font-sans bg-zinc-900/60 p-3 rounded-lg border border-zinc-800/60">
            {analysisResult.analysis}
          </div>

          {/* Grounding chunks / search citations */}
          {analysisResult.groundingChunks && analysisResult.groundingChunks.length > 0 && (
            <div className="mt-3 pt-2.5 border-t border-zinc-800/80">
              <div className="text-[11px] font-semibold text-zinc-400 mb-1.5 flex items-center gap-1">
                <Search className="w-3 h-3 text-sky-400" /> Google Search Grounding Sources:
              </div>
              <div className="flex flex-wrap gap-2">
                {analysisResult.groundingChunks.map((chunk, cIdx) => {
                  const uri = chunk.web?.uri;
                  const title = chunk.web?.title || uri;
                  if (!uri) return null;
                  return (
                    <a
                      key={cIdx}
                      href={uri}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] text-sky-400 hover:text-sky-300 bg-sky-950/40 hover:bg-sky-900/40 border border-sky-800/50 px-2 py-0.5 rounded flex items-center gap-1 transition-colors max-w-xs truncate"
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
      )}

      {/* Smart Media Trimmer & 4K Preview Modal */}
      <SmartMediaTrimmerModal
        isOpen={isTrimmerOpen}
        onClose={() => setIsTrimmerOpen(false)}
        mediaUrl={url || 'https://youtube.com/watch?v=dQw4w9WgXcQ'}
        mediaTitle={url ? url.split('/').filter(Boolean).pop()?.slice(0, 40) : 'Sample 4K Stream'}
        defaultFormat={format}
        onExportTrimmed={handleExportTrimmed}
      />
    </div>
  );
};
