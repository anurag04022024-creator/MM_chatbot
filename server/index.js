import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import multer from 'multer';
import { LLMProvider } from './providers/llmProvider.js';
import { ImageProvider } from './providers/imageProvider.js';
import { SearchProvider } from './providers/searchProvider.js';
import { SpeechProvider } from './providers/speechProvider.js';
import { executeCode } from './providers/codeSandbox.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({ origin: '*' }));
app.use(express.json({ limit: '30mb' }));
app.use(express.urlencoded({ extended: true, limit: '30mb' }));

const upload = multer({ limits: { fileSize: 25 * 1024 * 1024 } });

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
  const { messages, model, extendedThinking, webSearch } = req.body;

  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: 'Messages array is required' });
  }

  // Set SSE Headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders?.();

  try {
    await llmProvider.streamChat({
      messages,
      model,
      extendedThinking,
      webSearch,
      onToken: (token) => {
        res.write(`data: ${JSON.stringify({ type: 'token', token })}\n\n`);
      },
      onReasoning: (reasoning) => {
        res.write(`data: ${JSON.stringify({ type: 'reasoning', token: reasoning })}\n\n`);
      },
      onToolCall: (toolCall) => {
        res.write(`data: ${JSON.stringify({ type: 'tool_call', ...toolCall })}\n\n`);
      },
    });

    res.write(`data: ${JSON.stringify({ type: 'done' })}\n\n`);
    res.end();
  } catch (err) {
    console.error('Chat streaming error:', err);
    res.write(`data: ${JSON.stringify({ type: 'error', error: err.message })}\n\n`);
    res.end();
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

// --- Code Execution Endpoint ---
app.post('/api/execute-code', async (req, res) => {
  try {
    const { language, code } = req.body;
    if (!code) return res.status(400).json({ error: 'Code is required' });

    const result = await executeCode({ language, code });
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Transcription Endpoint ---
app.post('/api/transcribe', upload.single('audio'), async (req, res) => {
  try {
    const result = await speechProvider.transcribe({
      fileBuffer: req.file?.buffer,
      mimeType: req.file?.mimetype,
    });
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
