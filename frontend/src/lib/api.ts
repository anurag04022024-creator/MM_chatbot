import { Message, Attachment } from '../types/chat';
import { streamMockResponse } from './mockApi';

export interface ChatCompletionRequest {
  prompt: string;
  history: Message[];
  attachments?: Attachment[];
  model: string;
  extendedThinking?: boolean;
  webSearch?: boolean;
  onChunk: (chunk: string) => void;
  onReasoning?: (reasoning: string) => void;
  signal?: AbortSignal;
  useLiveBackend?: boolean;
}

export async function sendChatMessage(request: ChatCompletionRequest): Promise<{ content: string; reasoning?: string }> {
  const { prompt, history, attachments = [], model, extendedThinking, webSearch, onChunk, onReasoning, signal } = request;

  // Handle /image slash command directly via the image generation API
  if (prompt.trim().toLowerCase().startsWith('/image ')) {
    const imagePrompt = prompt.trim().slice(7).trim();
    onChunk('Generating your image with NOVA AI Canvas...');

    try {
      const imgRes = await fetch('http://localhost:3001/api/image/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: imagePrompt, aspectRatio: '1:1', style: 'photorealistic' }),
        signal,
      });

      if (imgRes.ok) {
        const data = await imgRes.json();
        const content = `Here is your generated image for **"${imagePrompt}"**:\n\n![${imagePrompt}](${data.url})\n\n*Style: ${data.style} • Aspect Ratio: ${data.aspectRatio} • Provider: ${data.provider}*`;
        onChunk(content);
        return { content };
      }
    } catch (err: any) {
      console.warn('Image generation endpoint error:', err);
    }
  }

  // Prepare full multi-turn conversation history
  const messages = [
    ...history.map((m) => ({ role: m.role, content: m.content })),
    { role: 'user', content: prompt },
  ];

  // PRIMARY: Stream directly from Express Proxy (connected to Google Gemini live)
  try {
    const response = await fetch('http://localhost:3001/api/chat/stream', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages,
        model,
        extendedThinking,
        webSearch,
      }),
      signal,
    });

    if (response.ok && response.body) {
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let accumulated = '';
      let accumulatedReasoning = '';
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (trimmed.startsWith('data: ')) {
            try {
              const data = JSON.parse(trimmed.slice(6));
              if (data.type === 'token' && data.token) {
                accumulated += data.token;
                onChunk(accumulated);
              } else if (data.type === 'reasoning' && data.token && onReasoning) {
                accumulatedReasoning += data.token;
                onReasoning(accumulatedReasoning);
              } else if (data.type === 'tool_call') {
                if (data.sources && Array.isArray(data.sources)) {
                  accumulated += `\n\n🔍 *Sources Consulted:*\n` + data.sources.map((s: any) => `- [${s.title}](${s.url}) (${s.domain})`).join('\n') + `\n\n`;
                  onChunk(accumulated);
                }
              } else if (data.type === 'done') {
                if (accumulated.trim()) {
                  return { content: accumulated, reasoning: accumulatedReasoning || undefined };
                }
              } else if (data.type === 'error') {
                throw new Error(data.error || 'Server error during stream');
              }
            } catch (jsonErr) {
              // Ignore partial JSON parse errors
            }
          }
        }
      }

      if (accumulated.trim()) {
        return { content: accumulated, reasoning: accumulatedReasoning || undefined };
      }
    }
  } catch (err: any) {
    if (err.name === 'AbortError' || err.message?.includes('aborted') || err.message?.includes('stopped')) {
      throw err;
    }
    console.warn('Express SSE proxy unavailable or failed, trying FastAPI fallback:', err);
  }

  // SECONDARY FALLBACK: FastAPI backend at http://localhost:8000/chat
  try {
    const res = await fetch('http://localhost:8000/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        session_id: 'web-session',
        message: prompt,
        use_rag: true,
      }),
      signal,
    });
    if (res.ok) {
      const data = await res.json();
      const content = data.content || '';
      onChunk(content);
      return { content };
    }
  } catch (backendErr) {
    console.warn('FastAPI backend unreachable:', backendErr);
  }

  // TERTIARY FALLBACK: Dynamic mock engine with natural reasoning
  return streamMockResponse({
    prompt,
    history,
    attachments,
    model,
    extendedThinking,
    webSearch,
    onChunk,
    onReasoning,
    signal,
  });
}
