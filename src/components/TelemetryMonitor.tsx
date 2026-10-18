import React, { useState, useEffect } from 'react';
import { TelemetryPoint } from '../types';
import {
  Activity,
  Cpu,
  Server,
  Zap,
  HardDrive,
  Radio,
  Sliders,
  RefreshCw,
  Layers,
  ShieldCheck
} from 'lucide-react';

interface TelemetryMonitorProps {
  isDownloading: boolean;
  activeCount: number;
}

export const TelemetryMonitor: React.FC<TelemetryMonitorProps> = ({ isDownloading, activeCount }) => {
  const [points, setPoints] = useState<TelemetryPoint[]>(() => {
    const initial: TelemetryPoint[] = [];
    const now = Date.now();
    for (let i = 20; i >= 0; i--) {
      const t = new Date(now - i * 1500).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      initial.push({
        time: t,
        speedMBps: 3.2 + Math.random() * 4.5,
        activeThreads: 4,
        packetLossPercent: 0,
      });
    }
    return initial;
  });

  const [currentSpeed, setCurrentSpeed] = useState<number>(14.2);
  const [activeThreads, setActiveThreads] = useState<number>(8);
  const [muxingLoad, setMuxingLoad] = useState<number>(34);

  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      const baseThroughput = isDownloading || activeCount > 0 ? 18.5 : 5.8;
      const jitter = (Math.random() - 0.45) * 6.2;
      const newSpeed = Math.max(1.8, +(baseThroughput + jitter).toFixed(1));

      const newThreads = isDownloading || activeCount > 0 ? Math.min(16, 6 + activeCount * 2) : 4;
      const newMuxLoad = Math.min(96, Math.max(18, Math.round(newSpeed * 3.8)));

      setCurrentSpeed(newSpeed);
      setActiveThreads(newThreads);
      setMuxingLoad(newMuxLoad);

      setPoints((prev) => {
        const next = [...prev.slice(1), {
          time: now,
          speedMBps: newSpeed,
          activeThreads: newThreads,
          packetLossPercent: Math.random() > 0.9 ? 0.2 : 0,
        }];
        return next;
      });
    }, 1500);

    return () => clearInterval(interval);
  }, [isDownloading, activeCount]);

  // SVG chart dimensions
  const width = 640;
  const height = 110;
  const maxSpeed = 32;

  // Convert points to SVG polyline coordinates
  const svgPoints = points
    .map((pt, idx) => {
      const x = (idx / (points.length - 1)) * width;
      const y = height - (pt.speedMBps / maxSpeed) * (height - 15) - 8;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');

  const areaPoints = `0,${height} ${svgPoints} ${width},${height}`;

  return (
    <div className="bg-[#090D16] border border-cyan-950/60 rounded-2xl p-5 shadow-2xl relative overflow-hidden text-zinc-200">
      {/* Background cyber grid lines */}
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(#00E5FF 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }}
      />

      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3.5 border-b border-zinc-800/80 mb-4 relative z-10">
        <div>
          <div className="flex items-center gap-2">
            <Radio className="w-4 h-4 text-cyan-400 animate-pulse" />
            <h3 className="text-sm font-bold text-white tracking-wide uppercase font-mono">
              Telecom Node Telemetry &amp; Throughput Monitor
            </h3>
            <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-cyan-950/80 text-cyan-400 border border-cyan-800/60">
              CLUSTER #8701498346
            </span>
          </div>
          <p className="text-xs text-zinc-400 mt-0.5">
            Real-time bandwidth throughput, 4K audio muxing pipeline, and worker thread telemetry.
          </p>
        </div>

        <div className="flex items-center gap-3 text-xs font-mono">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
            <span className="text-emerald-400 font-semibold">Live Socket Feed</span>
          </div>
          <span className="text-zinc-600">|</span>
          <span className="text-zinc-400">Latency: <span className="text-zinc-200 font-bold">14ms</span></span>
        </div>
      </div>

      {/* Primary KPI Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4 relative z-10">
        <div className="bg-zinc-950/70 border border-zinc-800/80 rounded-xl p-3">
          <span className="text-[11px] font-medium text-zinc-400 block mb-1">Current Throughput</span>
          <div className="flex items-baseline gap-1.5">
            <span className="text-xl sm:text-2xl font-bold font-mono text-cyan-400 tabular-nums">
              {currentSpeed.toFixed(1)}
            </span>
            <span className="text-xs font-mono text-zinc-400">MB/s</span>
          </div>
          <span className="text-[10px] text-zinc-500 font-mono mt-1 block">Peak: 31.8 MB/s</span>
        </div>

        <div className="bg-zinc-950/70 border border-zinc-800/80 rounded-xl p-3">
          <span className="text-[11px] font-medium text-zinc-400 block mb-1">Muxing Engine (FFmpeg)</span>
          <div className="flex items-baseline gap-1.5">
            <span className="text-xl sm:text-2xl font-bold font-mono text-emerald-400 tabular-nums">
              {muxingLoad}%
            </span>
            <span className="text-xs font-mono text-zinc-400">load</span>
          </div>
          <span className="text-[10px] text-emerald-400/80 font-mono mt-1 block">AV1 / VP9 / AAC</span>
        </div>

        <div className="bg-zinc-950/70 border border-zinc-800/80 rounded-xl p-3">
          <span className="text-[11px] font-medium text-zinc-400 block mb-1">Worker Threads</span>
          <div className="flex items-baseline gap-1.5">
            <span className="text-xl sm:text-2xl font-bold font-mono text-white tabular-nums">
              {activeThreads}
            </span>
            <span className="text-xs font-mono text-zinc-400">/ 16 active</span>
          </div>
          <span className="text-[10px] text-zinc-500 font-mono mt-1 block">Hardware Accelerated</span>
        </div>

        <div className="bg-zinc-950/70 border border-zinc-800/80 rounded-xl p-3">
          <span className="text-[11px] font-medium text-zinc-400 block mb-1">Packet Stream Health</span>
          <div className="flex items-baseline gap-1.5">
            <span className="text-xl sm:text-2xl font-bold font-mono text-cyan-300 tabular-nums">
              99.98%
            </span>
          </div>
          <span className="text-[10px] text-zinc-500 font-mono mt-1 block">Zero Buffer Underrun</span>
        </div>
      </div>

      {/* Live Graph Canvas Container */}
      <div className="bg-zinc-950/80 border border-zinc-800/90 rounded-xl p-3 relative z-10">
        <div className="flex items-center justify-between text-[11px] text-zinc-400 font-mono mb-2">
          <span className="flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5 text-cyan-400" />
            Rolling 30-Second Bandwidth Curve
          </span>
          <span className="text-zinc-500">Max Scale: 32 MB/s</span>
        </div>

        {/* SVG Telemetry Curve */}
        <div className="w-full h-28 relative">
          <svg
            viewBox={`0 0 ${width} ${height}`}
            className="w-full h-full overflow-visible"
            preserveAspectRatio="none"
          >
            <defs>
              <linearGradient id="cyberGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#00E5FF" stopOpacity="0.35" />
                <stop offset="70%" stopColor="#00E5FF" stopOpacity="0.05" />
                <stop offset="100%" stopColor="#00E5FF" stopOpacity="0" />
              </linearGradient>
            </defs>

            {/* Horizontal Grid lines */}
            <line x1="0" y1={height * 0.25} x2={width} y2={height * 0.25} stroke="#27272a" strokeDasharray="3 3" strokeWidth="0.8" />
            <line x1="0" y1={height * 0.5} x2={width} y2={height * 0.5} stroke="#27272a" strokeDasharray="3 3" strokeWidth="0.8" />
            <line x1="0" y1={height * 0.75} x2={width} y2={height * 0.75} stroke="#27272a" strokeDasharray="3 3" strokeWidth="0.8" />

            {/* Gradient Fill */}
            <polygon points={areaPoints} fill="url(#cyberGradient)" />

            {/* Glowing Main Curve */}
            <polyline
              fill="none"
              stroke="#00E5FF"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              points={svgPoints}
            />

            {/* Current point beacon */}
            {points.length > 0 && (
              <circle
                cx={width}
                cy={height - (points[points.length - 1].speedMBps / maxSpeed) * (height - 15) - 8}
                r="4"
                fill="#00E5FF"
                className="animate-ping"
              />
            )}
          </svg>
        </div>

        {/* X-axis labels */}
        <div className="flex justify-between text-[10px] text-zinc-500 font-mono mt-1 px-1">
          <span>-30s</span>
          <span>-20s</span>
          <span>-10s</span>
          <span className="text-cyan-400 font-semibold">Now</span>
        </div>
      </div>
    </div>
  );
};
