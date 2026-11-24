import { Message, Attachment } from '../types/chat';
import { streamMockResponse } from './mockApi';

export interface ChatCompletionRequest {
  prompt: string;
  history: Message[];
  attachments?: Attachment[];
  model: string;
  maxTokens?: number;
  extendedThinking?: boolean;
  webSearch?: boolean;
  onChunk: (chunk: string) => void;
  onReasoning?: (reasoning: string) => void;
  onFinishReason?: (reason: string) => void;
  signal?: AbortSignal;
  useLiveBackend?: boolean;
}

export async function sendChatMessage(request: ChatCompletionRequest): Promise<{ content: string; reasoning?: string; finishReason?: string }> {
  const {
    prompt,
    history,
    attachments = [],
    model,
    maxTokens = 8192,
    extendedThinking,
    webSearch,
    onChunk,
    onReasoning,
    onFinishReason,
    signal,
  } = request;

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

  // Format full multi-turn conversation history with full multimodal attachments attached
  const messages = [
    ...history.map((m) => ({
      role: m.role,
      content: m.content,
      attachments: m.attachments?.map((a) => ({
        id: a.id,
        name: a.name,
        type: a.type,
        mimeType: a.mimeType,
        size: a.size,
        base64: a.base64,
        extractedText: a.extractedText,
        transcript: a.transcript,
      })),
    })),
    {
      role: 'user',
      content: prompt,
      attachments: attachments.map((a) => ({
        id: a.id,
        name: a.name,
        type: a.type,
        mimeType: a.mimeType,
        size: a.size,
        base64: a.base64,
        extractedText: a.extractedText,
        transcript: a.transcript,
      })),
    },
  ];

  // PRIMARY: Stream directly from Express Proxy (connected to Google Gemini live)
  try {
    const response = await fetch('http://localhost:3001/api/chat/stream', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages,
        model,
        maxTokens,
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
      let finishReason: string | undefined = undefined;
      let buffer = '';

      const processLine = (line: string) => {
        const trimmed = line.trim();
        if (!trimmed || trimmed === 'data: [DONE]') return;
        if (trimmed.startsWith('data: ')) {
          try {
            const data = JSON.parse(trimmed.slice(6));
            if (data.type === 'token' && data.token) {
              accumulated += data.token;
              onChunk(accumulated);
            } else if (data.type === 'reasoning' && data.token && onReasoning) {
              accumulatedReasoning += data.token;
              onReasoning(accumulatedReasoning);
            } else if (data.type === 'finish_reason' && data.finishReason) {
              finishReason = data.finishReason;
              if (onFinishReason) onFinishReason(data.finishReason);
            } else if (data.type === 'tool_call') {
              if (data.sources && Array.isArray(data.sources)) {
                accumulated +=
                  `\n\n🔍 *Sources Consulted:*\n` +
                  data.sources.map((s: any) => `- [${s.title}](${s.url}) (${s.domain})`).join('\n') +
                  `\n\n`;
                onChunk(accumulated);
              }
            } else if (data.type === 'done') {
              // stream complete
            } else if (data.type === 'error') {
              throw new Error(data.error || 'Server error during stream');
            }
          } catch (jsonErr: any) {
            if (jsonErr.message && !jsonErr.message.includes('JSON')) {
              throw jsonErr;
            }
          }
        }
      };

      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          if (buffer.trim()) {
            processLine(buffer);
            buffer = '';
          }
          break;
        }

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          processLine(line);
        }
      }

      if (accumulated.trim()) {
        return { content: accumulated, reasoning: accumulatedReasoning || undefined, finishReason };
      }
    } else if (!response.ok) {
      const errText = await response.text().catch(() => '');
      throw new Error(`Server returned HTTP ${response.status}: ${errText || response.statusText}`);
    }
  } catch (err: any) {
    if (err.name === 'AbortError' || err.message?.includes('aborted') || err.message?.includes('stopped')) {
      throw err;
    }
    console.warn('Express SSE proxy unavailable or error, checking fallback:', err);
    // If it was an explicit server error or network issue, rethrow so UI displays retryable error
    if (err.message && !err.message.includes('Failed to fetch')) {
      throw err;
    }
  }

  // SECONDARY FALLBACK: Dynamic mock engine with natural reasoning
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
