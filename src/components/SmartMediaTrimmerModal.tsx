import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  X,
  Play,
  Pause,
  RotateCcw,
  Scissors,
  Download,
  Volume2,
  VolumeX,
  FastForward,
  Maximize2,
  Minimize2,
  Sliders,
  Check,
  Sparkles,
  Layers,
  Clock,
  Music,
  Video
} from 'lucide-react';
import { DownloadTask, TrimRange } from '../types';

interface SmartMediaTrimmerModalProps {
  isOpen: boolean;
  onClose: () => void;
  mediaUrl: string;
  mediaTitle?: string;
  defaultFormat?: DownloadTask['format'];
  onExportTrimmed: (trimmedTask: {
    url: string;
    title: string;
    format: DownloadTask['format'];
    trimRange: TrimRange;
    parallelWorkers: number;
  }) => void;
}

// Format seconds into mm:ss.ms
function formatTimecode(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return '00:00.00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  const millis = Math.floor((seconds % 1) * 100);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${millis.toString().padStart(2, '0')}`;
}

export const SmartMediaTrimmerModal: React.FC<SmartMediaTrimmerModalProps> = ({
  isOpen,
  onClose,
  mediaUrl,
  mediaTitle = 'Cyberpunk 4K Stream Extraction',
  defaultFormat = 'video_1080p',
  onExportTrimmed
}) => {
  const [duration, setDuration] = useState<number>(180); // Default 3 mins if meta loads
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isLooping, setIsLooping] = useState<boolean>(true);
  const [volume, setVolume] = useState<number>(0.8);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [playbackRate, setPlaybackRate] = useState<number>(1);
  const [selectedFormat, setSelectedFormat] = useState<DownloadTask['format']>(defaultFormat);
  const [parallelWorkers, setParallelWorkers] = useState<number>(8);

  // Trim range state
  const [startTime, setStartTime] = useState<number>(15);
  const [endTime, setEndTime] = useState<number>(75);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const waveformCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const [waveformBars, setWaveformBars] = useState<number[]>([]);

  // Generate synthetic high-density audio waveform bars on mount
  useEffect(() => {
    const barsCount = 120;
    const bars: number[] = [];
    for (let i = 0; i < barsCount; i++) {
      // Create organic audio amplitude curves with peaks
      const base = Math.sin(i / 8) * 0.3 + Math.cos(i / 4) * 0.25;
      const noise = (Math.sin(i * 1.7) * 0.2 + Math.cos(i * 3.1) * 0.15);
      const val = Math.min(1, Math.max(0.12, Math.abs(base + noise + 0.4)));
      bars.push(val);
    }
    setWaveformBars(bars);
  }, [mediaUrl]);

  // Sync video time updates
  const handleTimeUpdate = () => {
    if (videoRef.current) {
      const cur = videoRef.current.currentTime;
      setCurrentTime(cur);

      // Enforce loop boundary if looping is on
      if (isLooping && cur >= endTime) {
        videoRef.current.currentTime = startTime;
        videoRef.current.play();
      }
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current && videoRef.current.duration) {
      const vidDur = Math.floor(videoRef.current.duration);
      if (vidDur > 0) {
        setDuration(vidDur);
        setStartTime(0);
        setEndTime(Math.min(vidDur, 60)); // Default first 60s
      }
    }
  };

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      if (currentTime < startTime || currentTime >= endTime) {
        videoRef.current.currentTime = startTime;
      }
      videoRef.current.play().catch(() => {});
      setIsPlaying(true);
    }
  };

  // Draw audio waveform on canvas
  const drawWaveform = useCallback(() => {
    const canvas = waveformCanvasRef.current;
    if (!canvas || waveformBars.length === 0) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    ctx.clearRect(0, 0, width, height);

    const barWidth = width / waveformBars.length;
    const startX = (startTime / duration) * width;
    const endX = (endTime / duration) * width;
    const cursorX = (currentTime / duration) * width;

    // Background track line
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, height / 2);
    ctx.lineTo(width, height / 2);
    ctx.stroke();

    // Draw active trim highlight region
    ctx.fillStyle = 'rgba(6, 182, 212, 0.12)';
    ctx.fillRect(startX, 0, Math.max(2, endX - startX), height);

    // Draw waveform bars
    waveformBars.forEach((amplitude, index) => {
      const x = index * barWidth;
      const barHeight = amplitude * (height * 0.85);
      const y = (height - barHeight) / 2;

      const isInsideTrim = x >= startX && x <= endX;
      const isPastCursor = x <= cursorX;

      if (isInsideTrim) {
        if (isPastCursor) {
          ctx.fillStyle = '#10b981'; // Signal Emerald for played
        } else {
          ctx.fillStyle = '#06b6d4'; // Electric Cyan for trimmed window
        }
      } else {
        ctx.fillStyle = '#334155'; // Inactive muted slate
      }

      ctx.beginPath();
      ctx.roundRect(x + 1, y, Math.max(1.5, barWidth - 1.5), barHeight, 1.5);
      ctx.fill();
    });

    // Draw Start Handle boundary line
    ctx.strokeStyle = '#00E5FF';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(startX, 0);
    ctx.lineTo(startX, height);
    ctx.stroke();

    // Draw End Handle boundary line
    ctx.strokeStyle = '#00E5FF';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(endX, 0);
    ctx.lineTo(endX, height);
    ctx.stroke();

    // Draw Playhead cursor
    ctx.strokeStyle = '#10B981';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(cursorX, 0);
    ctx.lineTo(cursorX, height);
    ctx.stroke();

    // Playhead head marker
    ctx.fillStyle = '#10B981';
    ctx.beginPath();
    ctx.arc(cursorX, 6, 4, 0, Math.PI * 2);
    ctx.fill();
  }, [waveformBars, startTime, endTime, currentTime, duration]);

  useEffect(() => {
    drawWaveform();
  }, [drawWaveform]);

  // Click on waveform to scrub
  const handleWaveformClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = waveformCanvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const ratio = Math.max(0, Math.min(1, clickX / rect.width));
    const targetTime = ratio * duration;

    if (videoRef.current) {
      videoRef.current.currentTime = targetTime;
      setCurrentTime(targetTime);
    }
  };

  // Keyboard shortcut for Play/Pause and Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.code === 'Space' && (e.target as HTMLElement).tagName !== 'INPUT') {
        e.preventDefault();
        togglePlay();
      } else if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isPlaying, startTime, endTime]);

  if (!isOpen) return null;

  const trimmedDuration = Math.max(0.5, endTime - startTime);

  const handleExport = () => {
    onExportTrimmed({
      url: mediaUrl,
      title: `${mediaTitle} [Trimmed ${formatTimecode(startTime)} - ${formatTimecode(endTime)}]`,
      format: selectedFormat,
      trimRange: {
        startTime,
        endTime,
        duration: trimmedDuration,
        isTrimmed: true
      },
      parallelWorkers
    });
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-4xl bg-zinc-950/95 border border-cyan-500/30 rounded-2xl shadow-2xl shadow-cyan-950/40 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Top Bar */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-zinc-800/80 bg-zinc-900/40">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <Scissors className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
                Smart Media Trimmer & 4K Player
              </h2>
              <div className="flex items-center gap-2 text-xs text-zinc-400">
                <span className="truncate max-w-[280px] sm:max-w-md">{mediaTitle}</span>
                <span aria-hidden="true">·</span>
                <span className="font-mono tabular-nums text-cyan-400">
                  {formatTimecode(trimmedDuration)} clip length
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800/80 transition-colors"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Video / Visual Preview Area */}
        <div className="relative bg-black aspect-video max-h-[340px] sm:max-h-[380px] flex items-center justify-center overflow-hidden border-b border-zinc-800/80">
          <video
            ref={videoRef}
            src="https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4"
            className="w-full h-full object-contain"
            onTimeUpdate={handleTimeUpdate}
            onLoadedMetadata={handleLoadedMetadata}
            muted={isMuted}
            playsInline
          />

          {/* HUD Overlay in Corner */}
          <div className="absolute top-3 left-3 flex items-center gap-2 px-2.5 py-1 rounded bg-black/60 backdrop-blur-md border border-cyan-500/20 text-xs font-mono text-cyan-300">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            <span>4K 60FPS STREAM READY</span>
          </div>

          <div className="absolute top-3 right-3 flex items-center gap-2 px-2.5 py-1 rounded bg-black/60 backdrop-blur-md border border-zinc-800 text-xs font-mono text-zinc-300 tabular-nums">
            <span>{formatTimecode(currentTime)}</span>
            <span className="text-zinc-500">/</span>
            <span>{formatTimecode(duration)}</span>
          </div>

          {/* Central Play/Pause Watermark */}
          {!isPlaying && (
            <button
              onClick={togglePlay}
              className="absolute w-16 h-16 rounded-full bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-400/50 backdrop-blur-md flex items-center justify-center text-cyan-300 transition-all transform hover:scale-105 shadow-lg shadow-cyan-500/20"
            >
              <Play className="w-7 h-7 translate-x-0.5" />
            </button>
          )}
        </div>

        {/* Waveform & Precision Scrubber Panel */}
        <div className="p-4 sm:p-5 flex-1 overflow-y-auto space-y-4">
          {/* Waveform Canvas */}
          <div>
            <div className="flex items-center justify-between text-xs text-zinc-400 mb-1.5">
              <span className="flex items-center gap-1.5 text-zinc-300 font-medium">
                <Music className="w-3.5 h-3.5 text-cyan-400" /> Audio Frequency Waveform & In/Out Brackets
              </span>
              <span className="font-mono text-zinc-500">Click anywhere to seek</span>
            </div>

            <div className="relative h-16 sm:h-20 bg-zinc-900/90 rounded-xl border border-zinc-800 p-1 overflow-hidden cursor-pointer group">
              <canvas
                ref={waveformCanvasRef}
                width={800}
                height={80}
                onClick={handleWaveformClick}
                className="w-full h-full block"
              />
            </div>
          </div>

          {/* Dual Handle Draggable Range Controls */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-zinc-900/50 p-3 rounded-xl border border-zinc-800/80">
            {/* Start Time Controller */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-zinc-400">Trim In Point (Start)</span>
                <span className="font-mono font-bold text-cyan-400 tabular-nums">
                  {formatTimecode(startTime)}
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={Math.max(0, endTime - 1)}
                step={0.5}
                value={startTime}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  setStartTime(val);
                  if (videoRef.current) videoRef.current.currentTime = val;
                }}
                className="w-full accent-cyan-400 h-1.5 bg-zinc-800 rounded-lg cursor-pointer"
              />
              <div className="flex items-center gap-1 text-[11px] text-zinc-500">
                <button
                  onClick={() => setStartTime((prev) => Math.max(0, prev - 1))}
                  className="px-2 py-0.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300"
                >
                  -1s
                </button>
                <button
                  onClick={() => setStartTime((prev) => Math.min(endTime - 1, prev + 1))}
                  className="px-2 py-0.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300"
                >
                  +1s
                </button>
                <button
                  onClick={() => {
                    setStartTime(currentTime);
                  }}
                  className="ml-auto px-2 py-0.5 rounded bg-cyan-950/60 text-cyan-400 border border-cyan-500/30"
                >
                  Set to Cursor
                </button>
              </div>
            </div>

            {/* End Time Controller */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-zinc-400">Trim Out Point (End)</span>
                <span className="font-mono font-bold text-cyan-400 tabular-nums">
                  {formatTimecode(endTime)}
                </span>
              </div>
              <input
                type="range"
                min={Math.min(duration, startTime + 1)}
                max={duration}
                step={0.5}
                value={endTime}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  setEndTime(val);
                }}
                className="w-full accent-cyan-400 h-1.5 bg-zinc-800 rounded-lg cursor-pointer"
              />
              <div className="flex items-center gap-1 text-[11px] text-zinc-500">
                <button
                  onClick={() => setEndTime((prev) => Math.max(startTime + 1, prev - 1))}
                  className="px-2 py-0.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300"
                >
                  -1s
                </button>
                <button
                  onClick={() => setEndTime((prev) => Math.min(duration, prev + 1))}
                  className="px-2 py-0.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300"
                >
                  +1s
                </button>
                <button
                  onClick={() => {
                    setEndTime(currentTime);
                  }}
                  className="ml-auto px-2 py-0.5 rounded bg-cyan-950/60 text-cyan-400 border border-cyan-500/30"
                >
                  Set to Cursor
                </button>
              </div>
            </div>
          </div>

          {/* Quick Presets & Playback Controls Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
            {/* Quick Trim Presets */}
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-zinc-500 font-medium mr-1">Presets:</span>
              <button
                onClick={() => {
                  setStartTime(0);
                  setEndTime(duration);
                }}
                className="px-2.5 py-1 text-xs rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800"
              >
                Full
              </button>
              <button
                onClick={() => {
                  setStartTime(0);
                  setEndTime(Math.min(duration, 30));
                }}
                className="px-2.5 py-1 text-xs rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800"
              >
                First 30s
              </button>
              <button
                onClick={() => {
                  setStartTime(0);
                  setEndTime(Math.min(duration, 60));
                }}
                className="px-2.5 py-1 text-xs rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800"
              >
                1m Hook
              </button>
              <button
                onClick={() => {
                  const mid = Math.floor(duration / 2);
                  setStartTime(Math.max(0, mid - 15));
                  setEndTime(Math.min(duration, mid + 15));
                }}
                className="px-2.5 py-1 text-xs rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800"
              >
                Chorus Climax
              </button>
            </div>

            {/* Playback Controls */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsLooping(!isLooping)}
                className={`flex items-center gap-1 px-2.5 py-1 text-xs rounded-lg border transition-colors ${
                  isLooping
                    ? 'bg-cyan-950/80 text-cyan-300 border-cyan-500/40'
                    : 'bg-zinc-900 text-zinc-400 border-zinc-800'
                }`}
                title="Loop playback inside trimmed region"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Loop Segment</span>
              </button>

              <button
                onClick={() => {
                  const rates = [0.5, 1, 1.25, 1.5, 2];
                  const next = rates[(rates.indexOf(playbackRate) + 1) % rates.length];
                  setPlaybackRate(next);
                  if (videoRef.current) videoRef.current.playbackRate = next;
                }}
                className="px-2 py-1 text-xs font-mono rounded-lg bg-zinc-900 text-zinc-300 border border-zinc-800 hover:bg-zinc-800"
                title="Cycle Playback Rate"
              >
                {playbackRate}x
              </button>

              <button
                onClick={() => setIsMuted(!isMuted)}
                className="p-1.5 rounded-lg bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800"
                title="Toggle Mute"
              >
                {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Export Settings Row */}
          <div className="pt-2 border-t border-zinc-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs text-zinc-400">Resolution:</span>
              <button
                onClick={() => setSelectedFormat('video_4k')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all ${
                  selectedFormat === 'video_4k'
                    ? 'bg-cyan-500 text-black border-cyan-400 shadow-sm shadow-cyan-500/30'
                    : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-white'
                }`}
              >
                4K Ultra-HD
              </button>
              <button
                onClick={() => setSelectedFormat('video_1080p')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all ${
                  selectedFormat === 'video_1080p'
                    ? 'bg-cyan-500 text-black border-cyan-400 shadow-sm shadow-cyan-500/30'
                    : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-white'
                }`}
              >
                1080p 60fps
              </button>
              <button
                onClick={() => setSelectedFormat('audio_mp3')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all ${
                  selectedFormat === 'audio_mp3'
                    ? 'bg-cyan-500 text-black border-cyan-400 shadow-sm shadow-cyan-500/30'
                    : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-white'
                }`}
              >
                Audio 320k MP3
              </button>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-zinc-400">Parallel Workers:</span>
              <select
                value={parallelWorkers}
                onChange={(e) => setParallelWorkers(Number(e.target.value))}
                className="bg-zinc-900 text-zinc-200 text-xs px-2.5 py-1.5 rounded-lg border border-zinc-800 focus:outline-none focus:border-cyan-500"
              >
                <option value={4}>4 Streams</option>
                <option value={8}>8 Streams (Turbo)</option>
                <option value={12}>12 Streams (Maximum)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Modal Bottom Actions */}
        <div className="px-5 py-3.5 border-t border-zinc-800/80 bg-zinc-900/60 flex items-center justify-between">
          <div className="text-xs text-zinc-400">
            Selected range:{' '}
            <span className="font-mono text-white font-semibold tabular-nums">
              {formatTimecode(startTime)} → {formatTimecode(endTime)}
            </span>{' '}
            <span className="text-cyan-400">({formatTimecode(trimmedDuration)})</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleExport}
              className="flex items-center gap-2 px-5 py-2 text-xs font-bold text-black bg-gradient-to-r from-cyan-400 to-emerald-400 hover:from-cyan-300 hover:to-emerald-300 rounded-xl shadow-lg shadow-cyan-500/20 transition-all transform hover:scale-[1.02]"
            >
              <Download className="w-4 h-4" />
              <span>Queue Trimmed Download</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
