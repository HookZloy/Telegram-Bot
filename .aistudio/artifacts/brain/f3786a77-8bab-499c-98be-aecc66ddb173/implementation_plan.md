# Downloader_GodBot — Smart 4K Trimmer, Waveform Preview & Parallel Accelerator

A high-performance multimedia extraction command center and Telegram Cloud Bot console featuring an interactive smart video trimmer, cyberpunk glassmorphism preview player with audio waveform visualization, and multi-stream parallel acceleration with chunked caching.

---

### User Review & Critical Decisions

> [!IMPORTANT]
> The following architectural decisions have been confirmed through user clarification:
> - **Primary Trending Feature**: Smart video trimmer and real-time preview player before downloading, allowing users to select in/out timestamps, preview clips, and download only the exact segment needed.
> - **Performance Acceleration**: Multi-stream parallel acceleration engine with chunked caching for high-speed concurrent downloads and instant segment re-assembly.
> - **Inspection & Media Experience**: Cyberpunk glassmorphism floating modal featuring a live interactive canvas audio waveform, dual scrubber handles, resolution toggle, and telemetry bitrates.

---

### 1. Overview & Core Concept

**What It Does**:
Downloader_GodBot enables users to inspect any multimedia URL (YouTube, TikTok, Instagram Reels, Soundcloud, Vimeo, movies, and live streams) with instant pre-download playback. Users can trim any segment using precision draggable range scrubbers with visual waveform amplitude, choose video/audio quality up to 4K 60fps, and download with multi-stream parallel worker acceleration and local chunk caching.

**Target Audience**:
Content creators, video editors, clip archivists, DJ/audio producers, and Telegram bot power users seeking fast, surgical media downloads without downloading unnecessary gigabytes of full-length footage.

**Key Value**:
1. **Pre-Download Segment Trimming**: Eliminates bloated downloads by slicing only desired segments (e.g. 01:14 to 02:45) with frame-accurate timestamp previews.
2. **Interactive Audio Waveform Player**: Cyberpunk glassmorphism modal with responsive canvas waveform scrubbing, playback speed control, loop repeat, and audio-only extraction.
3. **Multi-Stream Parallel Acceleration**: Simulates and manages 4 to 8 parallel chunk download streams with real-time chunk buffer visualization and cache hit tracking.
4. **Telegram Cloud Bot Sync**: Dispatches trimmed clips or full files directly to Telegram chats via `@Downloader_GodBot` API.

---

### 2. User Experience & Visual Design

#### A. Key User Flows
1. **Link Ingestion & Quick Preview**: User pastes a link or picks from sample playlists/videos. The system fetches stream metadata and displays a "Trim & Preview" action alongside the standard download button.
2. **Cyberpunk Glassmorphism Trimmer Modal**:
   - Clicking "Trim & Preview" opens a floating glassmorphism viewport with backdrop blur (`backdrop-blur-xl bg-zinc-950/80 border border-cyan-500/30`).
   - The top area plays the video or audio stream with synchronized time display (`hh:mm:ss.ms`).
   - The middle area displays an interactive multi-bar audio waveform canvas with draggable `Start` and `End` trim handles.
   - Presets for quick trims (e.g. `First 30s`, `1 Minute Hook`, `Custom Range`).
3. **Multi-Stream Parallel Download Execution**:
   - When a download or trimmed export is initiated, a chunked progress matrix opens showing parallel streams (Worker 1 to Worker 8) loading chunks concurrently.
   - Chunk buffer blocks transition from `Queued` (dark slate) $\to$ `Streaming` (pulsing cyan) $\to$ `Cached / Verified` (emerald).
4. **History & Vault Persistence**:
   - All trimmed clips and download tasks are saved to Firebase Firestore under the user's profile (`/users/{uid}/downloads`).
   - Guest downloads persist in local session state with 1-click Google Sign-in to sync.

#### B. Visual Identity & Theme
- **Aesthetic Direction**: Dark cyber-telecom studio console with restrained cyberpunk glassmorphic accents (deep carbon slate `#090D16`, electric cyan `#00E5FF`, signal emerald `#10B981`, and telecom blue `#229ED9`).
- **Typography**: Clean display sans (`Plus Jakarta Sans`) for structural headers paired with tabular monospace numerals (`JetBrains Mono` / `tabular-nums`) for bitrates, timestamps, and chunk telemetry.
- **Zero-Pill Discipline**: Metadata (bitrates, file sizes, duration, aspect ratios) rendered as unboxed typography separated by subtle typographic dots (`·`) rather than nested colored pill capsules.
- **Waveform Canvas**: Dynamic HTML5 canvas drawing frequency bars with cyan-to-emerald gradient fills, interactive seek head cursor, and highlighted range selection bracket.

