# NOVA — Production-Quality AI Chat Web App

A production-grade, responsive AI chat web application with an interface and experience inspired by **Claude's** calm, warm, and minimalist design language. Uses an original, neutral geometric starburst logo and Claude's signature warm editorial palette.

---

## 🎨 Design System

- **Light Mode**:
  - Background: `#FAF9F5` (warm off-white)
  - Surfaces & Cards: `#FFFFFF`
  - Subtle Borders: `#E8E6DC`
  - Text: `#1F1E1D`
  - Muted Text: `#6B6A66`
  - Signature Accent: `#D97757` (terracotta / warm clay)
  - Sidebar: `#F3F1EC`
- **Dark Mode**:
  - Background: `#262624`
  - Surfaces: `#30302E`
  - Borders: `#3F3E3B`
  - Text: `#ECEBE6`
  - Muted Text: `#9C9A92`
  - Accent: `#E28768`
  - Sidebar: `#1F1F1D`
- **Typography**:
  - Headings & Greetings: **Source Serif 4** (editorial, literary serif)
  - Body & UI: **Inter** (clean, crisp sans-serif)
  - Code Blocks: **JetBrains Mono** (monospace with syntax highlighting)
- **Geometry**:
  - 12px to 24px rounded corners (`rounded-2xl`, `rounded-3xl`)
  - Soft, multi-layered shadows (`shadow-claude`, `shadow-claude-lg`)
  - Generous whitespace and smooth 150–200ms ease transitions

---

## ⚡ Tech Stack

- **Framework**: React 19 + Vite 6 + TypeScript
- **Styling**: Tailwind CSS 3.4 + PostCSS + Autoprefixer
- **Icons**: `lucide-react` (16–20px, stroke width 1.5–1.75, muted default, hover/active color)
- **State Management**: Zustand 5 with `localStorage` persistence
- **Markdown & Code**: `react-markdown` + `remark-gfm` + `prismjs`
- **Audio & Media**: HTML5 `MediaRecorder` API for in-browser voice notes, Web Speech API for dictation

---

## 📁 Project Architecture

```
frontend/
├── index.html                  # Google Fonts, favicon, metadata
├── package.json
├── tailwind.config.js          # Claude color tokens & typography
├── tsconfig.json
├── vite.config.ts              # Port 5173 host configuration
└── src/
    ├── types/
    │   ├── chat.ts             # Messages, Conversations, Attachments, Models
    │   └── settings.ts         # User profiles, theme modes, font sizing
    ├── store/
    │   ├── useChatStore.ts     # Main state (messages, streaming, attachments)
    │   ├── useThemeStore.ts    # Light, dark, and system theme manager
    │   └── useSettingsStore.ts # Preferences & profile modal state
    ├── lib/
    │   ├── api.ts              # Pluggable LLM interface
    │   ├── mockApi.ts          # Realistic streaming response & reasoning engine
    │   ├── audio.ts            # MediaRecorder voice recorder & waveform
    │   ├── speech.ts           # Web Speech API speech-to-text dictation
    │   ├── storage.ts          # LocalStorage persistence utilities
    │   └── utils.ts            # Class merging, duration & file size formatters
    ├── hooks/
    │   ├── useVoiceRecorder.ts    # Live mic recording, timer, and waveforms
    │   ├── useSpeechDictation.ts  # In-browser speech-to-text
    │   ├── useKeyboardShortcuts.ts# ⌘K, ⌘Shift+O, Esc handlers
    │   └── useDragAndDrop.ts      # Global drag-and-drop overlay
    ├── components/
    │   ├── layout/
    │   │   ├── Header.tsx         # Mobile drawer toggle, model badge, theme switch
    │   │   ├── Sidebar.tsx        # Desktop collapsible navigation & recents
    │   │   └── MobileDrawer.tsx   # Mobile navigation drawer
    │   ├── composer/
    │   │   ├── Composer.tsx           # Auto-growing textarea & toolbars
    │   │   ├── AttachMenu.tsx         # "+" popover (images, audio, docs, camera)
    │   │   ├── AttachmentList.tsx     # Staged thumbnail & audio preview cards
    │   │   ├── VoiceRecordingBar.tsx  # Live audio waveform recording strip
    │   │   └── ModelSelector.tsx      # Model dropdown (Sonnet, Haiku, Gemini)
    │   ├── chat/
    │   │   ├── ChatArea.tsx       # Main conversation container
    │   │   ├── EmptyState.tsx     # Centered serif greeting & quick cards
    │   │   ├── MessageList.tsx    # Scrollable thread with bottom auto-scroll
    │   │   ├── MessageItem.tsx    # User bubble, assistant plain text, edit
    │   │   ├── CodeBlock.tsx      # Prism syntax highlighting & copy button
    │   │   ├── AudioPlayer.tsx    # Custom audio scrubber & playback speeds
    │   │   ├── AttachmentGrid.tsx # Sent media grid & lightbox triggers
    │   │   └── ActionButtons.tsx  # Copy, thumbs up/down, retry
    │   ├── modals/
    │   │   ├── CommandPalette.tsx # ⌘K search across all conversations
    │   │   ├── SettingsModal.tsx  # Profile, theme, font size, default model
    │   │   └── LightboxModal.tsx  # Fullscreen image viewer
    │   ├── ui/
    │   │   ├── DropOverlay.tsx    # "Drop files to attach" drag overlay
    │   │   ├── Toast.tsx          # Animated notification toasts
    │   │   └── Tooltip.tsx        # Accessible tooltip wrappers
    │   └── icons/
    │       └── Logo.tsx           # Original neutral geometric starburst logo
    ├── App.tsx
    ├── main.tsx
    └── index.css
```

