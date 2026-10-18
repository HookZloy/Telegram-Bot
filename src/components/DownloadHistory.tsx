import React, { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { collection, onSnapshot, query, orderBy, deleteDoc, doc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType, loginWithGoogle } from '../firebase';
import { DownloadTask } from '../types';
import {
  History,
  Trash2,
  ExternalLink,
  Film,
  Music,
  Video,
  FileText,
  Clock,
  CheckCircle2,
  AlertCircle,
  LogIn,
  Search,
  Filter,
  Download,
  Copy,
  Check,
  Zap,
  Scissors
} from 'lucide-react';
import { useDownloadSpeed } from '../hooks/useDownloadSpeed';

export { useDownloadSpeed };

interface DownloadHistoryProps {
  user: User | null;
  guestTasks: DownloadTask[];
  onRemoveGuestTask?: (id: string) => void;
  onOpenTrimmer?: (task: DownloadTask) => void;
}

export const DownloadHistory: React.FC<DownloadHistoryProps> = ({
  user,
  guestTasks,
  onRemoveGuestTask,
  onOpenTrimmer,
}) => {
  const [tasks, setTasks] = useState<DownloadTask[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'completed' | 'downloading'>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Simulation hook for dynamic download speed estimation
  const { getSpeedForTask, totalActiveSpeed, hasActiveTasks } = useDownloadSpeed(tasks);

  useEffect(() => {
    if (!user) {
      setTasks(guestTasks);
      return;
    }

    setLoading(true);
    const downloadsRef = collection(db, 'users', user.uid, 'downloads');
    const q = query(downloadsRef, orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const loadedTasks: DownloadTask[] = [];
        snapshot.forEach((docSnap) => {
          loadedTasks.push(docSnap.data() as DownloadTask);
        });
        setTasks(loadedTasks);
        setLoading(false);
      },
      (error) => {
        setLoading(false);
        handleFirestoreError(error, OperationType.GET, `users/${user.uid}/downloads`);
      }
    );

    return () => unsubscribe();
  }, [user, guestTasks]);

  const handleDeleteTask = async (taskId: string) => {
    if (!user) {
      if (onRemoveGuestTask) onRemoveGuestTask(taskId);
      return;
    }

    const docPath = `users/${user.uid}/downloads/${taskId}`;
    try {
      await deleteDoc(doc(db, 'users', user.uid, 'downloads', taskId));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, docPath);
    }
  };

  const handleCopyLink = (url: string, id: string) => {
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filteredTasks = tasks.filter((t) => {
    const matchesSearch =
      t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.url.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.platform.toLowerCase().includes(searchQuery.toLowerCase());

    if (selectedFilter === 'all') return matchesSearch;
    return matchesSearch && t.status === selectedFilter;
  });

  const getFormatIcon = (format: DownloadTask['format']) => {
    switch (format) {
      case 'video_4k':
        return <Film className="w-4 h-4 text-cyan-400" />;
      case 'video_2k':
        return <Film className="w-4 h-4 text-blue-400" />;
      case 'audio_mp3':
        return <Music className="w-4 h-4 text-emerald-400" />;
      case 'gif':
        return <FileText className="w-4 h-4 text-purple-400" />;
      default:
        return <Film className="w-4 h-4 text-sky-400" />;
    }
  };

  return (
    <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-6 shadow-xl">
      {/* Title & Auth Prompt */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 pb-4 border-b border-zinc-800/80">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <History className="w-5 h-5 text-sky-400" />
              Download Records &amp; Media Vault
            </h2>
            <span className="text-xs px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300 font-mono">
              {tasks.length} {tasks.length === 1 ? 'task' : 'tasks'}
            </span>
            {hasActiveTasks && totalActiveSpeed && (
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/30 font-mono flex items-center gap-1 animate-pulse">
                <Zap className="w-3 h-3 text-amber-400" />
                Active Speed: {totalActiveSpeed}
              </span>
            )}
          </div>
          <p className="text-xs text-zinc-400 mt-0.5">
            {user
              ? 'Stored securely in Firebase Firestore under your account.'
              : 'Guest mode: Sign in with Google to preserve downloads permanently.'}
          </p>
        </div>

        {!user && (
          <button
            onClick={loginWithGoogle}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 text-xs font-medium transition-colors"
          >
            <LogIn className="w-3.5 h-3.5 text-sky-400" />
            <span>Sign In to Sync</span>
          </button>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            type="text"
            placeholder="Search by title, URL or platform..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-sky-500"
          />
        </div>

        <div className="flex items-center gap-1.5 self-end sm:self-auto">
          {(['all', 'completed', 'downloading'] as const).map((filterVal) => (
            <button
              key={filterVal}
              onClick={() => setSelectedFilter(filterVal)}
              className={`text-xs px-3 py-2 rounded-xl capitalize font-medium transition-colors ${
                selectedFilter === filterVal
                  ? 'bg-sky-600 text-white'
                  : 'bg-zinc-950/60 text-zinc-400 hover:text-zinc-200 border border-zinc-800'
              }`}
            >
              {filterVal}
            </button>
          ))}
        </div>
      </div>

      {/* Task List */}
      {loading ? (
        <div className="py-12 text-center text-xs text-zinc-500">Loading downloads...</div>
      ) : filteredTasks.length === 0 ? (
        <div className="py-12 text-center bg-zinc-950/40 rounded-xl border border-zinc-800/60">
          <History className="w-8 h-8 text-zinc-600 mx-auto mb-2" />
          <p className="text-xs font-medium text-zinc-400">No media downloads found</p>
          <p className="text-[11px] text-zinc-500 mt-1">
            Paste a link above to begin extracting videos or audio.
          </p>
        </div>
      ) : (
        <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
          {filteredTasks.map((task) => (
            <div
              key={task.id}
              className="bg-zinc-950/70 hover:bg-zinc-950 border border-zinc-800/80 hover:border-zinc-700/80 rounded-xl p-3.5 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
            >
              <div className="flex items-start gap-3 min-w-0">
                <div className="w-9 h-9 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center flex-shrink-0">
                  {getFormatIcon(task.format)}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-semibold text-white truncate max-w-[200px] sm:max-w-xs">
                      {task.title}
                    </span>
                    <span className="text-[10px] uppercase font-mono px-1.5 py-0.2 rounded bg-zinc-800 text-zinc-400 border border-zinc-700/50">
                      {task.platform}
                    </span>
                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-sky-950/60 text-sky-400 border border-sky-800/50">
                      {task.format.replace('_', ' ')}
                    </span>
                    {task.muxingStatus && (
                      <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-cyan-950/60 text-cyan-400 border border-cyan-800/50">
                        {task.muxingStatus === 'muxing' ? 'Muxing Audio' : 'Audio Muxed'}
                      </span>
                    )}
                    {task.trimRange && task.trimRange.isTrimmed && (
                      <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-cyan-950/80 text-cyan-300 border border-cyan-500/40 flex items-center gap-1">
                        <Scissors className="w-2.5 h-2.5" />
                        <span>Trim: {Math.floor(task.trimRange.startTime)}s-{Math.floor(task.trimRange.endTime)}s</span>
                      </span>
                    )}
                    {task.parallelWorkers && (
                      <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-emerald-950/80 text-emerald-300 border border-emerald-500/40">
                        Turbo {task.parallelWorkers}T
                      </span>
                    )}
                    {task.chunkCacheHit && (
                      <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-sky-950/80 text-sky-300 border border-sky-500/40">
                        Cached
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-3 text-[11px] text-zinc-500 mt-1">
                    <span className="truncate max-w-[240px] font-mono text-zinc-400">
                      {task.url}
                    </span>
                    {task.fileSize && <span>• {task.fileSize}</span>}
                    <span>• {new Date(task.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>

              {/* Status and Action Buttons */}
              <div className="flex items-center gap-2 justify-end">
                {/* Current Download Speed Estimate for active tasks */}
                {task.status === 'downloading' && (
                  <span
                    className="font-mono text-[11px] px-2 py-0.5 rounded-full bg-sky-950/80 text-sky-300 border border-sky-800/60 flex items-center gap-1 shadow-sm animate-pulse"
                    title="Current Download Speed estimate"
                  >
                    <Zap className="w-3 h-3 text-amber-400" />
                    <span>{getSpeedForTask(task.id)}</span>
                  </span>
                )}

                <span
                  className={`text-[11px] px-2 py-0.5 rounded-full flex items-center gap-1 font-medium ${
                    task.status === 'completed'
                      ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-800/60'
                      : task.status === 'downloading'
                      ? 'bg-sky-950/60 text-sky-400 border border-sky-800/60 animate-pulse'
                      : 'bg-zinc-800 text-zinc-400'
                  }`}
                >
                  {task.status === 'completed' ? (
                    <CheckCircle2 className="w-3 h-3" />
                  ) : (
                    <Clock className="w-3 h-3" />
                  )}
                  <span className="capitalize">{task.status}</span>
                </span>

                {onOpenTrimmer && (
                  <button
                    onClick={() => onOpenTrimmer(task)}
                    title="Preview &amp; Trim Media"
                    className="p-1.5 rounded-lg bg-cyan-950/40 hover:bg-cyan-900/60 text-cyan-400 hover:text-cyan-200 transition-colors border border-cyan-800/50"
                  >
                    <Scissors className="w-3.5 h-3.5" />
                  </button>
                )}

                <button
                  onClick={() => handleCopyLink(task.url, task.id)}
                  title="Copy media URL"
                  className="p-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors border border-zinc-800"
                >
                  {copiedId === task.id ? (
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>

                <a
                  href={task.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  title="Open source URL"
                  className="p-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors border border-zinc-800"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>

                <button
                  onClick={() => handleDeleteTask(task.id)}
                  title="Delete record"
                  className="p-1.5 rounded-lg bg-zinc-900 hover:bg-red-950/60 text-zinc-400 hover:text-red-400 transition-colors border border-zinc-800"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
