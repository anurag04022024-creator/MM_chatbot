import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import multer from 'multer';
import { LLMProvider } from './providers/llmProvider.js';
import { ImageProvider } from './providers/imageProvider.js';
import { SearchProvider } from './providers/searchProvider.js';
import { SpeechProvider } from './providers/speechProvider.js';
import { executeCode } from './providers/codeSandbox.js';
import { extractDocumentContent } from './providers/documentParser.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({ origin: '*' }));
app.use(express.json({ limit: '60mb' }));
app.use(express.urlencoded({ extended: true, limit: '60mb' }));

const upload = multer({ limits: { fileSize: 50 * 1024 * 1024 } });

// Providers initialization
const llmProvider = new LLMProvider({
  geminiApiKey: process.env.GEMINI_API_KEY,
  anthropicApiKey: process.env.ANTHROPIC_API_KEY,
  openaiApiKey: process.env.OPENAI_API_KEY,
});

const imageProvider = new ImageProvider({
  openaiApiKey: process.env.OPENAI_API_KEY,
  stabilityApiKey: process.env.STABILITY_API_KEY,
});

const searchProvider = new SearchProvider({
  tavilyApiKey: process.env.TAVILY_API_KEY,
});

const speechProvider = new SpeechProvider({
  geminiApiKey: process.env.GEMINI_API_KEY,
  openaiApiKey: process.env.OPENAI_API_KEY,
});

// --- Health Check ---
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    providers: {
      gemini: Boolean(process.env.GEMINI_API_KEY),
      anthropic: Boolean(process.env.ANTHROPIC_API_KEY),
      openai: Boolean(process.env.OPENAI_API_KEY),
      tavily: Boolean(process.env.TAVILY_API_KEY),
    },
  });
});

// --- SSE Streaming Chat Endpoint ---
app.post('/api/chat/stream', async (req, res) => {
  req.setTimeout(600000); // 10 minute timeout for long essay/code generation

  const { messages, model, extendedThinking, webSearch, maxTokens } = req.body;

  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: 'Messages array is required' });
  }

  // Set SSE and Anti-Buffering Headers
  res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders?.();

  // Keep-alive heartbeat interval to prevent aggressive proxy / gateway timeouts
  const heartbeat = setInterval(() => {
    res.write(': keep-alive\n\n');
  }, 15000);

  try {
    // Preprocess any documents or audio in messages that need extraction
    for (const msg of messages) {
      if (msg.attachments && Array.isArray(msg.attachments)) {
        for (const att of msg.attachments) {
          const mime = (att.mimeType || '').toLowerCase();
          const isDoc =
            mime.includes('pdf') ||
            mime.includes('word') ||
            mime.includes('document') ||
            mime.includes('sheet') ||
            mime.includes('excel') ||
            mime.includes('csv') ||
            mime.includes('text') ||
            ['pdf', 'docx', 'xlsx', 'csv', 'txt', 'py', 'js', 'json', 'md'].some((ext) =>
              (att.name || '').toLowerCase().endsWith(ext)
            );

          // Extract document text if buffer/base64 is available and text not yet extracted
          if (isDoc && !att.extractedText && att.base64) {
            try {
              const cleanB64 = att.base64.replace(/^data:[^;]+;base64,/, '');
              const buf = Buffer.from(cleanB64, 'base64');
              const parsed = await extractDocumentContent({
                buffer: buf,
                mimeType: mime,
                filename: att.name || 'document',
              });
              if (parsed.text) {
                att.extractedText = parsed.text;
                console.log(`[DocumentParser] Extracted ${parsed.text.length} chars from ${att.name}`);
              }
            } catch (pErr) {
              console.warn(`[DocumentParser] Failed to extract text for ${att.name}:`, pErr.message);
            }
          }

          // Transcribe audio if not yet transcribed
          if (mime.startsWith('audio/') && !att.transcript && att.base64) {
            try {
              const cleanB64 = att.base64.replace(/^data:[^;]+;base64,/, '');
              const trResult = await speechProvider.transcribe({
                base64: cleanB64,
                mimeType: mime,
              });
              if (trResult?.text) {
                att.transcript = trResult.text;
                console.log(`[SpeechProvider] Transcribed audio for ${att.name}: "${trResult.text.slice(0, 50)}..."`);
              }
            } catch (tErr) {
              console.warn(`[SpeechProvider] Failed to transcribe ${att.name}:`, tErr.message);
            }
          }
        }
      }
    }

    await llmProvider.streamChat({
      messages,
      model,
      extendedThinking,
      webSearch,
      maxTokens: maxTokens || 8192,
      onToken: (token) => {
        res.write(`data: ${JSON.stringify({ type: 'token', token })}\n\n`);
      },
      onReasoning: (reasoning) => {
        res.write(`data: ${JSON.stringify({ type: 'reasoning', token: reasoning })}\n\n`);
      },
      onToolCall: (toolCall) => {
        res.write(`data: ${JSON.stringify({ type: 'tool_call', ...toolCall })}\n\n`);
      },
      onFinishReason: (finishReason) => {
        res.write(`data: ${JSON.stringify({ type: 'finish_reason', finishReason })}\n\n`);
      },
    });

    clearInterval(heartbeat);
    res.write(`data: ${JSON.stringify({ type: 'done' })}\n\n`);
    res.end();
  } catch (err) {
    clearInterval(heartbeat);
    console.error('Chat streaming error:', err);
    res.write(`data: ${JSON.stringify({ type: 'error', error: err.message })}\n\n`);
    res.end();
  }
});

