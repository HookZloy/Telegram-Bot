import React, { useState, useEffect } from 'react';
import {
  Zap,
  Cpu,
  Layers,
  Database,
  RefreshCw,
  Sliders,
  CheckCircle2,
  Activity,
  HardDrive,
  Flame,
  ShieldCheck,
  Server
} from 'lucide-react';
import { StreamChunk } from '../types';

export const ParallelStreamAccelerator: React.FC = () => {
  const [workerCount, setWorkerCount] = useState<number>(8);
  const [isAccelerating, setIsAccelerating] = useState<boolean>(true);
  const [cacheHitPercent, setCacheHitPercent] = useState<number>(44);
  const [totalThroughput, setTotalThroughput] = useState<number>(54.8);
  const [singleStreamBaseline, setSingleStreamBaseline] = useState<number>(6.5);
  const [chunks, setChunks] = useState<StreamChunk[]>([]);
  const [chunkCacheSizeMB, setChunkCacheSizeMB] = useState<number>(312.4);

  // Initialize 48 visual chunk blocks
  useEffect(() => {
    const totalBlocks = 48;
    const initialChunks: StreamChunk[] = [];
    for (let i = 0; i < totalBlocks; i++) {
      const isAlreadyCached = i % 4 === 0 || i % 7 === 0;
      initialChunks.push({
        id: i,
        workerId: (i % workerCount) + 1,
        startByte: i * 1048576 * 8,
        endByte: (i + 1) * 1048576 * 8 - 1,
        status: isAlreadyCached ? 'cached' : (i < 16 ? 'downloading' : 'queued'),
        progress: isAlreadyCached ? 100 : (i < 16 ? Math.floor(Math.random() * 80) + 10 : 0),
        speedMBps: isAlreadyCached ? 0 : Number((Math.random() * 5 + 4).toFixed(1))
      });
    }
    setChunks(initialChunks);
  }, [workerCount]);

  // Live simulation tick for active parallel workers
  useEffect(() => {
    if (!isAccelerating) return;

    const interval = setInterval(() => {
      setChunks((prev) => {
        return prev.map((chunk) => {
          if (chunk.status === 'downloading') {
            const nextProgress = chunk.progress + Math.floor(Math.random() * 15) + 5;
            if (nextProgress >= 100) {
              return {
                ...chunk,
                progress: 100,
                status: 'completed',
                speedMBps: 0
              };
            }
            return {
              ...chunk,
              progress: nextProgress,
              speedMBps: Number((Math.random() * 4 + 5.5).toFixed(1))
            };
          } else if (chunk.status === 'queued') {
            // Activate some queued chunks
            if (Math.random() > 0.6) {
              return {
                ...chunk,
                status: 'downloading',
                progress: 10,
                speedMBps: Number((Math.random() * 3 + 4.5).toFixed(1))
              };
            }
          }
          return chunk;
        });
      });

      // Fluctuate total throughput slightly for realistic network jitter
      setTotalThroughput((prev) => {
        const jitter = (Math.random() - 0.48) * 3;
        return Number(Math.max(38, Math.min(84, prev + jitter)).toFixed(1));
      });
    }, 800);

    return () => clearInterval(interval);
  }, [isAccelerating]);

  const accelerationMultiplier = (totalThroughput / singleStreamBaseline).toFixed(1);

  const resetBenchmark = () => {
    setChunks((prev) =>
      prev.map((c, i) => ({
        ...c,
        status: i % 5 === 0 ? 'cached' : 'queued',
        progress: i % 5 === 0 ? 100 : 0,
        speedMBps: 0
      }))
    );
  };

  const completedCount = chunks.filter((c) => c.status === 'completed' || c.status === 'cached').length;
  const progressPercent = Math.round((completedCount / (chunks.length || 1)) * 100);

  return (
    <div className="bg-zinc-950/90 border border-zinc-800/80 rounded-2xl p-5 sm:p-6 shadow-xl space-y-6">
      {/* Top Header Card */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-zinc-800/80">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500/20 to-emerald-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shadow-lg shadow-cyan-500/10">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-white tracking-tight flex items-center gap-2">
              Multi-Stream Parallel Accelerator & Chunk Cache
            </h2>
            <div className="flex items-center gap-2 text-xs text-zinc-400 mt-0.5">
              <span>{workerCount} Concurrent Download Threads</span>
              <span aria-hidden="true">·</span>
              <span className="text-emerald-400 font-mono tabular-nums">{accelerationMultiplier}x Turbo Boost</span>
              <span aria-hidden="true">·</span>
              <span className="font-mono tabular-nums text-zinc-400">{chunkCacheSizeMB.toFixed(1)} MB Cached</span>
            </div>
          </div>
        </div>

        {/* Quick Acceleration Mode Toggle */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsAccelerating(!isAccelerating)}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all ${
              isAccelerating
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                : 'bg-zinc-900 text-zinc-400 border-zinc-800'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>{isAccelerating ? 'Turbo Engine Active' : 'Engine Paused'}</span>
          </button>
          <button
            onClick={resetBenchmark}
            className="p-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-800 transition-colors"
            title="Restart Chunk Cycle"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* KPI Speed Metrics Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-zinc-900/60 p-4 rounded-xl border border-zinc-800/80">
          <div className="text-xs text-zinc-400 font-medium flex items-center justify-between">
            <span>Aggregated Speed</span>
            <Flame className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <div className="text-2xl font-extrabold font-mono text-cyan-400 mt-1 tabular-nums">
            {totalThroughput} <span className="text-xs font-normal text-zinc-500">MB/s</span>
          </div>
          <div className="text-[11px] text-zinc-500 mt-0.5">
            vs {singleStreamBaseline} MB/s standard stream
          </div>
        </div>

        <div className="bg-zinc-900/60 p-4 rounded-xl border border-zinc-800/80">
          <div className="text-xs text-zinc-400 font-medium flex items-center justify-between">
            <span>Acceleration Multiplier</span>
            <Zap className="w-3.5 h-3.5 text-cyan-400" />
          </div>
          <div className="text-2xl font-extrabold font-mono text-emerald-400 mt-1 tabular-nums">
            {accelerationMultiplier}x
          </div>
          <div className="text-[11px] text-zinc-500 mt-0.5">Parallel TCP socket pooling</div>
        </div>

        <div className="bg-zinc-900/60 p-4 rounded-xl border border-zinc-800/80">
          <div className="text-xs text-zinc-400 font-medium flex items-center justify-between">
            <span>Chunk Cache Hit</span>
            <Database className="w-3.5 h-3.5 text-sky-400" />
          </div>
          <div className="text-2xl font-extrabold font-mono text-sky-400 mt-1 tabular-nums">
            {cacheHitPercent}%
          </div>
          <div className="text-[11px] text-zinc-500 mt-0.5">Instant zero-byte replay</div>
        </div>

        <div className="bg-zinc-900/60 p-4 rounded-xl border border-zinc-800/80">
          <div className="text-xs text-zinc-400 font-medium flex items-center justify-between">
            <span>Reassembly Integrity</span>
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="text-2xl font-extrabold font-mono text-white mt-1 tabular-nums">
            {progressPercent}%
          </div>
          <div className="text-[11px] text-zinc-500 mt-0.5">SHA-256 chunk validated</div>
        </div>
      </div>

      {/* Visual Chunk Buffer Matrix */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs text-zinc-400">
          <span className="font-semibold text-zinc-300 flex items-center gap-1.5">
            <Layers className="w-4 h-4 text-cyan-400" /> Real-time Chunk Stream Allocation (48 Segments)
          </span>
          <div className="flex items-center gap-3 text-[11px]">
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded bg-zinc-800 border border-zinc-700" /> Queued
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded bg-cyan-500 animate-pulse" /> Downloading
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded bg-emerald-500" /> Cached / Done
            </span>
          </div>
        </div>

        {/* 48-Block Interactive Matrix */}
        <div className="grid grid-cols-8 sm:grid-cols-12 md:grid-cols-16 gap-1.5 p-3 rounded-xl bg-zinc-900/70 border border-zinc-800">
          {chunks.map((chunk) => {
            let bgClass = 'bg-zinc-800/80 text-zinc-500 border-zinc-700/50';
            if (chunk.status === 'downloading') {
              bgClass = 'bg-cyan-500/20 text-cyan-300 border-cyan-400/60 animate-pulse';
            } else if (chunk.status === 'cached') {
              bgClass = 'bg-sky-500/30 text-sky-300 border-sky-400/50';
            } else if (chunk.status === 'completed') {
              bgClass = 'bg-emerald-500/30 text-emerald-300 border-emerald-400/50';
            }

            return (
              <div
                key={chunk.id}
                className={`h-9 rounded-md border flex flex-col items-center justify-center text-[10px] font-mono cursor-pointer transition-all hover:scale-105 ${bgClass}`}
                title={`Chunk #${chunk.id} · Worker ${chunk.workerId} · Status: ${chunk.status} · ${chunk.progress}%`}
              >
                <span>#{chunk.id}</span>
                <span className="text-[8px] opacity-75">{chunk.progress}%</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Parallel Worker Telemetry Nodes */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs text-zinc-400">
          <span className="font-semibold text-zinc-300 flex items-center gap-1.5">
            <Cpu className="w-4 h-4 text-cyan-400" /> Parallel Worker Thread Pools
          </span>
          <div className="flex items-center gap-2">
            <span>Concurrency Limit:</span>
            <div className="flex items-center gap-1">
              {[4, 8, 12, 16].map((num) => (
                <button
                  key={num}
                  onClick={() => setWorkerCount(num)}
                  className={`px-2 py-0.5 rounded text-xs font-mono transition-colors ${
                    workerCount === num
                      ? 'bg-cyan-500 text-black font-bold'
                      : 'bg-zinc-800 text-zinc-400 hover:text-white'
                  }`}
                >
                  {num}T
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {Array.from({ length: workerCount }).map((_, idx) => {
            const workerId = idx + 1;
            const activeForWorker = chunks.filter((c) => c.workerId === workerId && c.status === 'downloading');
            const isIdle = activeForWorker.length === 0;
            const workerSpeed = isIdle ? 0 : Number((Math.random() * 3 + 4.8).toFixed(1));

            return (
              <div
                key={workerId}
                className="p-3 rounded-xl bg-zinc-900/50 border border-zinc-800/80 hover:border-zinc-700 transition-colors"
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="font-mono font-semibold text-zinc-300 flex items-center gap-1.5">
                    <Server className="w-3.5 h-3.5 text-cyan-400" /> Thread #{workerId}
                  </span>
                  <span
                    className={`font-mono text-[11px] ${
                      isIdle ? 'text-zinc-500' : 'text-emerald-400 font-semibold'
                    }`}
                  >
                    {isIdle ? 'IDLE' : `${workerSpeed} MB/s`}
                  </span>
                </div>

                <div className="mt-2 w-full bg-zinc-800 h-1 rounded-full overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-cyan-400 to-emerald-400 h-full transition-all duration-300"
                    style={{ width: isIdle ? '10%' : `${Math.floor(Math.random() * 50) + 40}%` }}
                  />
                </div>

                <div className="mt-2 flex items-center justify-between text-[11px] text-zinc-500 font-mono">
                  <span>Socket: Keep-Alive</span>
                  <span>TLS 1.3 Mux</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
