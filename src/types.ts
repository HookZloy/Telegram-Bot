export interface TrimRange {
  startTime: number; // in seconds
  endTime: number;   // in seconds
  duration: number;  // total duration in seconds
  isTrimmed: boolean;
}

export interface StreamChunk {
  id: number;
  workerId: number;
  startByte: number;
  endByte: number;
  status: 'queued' | 'downloading' | 'cached' | 'completed';
  progress: number;
  speedMBps: number;
}

export interface DownloadTask {
  id: string;
  userId: string;
  url: string;
  platform: 'youtube' | 'instagram' | 'tiktok' | 'twitter' | 'facebook' | 'soundcloud' | 'spotify' | 'vimeo' | 'other';
  format: 'video_4k' | 'video_2k' | 'video_1080p' | 'video_720p' | 'video_480p' | 'audio_mp3' | 'gif';
  status: 'queued' | 'downloading' | 'completed' | 'failed';
  title: string;
  fileSize?: string;
  muxingStatus?: 'muxed' | 'muxing' | 'direct';
  batchId?: string;
  playlistName?: string;
  trimRange?: TrimRange;
  parallelWorkers?: number;
  chunkCacheHit?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PlaylistItem {
  id: string;
  title: string;
  duration: string;
  selected: boolean;
  format: DownloadTask['format'];
  estimatedSize: string;
  originalUrl: string;
  is4KCapable?: boolean;
}

export interface TelemetryPoint {
  time: string;
  speedMBps: number;
  activeThreads: number;
  packetLossPercent: number;
}

export interface BotSetting {
  userId: string;
  defaultQuality: '4k' | '1080p' | '720p' | '480p' | 'mp3';
  autoDownload: 'enabled' | 'disabled';
  targetChatId?: string;
  notificationEnabled: 'true' | 'false';
  updatedAt: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  modelUsed?: string;
  groundingChunks?: Array<{ web?: { uri?: string; title?: string } }>;
  isThinking?: boolean;
}

export interface TelegramBotInfo {
  id: number;
  is_bot: boolean;
  first_name: string;
  username: string;
  can_join_groups: boolean;
  can_read_all_group_messages: boolean;
  supports_inline_queries: boolean;
}

export interface TelegramWebhookInfo {
  url: string;
  has_custom_certificate: boolean;
  pending_update_count: number;
  last_error_date?: number;
  last_error_message?: string;
}