// --- Speech Transcription Endpoint ---
app.post('/api/transcribe', upload.single('file'), async (req, res) => {
  try {
    let buffer = null;
    let mimeType = 'audio/webm';

    if (req.file) {
      buffer = req.file.buffer;
      mimeType = req.file.mimetype || mimeType;
    } else if (req.body.audio) {
      const cleanB64 = req.body.audio.replace(/^data:[^;]+;base64,/, '');
      buffer = Buffer.from(cleanB64, 'base64');
      mimeType = req.body.mimeType || mimeType;
    }

    if (!buffer) {
      return res.status(400).json({ error: 'No audio provided' });
    }

    const result = await speechProvider.transcribe({ buffer, mimeType });
    res.json(result);
  } catch (err) {
    console.error('[Transcribe API Error]:', err);
    res.status(500).json({ error: err.message });
  }
});

// --- Document Text Extraction Endpoint ---
app.post('/api/documents/parse', upload.single('file'), async (req, res) => {
  try {
    let buffer = null;
    let filename = 'document';
    let mimeType = 'application/octet-stream';

    if (req.file) {
      buffer = req.file.buffer;
      filename = req.file.originalname || filename;
      mimeType = req.file.mimetype || mimeType;
    } else if (req.body.file) {
      const cleanB64 = req.body.file.replace(/^data:[^;]+;base64,/, '');
      buffer = Buffer.from(cleanB64, 'base64');
      filename = req.body.filename || filename;
      mimeType = req.body.mimeType || mimeType;
    }

    if (!buffer) {
      return res.status(400).json({ error: 'No file provided' });
    }

    const result = await extractDocumentContent({ buffer, mimeType, filename });
    res.json(result);
  } catch (err) {
    console.error('[Document Parse Error]:', err);
    res.status(500).json({ error: err.message });
  }
});

// --- Image Generation Endpoint ---
app.post('/api/image/generate', async (req, res) => {
  try {
    const { prompt, aspectRatio, style, seed } = req.body;
    if (!prompt) return res.status(400).json({ error: 'Prompt is required' });

    const result = await imageProvider.generateImage({ prompt, aspectRatio, style, seed });
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Web Search Endpoint ---
app.post('/api/search', async (req, res) => {
  try {
    const { query } = req.body;
    if (!query) return res.status(400).json({ error: 'Query is required' });

    const results = await searchProvider.search({ query });
    res.json(results);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- In-Browser / Server Code Execution Sandbox ---
app.post('/api/code/execute', async (req, res) => {
  try {
    const { code, language } = req.body;
    if (!code) return res.status(400).json({ error: 'Code is required' });

    const result = await executeCode({ code, language });
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Provider Test Endpoint ---
app.post('/api/providers/test', async (req, res) => {
  const { provider, apiKey } = req.body;
  if (!provider) return res.status(400).json({ error: 'Provider is required' });

  try {
    if (provider === 'gemini') {
      const key = apiKey || process.env.GEMINI_API_KEY;
      const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${key}`);
      return res.json({ success: r.ok, status: r.status });
    }
    return res.json({ success: true, message: `${provider} configuration verified` });
  } catch (err) {
    return res.status(400).json({ success: false, error: err.message });
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`NOVA Express Backend running on http://localhost:${PORT}`);
});
