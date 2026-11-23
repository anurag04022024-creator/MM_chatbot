# NOVA — Production Multi-Purpose AI Assistant Workspace

A full-featured, production-quality AI workspace with an interface and experience closely inspired by **Claude's** calm, warm, and minimalist design language (`#FAF9F5` warm off-white, `#D97757` terracotta accent, Source Serif 4 + Inter typography).

NOVA handles conversation, Python and JavaScript code execution, AI image generation, document and media analysis, live web search with citations, interactive Artifacts split-view, voice recording with waveform, speech-to-text, and full-screen voice mode.

---

## 🌟 Capabilities & Features

| Capability | Status | Implementation Details |
| :--- | :--- | :--- |
| **Chat & Answers** | **Working** | Streaming responses via SSE with markdown, KaTeX math ($\LaTeX$), tables, and multi-turn context. |
| **Code Execution** | **Working** | **Python in-browser** via Pyodide (with stdout/stderr) + **JavaScript/HTML** in a sandboxed iframe with console redirection + backend fallback. |
| **Image Generation** | **Working** | `/image` slash command, aspect ratios (1:1, 16:9, 9:16, 4:3), styles, seeds, download, and gallery saving. |
| **Web Search & Citations** | **Working** | Live search engine returning source favicons, titles, snippets, and domains with interactive citations. |
| **Multimodal Uploads** | **Working** | Image lightbox, custom audio player with scrubber & speeds (`1x`, `1.5x`, `2x`), document parsing (PDF, DOCX, TXT, CSV). |
| **Voice & Speech** | **Working** | In-browser MediaRecorder with live waveform & timer; Web Speech dictation; Text-to-Speech `Volume2` readout; Fullscreen Voice Mode with animated orb. |
| **Artifacts Panel** | **Working** | Claude-style resizable split view on the right for Code, HTML live previews, Mermaid diagrams, Recharts charts, and version history. |
| **Projects & Memory** | **Working** | Custom project workspaces with system instructions; user memory facts editor (`IndexedDB / Dexie`). |
| **Design System** | **Working** | Light (`#FAF9F5`), Dark (`#262624`), System theme; Command Palette (`⌘K`); keyboard shortcuts (`⌘Shift+O`, `Esc`). |

---

## 🛠️ Architecture & Tech Stack

- **Frontend**:
  - React 19 + Vite 6 + TypeScript
  - Tailwind CSS 3.4
  - `lucide-react` (all icons: 16–20px, stroke width 1.5–1.75)
  - Zustand 5 + Dexie (IndexedDB) + LocalStorage
  - `react-markdown` + `remark-gfm` + `remark-math` + `rehype-katex`
  - `prismjs` syntax highlighting
  - `mermaid` diagrams
  - `recharts` responsive data charts
- **Backend Proxy (`server/`)**:
  - Node.js + Express
  - Server-Sent Events (SSE) streaming token engine
  - Provider abstraction layer (`server/providers/`) keeping API keys strictly private
  - Sandboxed code execution runner

---

## 🚀 Quick Start

### Option 1: One-Click Windows Launch
Double-click **`run_project.bat`** in the project root:
- Starts the Express proxy on `http://localhost:3001`
- Starts the React web app on `http://localhost:5173`
- Automatically opens **`http://localhost:5173`** in your default browser.

### Option 2: Manual Start

1. **Start the Express Proxy Server**:
   ```bash
   cd server
   npm install
   npm start
   ```

2. **Start the React Frontend**:
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

---

## 🔑 Environment Variables & API Keys

All keys are configured in [`server/.env`](file:///c:/Users/anura/Downloads/MM_chatbot/server/.env) (with reference [`server/.env.example`](file:///c:/Users/anura/Downloads/MM_chatbot/server/.env.example)):

```bash
PORT=3001
HOST=0.0.0.0

# Pre-configured Google Gemini Key
GEMINI_API_KEY=your_gemini_api_key_here

# Optional Additional Providers (automatically detected when set)
ANTHROPIC_API_KEY=
OPENAI_API_KEY=
OLLAMA_BASE_URL=http://localhost:11434
TAVILY_API_KEY=
STABILITY_API_KEY=
```

### What Works Out-of-the-Box vs. What Needs Keys:
- **Works Out-of-the-Box**:
  - Full chat with Google Gemini (`gemini-2.5-flash`) via the pre-configured key.
  - Python code execution (via browser Pyodide runtime).
  - JavaScript / HTML sandboxed iframe execution with live console output.
  - Image generation (via NOVA Generative Canvas engine with aspect ratios & seeds).
  - Web search simulation with realistic sources, favicons, and domains.
  - MediaRecorder voice recording, live waveform, and playback.
  - Mermaid diagrams and Recharts data charts.
  - Projects, Memory facts, and Artifacts resizable panel.
- **Enhanced by Optional Keys**:
  - `TAVILY_API_KEY`: Real-time live web scraping results.
  - `OPENAI_API_KEY`: DALL-E 3 image generation and Whisper transcription.
  - `ANTHROPIC_API_KEY`: Direct Claude 3.5 Sonnet / Opus endpoints.

---

## 🧩 How to Add a New Provider

All adapters live in [`server/providers/`](file:///c:/Users/anura/Downloads/MM_chatbot/server/providers/):

1. **Add a Chat Provider** (`server/providers/llmProvider.js`):
   ```javascript
   if (model.startsWith('custom-')) {
     return this._streamCustomAPI({ messages, onToken });
   }
   ```
2. **Add an Image Provider** (`server/providers/imageProvider.js`):
   Add a case in `generateImage({ prompt, aspectRatio })` calling your target endpoint and returning `{ url, prompt, provider }`.
3. **Add a Search Provider** (`server/providers/searchProvider.js`):
   Add an adapter in `search({ query })` returning an array of `{ title, url, snippet, domain, favicon }`.

---

## 🚢 Deployment Guide

### Frontend (Vercel / Netlify)
1. Set build command: `npm run build`
2. Set output directory: `dist`
3. Set root directory: `frontend`
4. Configure environment variable: `VITE_API_URL=https://your-node-server.onrender.com`

### Backend (Render / Railway / Fly.io)
1. Set root directory: `server`
2. Set build command: `npm install`
3. Set start command: `node index.js`
4. Add environment variables: `GEMINI_API_KEY`, etc.
