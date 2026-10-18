import React, { useState } from 'react';
import { User } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { DownloadTask, PlaylistItem } from '../types';
import {
  ListMusic,
  CheckSquare,
  Square,
  Film,
  Music,
  Download,
  Sparkles,
  Layers,
  Copy,
  Check,
  Zap,
  Terminal,
  ExternalLink,
  Sliders,
  CheckCircle2,
  FolderDown,
  RefreshCw
} from 'lucide-react';

interface PlaylistBatchDownloaderProps {
  user: User | null;
  onTasksCreated: (tasks: DownloadTask[]) => void;
}

export const PlaylistBatchDownloader: React.FC<PlaylistBatchDownloaderProps> = ({
  user,
  onTasksCreated,
}) => {
  const [playlistUrl, setPlaylistUrl] = useState('');
  const [multiLinksInput, setMultiLinksInput] = useState('');
  const [batchMode, setBatchMode] = useState<'playlist' | 'multilink'>('playlist');
  const [isParsing, setIsParsing] = useState(false);
  const [copiedFfmpeg, setCopiedFfmpeg] = useState(false);
  const [batchQueuedCount, setBatchQueuedCount] = useState<number | null>(null);

  // Default global batch format
  const [batchFormat, setBatchFormat] = useState<DownloadTask['format']>('video_4k');

  // Parsed items list
  const [items, setItems] = useState<PlaylistItem[]>([
    {
      id: 'item_1',
      title: '01. Interstellar Space Odyssey — 4K HDR Remaster',
      duration: '14:20',
      selected: true,
      format: 'video_4k',
      estimatedSize: '1.42 GB',
      originalUrl: 'https://youtube.com/watch?v=interstellar4k_demo1',
      is4KCapable: true,
    },
    {
      id: 'item_2',
      title: '02. Cyberpunk Synthwave Soundtrack — Lossless Audio',
      duration: '06:45',
      selected: true,
      format: 'audio_mp3',
      estimatedSize: '18.4 MB',
      originalUrl: 'https://soundcloud.com/synthwave/cyberpunk-vol2',
      is4KCapable: false,
    },
    {
      id: 'item_3',
      title: '03. Tokyo Neon Rain City Walk — 2160p 60fps Cinema',
      duration: '32:10',
      selected: true,
      format: 'video_4k',
      estimatedSize: '3.18 GB',
      originalUrl: 'https://youtube.com/watch?v=tokyo_4k_hdr',
      is4KCapable: true,
    },
    {
      id: 'item_4',
      title: '04. Cinematic Drone Reel Over Alps — 4K 60fps',
      duration: '08:15',
      selected: true,
      format: 'video_4k',
      estimatedSize: '980 MB',
      originalUrl: 'https://vimeo.com/drone-alps-4k',
      is4KCapable: true,
    },
  ]);

  // Sample playlist presets
  const samplePresets = [
    { label: 'YouTube 4K Cinema Playlist', url: 'https://youtube.com/playlist?list=PL_4K_HDR_Showcase' },
    { label: 'Electronic Music Album (Lossless MP3)', url: 'https://soundcloud.com/artist/sets/electronic-odyssey' },
    { label: 'Shorts & Reels Batch', url: 'https://instagram.com/creator/reels_series' },
  ];

  // Toggle selection for an item
  const toggleSelect = (id: string) => {
    setItems((prev) =>
      prev.map((it) => (it.id === id ? { ...it, selected: !it.selected } : it))
    );
  };

  // Select all or deselect all
  const selectAll = (val: boolean) => {
    setItems((prev) => prev.map((it) => ({ ...it, selected: val })));
  };

  // Change format for a single item
  const setItemFormat = (id: string, fmt: DownloadTask['format']) => {
    setItems((prev) =>
      prev.map((it) => (it.id === id ? { ...it, format: fmt } : it))
    );
  };

  // Apply batch format to all selected items
  const applyBatchFormat = (fmt: DownloadTask['format']) => {
    setBatchFormat(fmt);
    setItems((prev) =>
      prev.map((it) => (it.selected ? { ...it, format: fmt } : it))
    );
  };

  // Parse playlist URL or multi-line links
  const handleParse = (e: React.FormEvent) => {
    e.preventDefault();
    setIsParsing(true);

    setTimeout(() => {
      if (batchMode === 'multilink' && multiLinksInput.trim()) {
        const rawUrls = multiLinksInput.split('\n').map((u) => u.trim()).filter(Boolean);
        const newItems: PlaylistItem[] = rawUrls.map((rawUrl, idx) => {
          const isAudio = rawUrl.includes('sound') || rawUrl.includes('spotify') || rawUrl.endsWith('.mp3');
          const titleName = rawUrl.split('/').filter(Boolean).pop()?.slice(0, 36) || `Stream Item #${idx + 1}`;
          return {
            id: 'item_batch_' + Date.now() + '_' + idx,
            title: `${idx + 1}. ${titleName}`,
            duration: '04:30',
            selected: true,
            format: isAudio ? 'audio_mp3' : batchFormat,
            estimatedSize: isAudio ? '12 MB' : '850 MB',
            originalUrl: rawUrl,
            is4KCapable: !isAudio,
          };
        });
        setItems(newItems);
      } else {
        // Simulated parsed playlist items
        const baseName = playlistUrl ? playlistUrl.split('/').pop()?.slice(0, 24) : 'Universal Playlist';
        setItems([
          {
            id: 'p_1_' + Date.now(),
            title: `01. ${baseName} — Part I (4K UHD Master)`,
            duration: '18:40',
            selected: true,
            format: batchFormat,
            estimatedSize: batchFormat === 'video_4k' ? '1.82 GB' : '450 MB',
            originalUrl: playlistUrl || 'https://youtube.com/watch?v=sample1',
            is4KCapable: true,
          },
          {
            id: 'p_2_' + Date.now(),
            title: `02. ${baseName} — Part II (High-FPS Action)`,
            duration: '12:15',
            selected: true,
            format: batchFormat,
            estimatedSize: batchFormat === 'video_4k' ? '1.24 GB' : '310 MB',
            originalUrl: playlistUrl || 'https://youtube.com/watch?v=sample2',
            is4KCapable: true,
          },
          {
            id: 'p_3_' + Date.now(),
            title: `03. ${baseName} — Part III (Soundtrack & Ending)`,
            duration: '07:50',
            selected: true,
            format: 'audio_mp3',
            estimatedSize: '22 MB',
            originalUrl: playlistUrl || 'https://youtube.com/watch?v=sample3',
            is4KCapable: false,
          },
        ]);
      }
      setIsParsing(false);
    }, 700);
  };

  // Queue all selected items into Firestore / app state
  const handleQueueAll = async () => {
    const selectedItems = items.filter((it) => it.selected);
    if (selectedItems.length === 0) return;

    const batchId = 'batch_' + Date.now().toString(36);
    const nowIso = new Date().toISOString();

    const createdTasks: DownloadTask[] = selectedItems.map((item, idx) => ({
      id: 'task_' + Date.now().toString(36) + '_' + idx,
      userId: user?.uid || 'guest_user',
      url: item.originalUrl,
      platform: 'youtube',
      format: item.format,
      status: 'queued',
      title: item.title,
      fileSize: item.estimatedSize,
      muxingStatus: item.format === 'video_4k' || item.format === 'video_2k' ? 'muxing' : 'direct',
      batchId,
      playlistName: 'Batch Collection',
      createdAt: nowIso,
      updatedAt: nowIso,
    }));

    // If user is authenticated, write batch tasks to Firestore
    if (user) {
      for (const t of createdTasks) {
        const docPath = `users/${user.uid}/downloads/${t.id}`;
        try {
          await setDoc(doc(db, 'users', user.uid, 'downloads', t.id), t);
        } catch (err) {
          handleFirestoreError(err, OperationType.CREATE, docPath);
        }
      }
    }

    onTasksCreated(createdTasks);
    setBatchQueuedCount(createdTasks.length);
    setTimeout(() => setBatchQueuedCount(null), 3500);
  };

  const selectedCount = items.filter((it) => it.selected).length;

  const sampleFfmpegCommand =
    'ffmpeg -i "stream_video_2160p_av1.mp4" -i "stream_audio_320k.m4a" -c:v copy -c:a aac -b:a 320k -movflags +faststart "output_4K_muxed.mp4"';

  const copyFfmpegCmd = () => {
    navigator.clipboard.writeText(sampleFfmpegCommand);
    setCopiedFfmpeg(true);
    setTimeout(() => setCopiedFfmpeg(false), 2000);
  };

  return (
    <div className="bg-[#090D16] border border-zinc-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
      {/* Glow background accent */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 pb-4 border-b border-zinc-800/80">
        <div>
          <div className="flex items-center gap-2">
            <ListMusic className="w-5 h-5 text-cyan-400" />
            <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
              Universal Playlist &amp; Batch 4K Downloader
            </h2>
            <span className="text-[10px] uppercase font-mono font-bold px-2 py-0.5 rounded bg-cyan-950/80 text-cyan-400 border border-cyan-800/50">
              Multi-Stream
            </span>
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            Download full movie series, entire YouTube playlists, SoundCloud sets, or multiple URLs with 4K video &amp; audio track muxing.
          </p>
        </div>

        {/* Tab switcher: Playlist URL vs Multi-link */}
        <div className="flex items-center gap-1 p-1 bg-zinc-950 border border-zinc-800 rounded-xl text-xs font-medium self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setBatchMode('playlist')}
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              batchMode === 'playlist'
                ? 'bg-cyan-600 text-white font-semibold shadow-sm'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            Playlist Link
          </button>
          <button
            type="button"
            onClick={() => setBatchMode('multilink')}
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              batchMode === 'multilink'
                ? 'bg-cyan-600 text-white font-semibold shadow-sm'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            Multi-Link Batch
          </button>
        </div>
      </div>

      {/* Ingestion Input Form */}
      <form onSubmit={handleParse} className="space-y-3 mb-5">
        {batchMode === 'playlist' ? (
          <div>
            <div className="flex items-center justify-between text-xs text-zinc-400 mb-1.5">
              <span>Enter Playlist, Album, or Series URL:</span>
              <div className="flex items-center gap-2">
                {samplePresets.map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setPlaylistUrl(preset.url)}
                    className="text-[11px] text-zinc-500 hover:text-cyan-400 transition-colors"
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex gap-2">
              <input
                type="url"
                required
                placeholder="https://youtube.com/playlist?list=... or soundcloud.com/sets/..."
                value={playlistUrl}
                onChange={(e) => setPlaylistUrl(e.target.value)}
                className="flex-1 bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-cyan-500"
              />
              <button
                type="submit"
                disabled={isParsing || !playlistUrl.trim()}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold shadow-lg shadow-cyan-600/20 transition-all disabled:opacity-50"
              >
                {isParsing ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Layers className="w-3.5 h-3.5" />}
                <span>{isParsing ? 'Parsing...' : 'Inspect Playlist'}</span>
              </button>
            </div>
          </div>
        ) : (
          <div>
            <label className="block text-xs text-zinc-400 mb-1.5">
              Paste multiple video/audio URLs (one per line):
            </label>
            <textarea
              rows={3}
              placeholder="https://youtube.com/watch?v=...\nhttps://instagram.com/reel/...\nhttps://tiktok.com/@user/video/..."
              value={multiLinksInput}
              onChange={(e) => setMultiLinksInput(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-cyan-500 font-mono"
            />
            <div className="flex justify-end mt-2">
              <button
                type="submit"
                disabled={isParsing || !multiLinksInput.trim()}
                className="flex items-center gap-2 px-5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold shadow-lg shadow-cyan-600/20 transition-all disabled:opacity-50"
              >
                {isParsing ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Layers className="w-3.5 h-3.5" />}
                <span>{isParsing ? 'Parsing Batch...' : 'Parse Multi-Links'}</span>
              </button>
            </div>
          </div>
        )}
      </form>

      {/* 4K Audio Track Muxing Pipeline Explanation Banner */}
      <div className="bg-zinc-950/90 border border-cyan-900/50 rounded-xl p-3.5 mb-5 text-xs text-zinc-300">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-cyan-400" />
            <span className="font-semibold text-white">
              4K Ultra-HD Video + Audio Track Muxing Engine Active
            </span>
          </div>
          <button
            type="button"
            onClick={copyFfmpegCmd}
            className="text-[11px] text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-mono self-start sm:self-auto"
          >
            {copiedFfmpeg ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
            <span>{copiedFfmpeg ? 'Copied FFmpeg Command' : 'Copy Muxing FFmpeg Command'}</span>
          </button>
        </div>
        <p className="text-[11px] text-zinc-400 leading-relaxed">
          Modern platforms split 4K (2160p) streams into separate video-only &amp; audio-only streams. Downloader_GodBot automatically downloads both streams and muxes them into a single high-bitrate MP4 container using hardware-accelerated transcoding.
        </p>
      </div>

      {/* Bulk Controls Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-zinc-950/60 border border-zinc-800 rounded-xl mb-4">
        {/* Selection toggles */}
        <div className="flex items-center gap-3 text-xs">
          <button
            type="button"
            onClick={() => selectAll(true)}
            className="flex items-center gap-1.5 text-zinc-300 hover:text-white"
          >
            <CheckSquare className="w-3.5 h-3.5 text-cyan-400" />
            <span>Select All ({items.length})</span>
          </button>
          <span className="text-zinc-700">|</span>
          <button
            type="button"
            onClick={() => selectAll(false)}
            className="flex items-center gap-1.5 text-zinc-400 hover:text-zinc-200"
          >
            <Square className="w-3.5 h-3.5 text-zinc-500" />
            <span>Deselect All</span>
          </button>
        </div>

        {/* Global Batch Format Selector */}
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-zinc-400 font-medium">Batch Quality:</span>
          {(['video_4k', 'video_1080p', 'audio_mp3'] as const).map((fmt) => (
            <button
              key={fmt}
              type="button"
              onClick={() => applyBatchFormat(fmt)}
              className={`text-[11px] px-2.5 py-1 rounded-lg font-mono font-semibold uppercase border transition-all ${
                batchFormat === fmt
                  ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/60 shadow-sm'
                  : 'bg-zinc-900 text-zinc-400 hover:text-zinc-200 border-zinc-800'
              }`}
            >
              {fmt === 'video_4k' ? '4K UHD' : fmt === 'video_1080p' ? '1080p' : 'MP3 Audio'}
            </button>
          ))}
        </div>
      </div>

      {/* Playlist Items List */}
      <div className="space-y-2 mb-5 max-h-72 overflow-y-auto pr-1">
        {items.map((item) => (
          <div
            key={item.id}
            className={`p-3 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
              item.selected
                ? 'bg-zinc-950/80 border-cyan-900/60 shadow-sm'
                : 'bg-zinc-950/40 border-zinc-800/60 opacity-60'
            }`}
          >
            <div className="flex items-start gap-3 min-w-0">
              <button
                type="button"
                onClick={() => toggleSelect(item.id)}
                className="mt-0.5 text-zinc-400 hover:text-white flex-shrink-0"
              >
                {item.selected ? (
                  <CheckSquare className="w-4 h-4 text-cyan-400" />
                ) : (
                  <Square className="w-4 h-4 text-zinc-600" />
                )}
              </button>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-semibold text-white truncate max-w-xs sm:max-w-md">
                    {item.title}
                  </span>
                  {item.is4KCapable && (
                    <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-300 border border-amber-500/30">
                      4K UHD 60fps
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-3 text-[11px] text-zinc-500 mt-1 font-mono">
                  <span>Duration: {item.duration}</span>
                  <span>• Est. Size: {item.estimatedSize}</span>
                  <a
                    href={item.originalUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-cyan-400 flex items-center gap-0.5"
                  >
                    <span>Source</span>
                    <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                </div>
              </div>
            </div>

            {/* Item-level format selector */}
            <div className="flex items-center gap-2 self-end sm:self-auto">
              <select
                value={item.format}
                onChange={(e) => setItemFormat(item.id, e.target.value as DownloadTask['format'])}
                className="bg-zinc-900 border border-zinc-800 rounded-lg px-2 py-1 text-xs text-zinc-300 focus:outline-none focus:border-cyan-500 font-mono"
              >
                <option value="video_4k">4K UHD (2160p Muxed)</option>
                <option value="video_2k">2K QHD (1440p Muxed)</option>
                <option value="video_1080p">1080p Full HD</option>
                <option value="video_720p">720p HD</option>
                <option value="audio_mp3">320kbps MP3 Audio</option>
              </select>
            </div>
          </div>
        ))}
      </div>

      {/* Batch Execution Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-zinc-800/80">
        <div className="text-xs text-zinc-400">
          <span className="font-semibold text-white">{selectedCount}</span> of {items.length} items selected for download.
        </div>

        <button
          type="button"
          onClick={handleQueueAll}
          disabled={selectedCount === 0}
          className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-xs sm:text-sm shadow-lg shadow-cyan-500/25 transition-all disabled:opacity-50"
        >
          {batchQueuedCount !== null ? (
            <>
              <CheckCircle2 className="w-4 h-4 text-emerald-300" />
              <span>Queued {batchQueuedCount} Tasks to Vault!</span>
            </>
          ) : (
            <>
              <FolderDown className="w-4 h-4" />
              <span>Queue {selectedCount} Selected to Vault</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