---

## 🚀 Running the App

### 1. Development Server
```bash
cd frontend
npm install
npm run dev
```
Open **[http://localhost:5173](http://localhost:5173)** in your browser.

### 2. Production Build
```bash
npm run build
npm run preview
```

### 3. One-Click Windows Launch
Double-click **`run_project.bat`** from the root repository. It automatically boots:
- **FastAPI Backend** on `http://localhost:8000`
- **React Web App** on `http://localhost:5173`
- Opens your default web browser automatically.

---

## 🔌 Connecting a Real LLM API

The application has a decoupled API adapter in [`src/lib/api.ts`](file:///c:/Users/anura/Downloads/MM_chatbot/frontend/src/lib/api.ts).

### Option A: Local FastAPI Backend (Pre-configured)
Pass `useLiveBackend: true` in `sendChatMessage` or toggle it in `useChatStore`. The frontend will dispatch directly to `POST http://localhost:8000/chat`.

### Option B: Anthropic Claude API Directly
Replace `sendChatMessage` in `src/lib/api.ts` with:
```typescript
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: import.meta.env.VITE_ANTHROPIC_API_KEY,
  dangerouslyAllowBrowser: true, // or via backend proxy
});

const stream = await anthropic.messages.stream({
  model: 'claude-3-5-sonnet-20241022',
  max_tokens: 4096,
  messages: history.map(m => ({ role: m.role, content: m.content })),
});

for await (const chunk of stream) {
  if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
    request.onChunk(accumulatedText += chunk.delta.text);
  }
}
```

### Option C: OpenAI / Gemini Compatible Server-Sent Events (SSE)
Use standard `fetch()` with `ReadableStream`:
```typescript
const response = await fetch('/api/chat', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ prompt: request.prompt }),
  signal: request.signal,
});

const reader = response.body?.getReader();
const decoder = new TextDecoder();
while (reader) {
  const { done, value } = await reader.read();
  if (done) break;
  request.onChunk(decoder.decode(value));
}
```

---

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
| :--- | :--- |
| `Ctrl + K` / `Cmd + K` | Open Command Palette / Search |
| `Ctrl + Shift + O` / `Cmd + Shift + O` | Start New Chat |
| `Escape` | Close any active modal, menu, or lightbox |
| `Enter` (in Composer) | Send message |
| `Shift + Enter` (in Composer) | New line |
