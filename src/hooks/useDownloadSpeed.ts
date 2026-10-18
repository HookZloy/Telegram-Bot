import { useState, useEffect } from 'react';
import { DownloadTask } from '../types';

export interface TaskSpeedMap {
  [taskId: string]: {
    speed: string; // e.g. "5.2 MB/s"
    rawSpeedMBps: number;
    etaSeconds: number;
  };
}

/**
 * Custom simulation hook to calculate and dynamically fluctuate realistic download speeds
 * for tasks currently in the 'downloading' state.
 */
export function useDownloadSpeed(tasks: DownloadTask[]) {
  const [speedMap, setSpeedMap] = useState<TaskSpeedMap>({});

  useEffect(() => {
    const activeTasks = tasks.filter((t) => t.status === 'downloading');

    if (activeTasks.length === 0) {
      setSpeedMap({});
      return;
    }

    // Initialize speeds for active tasks if not already present
    setSpeedMap((prev) => {
      const nextMap: TaskSpeedMap = {};
      activeTasks.forEach((task) => {
        if (prev[task.id]) {
          nextMap[task.id] = prev[task.id];
        } else {
          // Initial realistic speed between 4.8 MB/s and 16.5 MB/s
          const baseSpeed = 4.8 + Math.random() * 11.7;
          nextMap[task.id] = {
            speed: `${baseSpeed.toFixed(1)} MB/s`,
            rawSpeedMBps: baseSpeed,
            etaSeconds: Math.floor(8 + Math.random() * 15),
          };
        }
      });
      return nextMap;
    });

    // Interval to simulate dynamic network fluctuations (jitter, throttling, peak throughput)
    const interval = setInterval(() => {
      setSpeedMap((prev) => {
        const updated: TaskSpeedMap = {};
        activeTasks.forEach((task) => {
          const current = prev[task.id];
          const previousSpeed = current ? current.rawSpeedMBps : 5.2;

          // Fluctuate speed by +/- 15-25%
          const delta = (Math.random() - 0.48) * 2.2;
          const newRaw = Math.max(3.1, Math.min(28.4, previousSpeed + delta));
          const prevEta = current ? current.etaSeconds : 10;
          const newEta = Math.max(1, prevEta - 1);

          updated[task.id] = {
            speed: `${newRaw.toFixed(1)} MB/s`,
            rawSpeedMBps: newRaw,
            etaSeconds: newEta,
          };
        });
        return updated;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [tasks]);

  const totalActiveSpeedMBps = Object.values(speedMap).reduce(
    (acc, curr) => acc + curr.rawSpeedMBps,
    0
  );

  return {
    speedMap,
    getSpeedForTask: (taskId: string) => speedMap[taskId]?.speed || '5.2 MB/s',
    getEtaForTask: (taskId: string) => `${speedMap[taskId]?.etaSeconds || 5}s`,
    totalActiveSpeed: totalActiveSpeedMBps > 0 ? `${totalActiveSpeedMBps.toFixed(1)} MB/s` : null,
    hasActiveTasks: Object.keys(speedMap).length > 0,
  };
}
