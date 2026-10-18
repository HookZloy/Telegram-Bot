import React, { useState, useRef, useEffect } from 'react';
import {
  HardDrive,
  Database,
  Trash2,
  Check,
  ChevronDown,
  Info,
  Sparkles,
  Server,
  Film,
  Music,
  FileBox,
  AlertTriangle
} from 'lucide-react';

interface StorageUsageIndicatorProps {
  customUsedMB?: number;
  totalQuotaGB?: number;
}

export const StorageUsageIndicator: React.FC<StorageUsageIndicatorProps> = ({
  customUsedMB,
  totalQuotaGB = 20,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [purged, setPurged] = useState(false);
  const [isPurging, setIsPurging] = useState(false);
  const [baseUsedMB, setBaseUsedMB] = useState(4820); // 4.82 GB base usage
  const dropdownRef = useRef<HTMLDivElement>(null);

  const totalQuotaMB = totalQuotaGB * 1024;
  const currentUsedMB = (customUsedMB !== undefined ? customUsedMB : baseUsedMB);
  const percentage = Math.min(100, Math.round((currentUsedMB / totalQuotaMB) * 100));

  // Determine color theme based on percentage
  const getStatusColor = () => {
    if (percentage > 85) return { bar: 'bg-red-500', text: 'text-red-400', badge: 'bg-red-500/10 text-red-400 border-red-500/30' };
    if (percentage > 70) return { bar: 'bg-amber-500', text: 'text-amber-400', badge: 'bg-amber-500/10 text-amber-400 border-amber-500/30' };
    return { bar: 'bg-sky-500', text: 'text-sky-400', badge: 'bg-sky-500/10 text-sky-400 border-sky-500/30' };
  };

  const statusColor = getStatusColor();

  // Close popover on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handlePurgeCache = () => {
    setIsPurging(true);
    setTimeout(() => {
      setBaseUsedMB((prev) => Math.max(1240, prev - 2400)); // Clears ~2.4GB temp cache
      setIsPurging(false);
      setPurged(true);
      setTimeout(() => setPurged(false), 3000);
    }, 600);
  };

  const usedGB = (currentUsedMB / 1024).toFixed(2);
  const freeGB = ((totalQuotaMB - currentUsedMB) / 1024).toFixed(2);

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Header Pill Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 bg-zinc-900/90 hover:bg-zinc-850 border border-zinc-800 hover:border-zinc-700/80 rounded-xl px-2.5 py-1.5 text-xs transition-all shadow-sm group"
        title="View Telegram Bot Cloud Storage Usage"
      >
        <div className="w-5 h-5 rounded-md bg-zinc-800 flex items-center justify-center text-zinc-300 group-hover:text-sky-400 transition-colors">
          <HardDrive className="w-3.5 h-3.5" />
        </div>

        <div className="flex flex-col text-left">
          <div className="flex items-center gap-1.5 leading-none">
            <span className="text-[10px] uppercase font-semibold text-zinc-400 tracking-wider">
              Storage
            </span>
            <span className="font-mono text-xs font-bold text-zinc-200">
              {usedGB} <span className="text-zinc-500 font-normal">/ {totalQuotaGB} GB</span>
            </span>
          </div>

          {/* Mini progress gauge */}
          <div className="w-24 bg-zinc-800 rounded-full h-1.5 mt-1 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${statusColor.bar}`}
              style={{ width: `${percentage}%` }}
            />
          </div>
        </div>

        <ChevronDown
          className={`w-3.5 h-3.5 text-zinc-500 group-hover:text-zinc-300 transition-transform ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {/* Floating Detailed Breakdown Popover */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-88 bg-zinc-950 border border-zinc-800 rounded-2xl p-4 shadow-2xl z-50 animate-fadeIn text-zinc-200">
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-zinc-800/80 mb-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-sky-500/10 text-sky-400 flex items-center justify-center">
                <Database className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white">Bot Cloud Storage Quota</h4>
                <p className="text-[10px] text-zinc-400">TGCloud Bot App Node #8701498346</p>
              </div>
            </div>
            <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${statusColor.badge}`}>
              {percentage}% Used
            </span>
          </div>

          {/* Visual Main Meter */}
          <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-xl p-3 mb-3">
            <div className="flex justify-between items-baseline mb-2">
              <span className="text-xs text-zinc-400">Used Storage</span>
              <span className="font-mono text-sm font-bold text-white">
                {usedGB} GB <span className="text-zinc-500 text-xs font-normal">of {totalQuotaGB} GB</span>
              </span>
            </div>

            {/* Segmented Progress Bar */}
            <div className="w-full bg-zinc-950 rounded-full h-2.5 overflow-hidden flex p-0.5 border border-zinc-800">
              <div
                className="bg-sky-500 h-full rounded-l-full transition-all duration-500"
                style={{ width: `${Math.round(percentage * 0.7)}%` }}
                title="Video Transcodes"
              />
              <div
                className="bg-emerald-500 h-full transition-all duration-500"
                style={{ width: `${Math.round(percentage * 0.22)}%` }}
                title="Audio Extractions"
              />
              <div
                className="bg-purple-500 h-full rounded-r-full transition-all duration-500"
                style={{ width: `${Math.round(percentage * 0.08)}%` }}
                title="Thumbnails & Cache"
              />
            </div>

            <div className="flex justify-between text-[10px] text-zinc-500 mt-2 font-mono">
              <span>0 GB</span>
              <span className="text-emerald-400 font-medium">{freeGB} GB Available</span>
              <span>{totalQuotaGB} GB</span>
            </div>
          </div>

          {/* Category Breakdown */}
          <div className="space-y-2 mb-3 text-xs">
            <div className="flex items-center justify-between text-zinc-300">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-sky-500"></span>
                <Film className="w-3.5 h-3.5 text-sky-400" />
                <span className="text-zinc-300">1080p / 720p Video Files</span>
              </div>
              <span className="font-mono text-zinc-400">{(Number(usedGB) * 0.7).toFixed(2)} GB</span>
            </div>

            <div className="flex items-center justify-between text-zinc-300">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                <Music className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-zinc-300">MP3 Audio Extractions</span>
              </div>
              <span className="font-mono text-zinc-400">{(Number(usedGB) * 0.22).toFixed(2)} GB</span>
            </div>

            <div className="flex items-center justify-between text-zinc-300">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-purple-500"></span>
                <FileBox className="w-3.5 h-3.5 text-purple-400" />
                <span className="text-zinc-300">Cached Thumbnails &amp; Logs</span>
              </div>
              <span className="font-mono text-zinc-400">{(Number(usedGB) * 0.08).toFixed(2)} GB</span>
            </div>
          </div>

          {/* Quick Purge Action */}
          <div className="pt-2 border-t border-zinc-800/80 flex items-center justify-between">
            <div className="text-[10px] text-zinc-500 flex items-center gap-1">
              <Server className="w-3 h-3 text-zinc-400" /> Auto-recycles temp files &gt; 24h
            </div>

            <button
              type="button"
              onClick={handlePurgeCache}
              disabled={isPurging || currentUsedMB <= 1300}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-800 text-[11px] font-medium transition-colors disabled:opacity-40"
            >
              {purged ? (
                <>
                  <Check className="w-3 h-3 text-emerald-400" />
                  <span className="text-emerald-400">Purged!</span>
                </>
              ) : isPurging ? (
                <span>Cleaning...</span>
              ) : (
                <>
                  <Trash2 className="w-3 h-3 text-amber-400" />
                  <span>Purge Cache</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
