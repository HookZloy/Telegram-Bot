import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, ThinkingLevel } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = parseInt(process.env.PORT || '3000', 10);

app.use(express.json());

const BOT_TOKEN = '8701498346:AAHrGsDhrK8TLLP-KGl_8SmRqyc3JcOseFo';
const BOT_CLI_APP = 'app8701498346:4HMOowhjWhUjjP8RpHQIVYIcC-biEdOo6yYTM5cClHU';

// Initialize Gemini SDK with User-Agent header as required
const getGeminiClient = () => {
  return new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
};

// 1. Telegram Bot API: Get Bot Status
app.get('/api/bot/status', async (_req, res) => {
  try {
    const tgRes = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/getMe`);
    const data = await tgRes.json();
    res.json({
      success: data.ok,
      result: data.result || null,
      error: data.description || null,
      cliApp: BOT_CLI_APP,
      botTokenMasked: '8701498346:***...OseFo',
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: err.message || 'Failed to reach Telegram Bot API',
    });
  }
});

// 2. Telegram Bot API: Get Webhook Info
app.get('/api/bot/webhook', async (_req, res) => {
  try {
    const tgRes = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/getWebhookInfo`);
    const data = await tgRes.json();
    res.json({
      success: data.ok,
      result: data.result || null,
      error: data.description || null,
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: err.message || 'Failed to fetch webhook info',
    });
  }
});

// 3. Telegram Bot API: Get Recent Updates
app.get('/api/bot/updates', async (_req, res) => {
  try {
    const tgRes = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/getUpdates?limit=10`);
    const data = await tgRes.json();
    res.json({
      success: data.ok,
      result: data.result || [],
      error: data.description || null,
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: err.message || 'Failed to fetch updates',
    });
  }
});

// 4. Telegram Bot API: Send Test Message
app.post('/api/bot/send-test', async (req, res) => {
  const { chatId, message } = req.body;
  if (!chatId || !message) {
    return res.status(400).json({ success: false, error: 'chatId and message are required' });
  }

  try {
    const tgRes = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: 'HTML',
      }),
    });
    const data = await tgRes.json();
    res.json({
      success: data.ok,
      result: data.result || null,
      error: data.description || null,
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: err.message || 'Failed to send Telegram message',
    });
  }
});

// 5. Gemini AI Chat Endpoint (Multi-turn, Thinking, Search Grounding, Low Latency)
app.post('/api/gemini/chat', async (req, res) => {
  try {
    const { messages, model, useSearch, thinking } = req.body;
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'messages array is required' });
    }

    const ai = getGeminiClient();

    // Model selection logic based on requirements:
    // - gemini-3.1-flash-lite for low-latency tasks
    // - gemini-3.8-flash for general tasks and search grounding
    // - gemini-4-argon with ThinkingLevel.HIGH (or gemini-3.8-flash with ThinkingLevel.HIGH if paid key unavailable)
    let selectedModel = 'gemini-3.8-flash';
    if (model === 'gemini-3.1-flash-lite') {
      selectedModel = 'gemini-3.1-flash-lite';
    } else if (model === 'gemini-4-argon') {
      selectedModel = 'gemini-4-argon';
    } else if (model) {
      selectedModel = model;
    }

    // When Search Grounding is requested, ensure model supports Google Search tool
    if (useSearch && selectedModel === 'gemini-3.1-flash-lite') {
      selectedModel = 'gemini-3.8-flash';
    }

    // Format chat contents
    const contents = messages.map((m: { role: string; content: string }) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }));

    const systemInstruction =
      'You are Downloader GodBot AI Copilot, a high-performance multimedia extraction, video downloading, and Telegram bot assistant. ' +
      'You provide expert technical assistance with downloading social media videos (YouTube, Instagram, TikTok, Twitter/X, Reddit, Pinterest, Facebook), ' +
      'audio extraction, video transcoding pipelines (FFmpeg commands), stream protocols (HLS .m3u8, MPEG-DASH, MP4 containers), ' +
      'and Telegram bot commands (/dl, /mp3, /quality, /stats) on TGCloud CLI. ' +
      'Be concise, clear, and technically precise.';

    const config: any = {
      systemInstruction,
    };

    // Google Search Grounding for up-to-date and accurate web information
    if (useSearch && (selectedModel === 'gemini-3.8-flash' || selectedModel === 'gemini-4-argon')) {
      config.tools = [{ googleSearch: {} }];
    }

    // Thinking mode enabled: high thinking level using ThinkingLevel.HIGH, no maxOutputTokens
    if (thinking) {
      config.thinkingConfig = {
        thinkingLevel: ThinkingLevel.HIGH,
      };
    }

    let response;
    let modelUsed = selectedModel;
    try {
      response = await ai.models.generateContent({
        model: selectedModel,
        contents,
        config,
      });
    } catch (genErr: any) {
      // If gemini-4-argon fails (e.g. requires paid billing or permission), fall back gracefully to gemini-3.8-flash
      if (selectedModel === 'gemini-4-argon') {
        modelUsed = 'gemini-3.8-flash';
        response = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents,
          config,
        });
      } else {
        throw genErr;
      }
    }

    const text = response.text || '';
    const groundingChunks =
      response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];

    res.json({
      text,
      groundingChunks,
      modelUsed,
      thinking: Boolean(thinking),
    });
  } catch (err: any) {
    console.error('Gemini Chat Error:', err);
    res.status(500).json({
      error: err.message || 'Error executing Gemini request',
    });
  }
});

// 6. Gemini Media Link Analyzer (uses Google Search Grounding + Fast Parsing)
app.post('/api/gemini/analyze-media', async (req, res) => {
  const { url, format } = req.body;
  if (!url) {
    return res.status(400).json({ error: 'url is required' });
  }

  try {
    const ai = getGeminiClient();
    const prompt = `Analyze this media link for download: "${url}".
Target format requested: "${format || '1080p video'}".
1. Identify the source platform (e.g., YouTube, Instagram, TikTok, Twitter/X, Reddit, Pinterest, Facebook, etc.).
2. Extract the estimated title or subject of this media.
3. Provide optimal video/audio resolution options (e.g., 1080p 60fps, 720p, 480p, MP3 320kbps).
4. Give the exact Telegram bot command string to download it: e.g. "/dl ${url}".
5. Provide a recommended FFmpeg transcoding command snippet if local conversion is required.
6. Note any platform-specific quirks (e.g., TikTok watermark removal, Instagram reels cookies, Twitter bitrate limit).

Keep the summary actionable and structured.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        systemInstruction: 'You are an expert social media video/audio download link inspector.',
      },
    });

    const text = response.text || '';
    const groundingChunks =
      response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];

    res.json({
      url,
      analysis: text,
      groundingChunks,
      model: 'gemini-3.8-flash',
    });
  } catch (err: any) {
    console.error('Media Analyze Error:', err);
    res.status(500).json({
      error: err.message || 'Failed to analyze media link',
    });
  }
});

// Start Express server and bind Vite middleware in dev or static files in production
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Downloader_GodBot server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