---

### 3. Key Product Decisions & Trade-Offs

- **Decision 1: Client-Side Interactive Trimmer & Waveform Engine**:
  - *Chosen Approach*: Build a dedicated HTML5 canvas waveform generator and video controller component with dual range slider mathematics and millisecond precision.
  - *Why*: Gives users immediate visual feedback on the audio/video density without requiring a heavy server-side ffmpeg render before previewing.
  - *Alternatives Considered*: Static start/end text input fields. Rejected because visual scrubbers and waveform bars provide a vastly superior trimming experience.

- **Decision 2: Chunked Parallel Acceleration Visualizer**:
  - *Chosen Approach*: Provide a real-time multi-worker stream simulation with chunk caching states, realistic throughput curves, and reassembly progress.
  - *Why*: Delivers transparency on why multi-stream downloads achieve 4x-8x higher throughput on throttled media servers.

- **Decision 3: Cyberpunk Glassmorphism Modal Architecture**:
  - *Chosen Approach*: Accessible floating modal with backdrop filter blur, escape key handling, single elevation layer, and responsive mobile-to-desktop adaptation.
  - *Why*: Allows reviewing and trimming media in focus without losing context of the active download queue or batch playlist behind it.

---

### 4. Technical Architecture & Data Strategy

```
┌────────────────────────────────────────────────────────────────────────┐
│                        Downloader_GodBot Core                          │
│                                                                        │
│  ┌───────────────────────┐  ┌───────────────────────────────────────┐  │
│  │   Top Header Bar      │  │  Storage Quota & Bot Status Indicator │  │
│  └───────────┬───────────┘  └───────────────────┬───────────────────┘  │
│              │                                  │                      │
│  ┌───────────▼──────────────────────────────────▼───────────────────┐  │
│  │              Cyberpunk Glassmorphism Trimmer Modal               │  │
│  │  ┌────────────────────────────────────────────────────────────┐  │  │
│  │  │ HTML5 Video Player / Audio Stream Preview                  │  │  │
│  │  ├────────────────────────────────────────────────────────────┤  │  │
│  │  │ Interactive Audio Waveform Canvas (Drag In/Out Brackets)   │  │  │
│  │  ├────────────────────────────────────────────────────────────┤  │  │
│  │  │ Timecode Trimmer: [00:15.00] ─── Length: 45s ─── [01:00.00]│  │  │
│  │  └────────────────────────────────────────────────────────────┘  │  │
│  └──────────────────────────────────┬───────────────────────────────┘  │
│                                     │                                  │
│  ┌──────────────────────────────────▼───────────────────────────────┐  │
│  │          Multi-Stream Parallel Accelerator & Chunk Cache         │  │
│  │  - 8 Parallel Worker Nodes with Dynamic Jitter Simulation        │  │
│  │  - Visual Chunk Buffer Grid (Queued, Streaming, Cached)          │  │
│  │  - Instant Segment Reassembly & Integrity Checksum               │  │
│  └──────────────────┬───────────────────────────────┬───────────────┘  │
│                     │                               │                  │
│  ┌──────────────────▼───────────┐   ┌───────────────▼───────────────┐  │
│  │  Firebase Firestore Vault    │   │  Express Server & Telegram    │  │
│  │  - /users/{uid}/downloads    │   │  - /api/bot/status & webhook  │  │
│  │  - Trimmed clips & metadata  │   │  - /api/gemini/analyze-media  │  │
│  │  - Cache registry entries    │   │  - Stream chunking proxy      │  │
│  └──────────────────────────────┘   └───────────────────────────────┘  │
└────────────────────────────────────────────────────────────────────────┘
```

#### State & Component Mapping:
1. `SmartMediaTrimmerModal.tsx`: Cyberpunk glassmorphism floating modal with HTML5 video player, interactive canvas waveform visualizer, dual scrubbers, loop toggle, and "Export Trimmed Clip" trigger.
2. `ParallelStreamAccelerator.tsx`: Multi-stream worker matrix visualizing 8 concurrent chunk streams, chunk buffer grid, cache hit indicators, and throughput speedup factor.
3. `MediaDownloader.tsx`: Integrated with "Trim & Preview" action buttons for any entered URL or detected stream.
4. `DownloadHistory.tsx`: Extended to show trimmed segment badges (`00:15 - 01:00`), cached chunks status, and direct playback in the trimmer modal.
5. `types.ts`: Extended with `TrimSettings` (`startTime`, `endTime`, `duration`), `StreamChunk` (`id`, `workerIndex`, `status`, `progress`), and cache metadata.
