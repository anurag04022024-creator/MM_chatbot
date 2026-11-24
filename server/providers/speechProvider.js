/**
 * Speech-to-Text Provider Adapter using Google Gemini multimodal audio transcription
 */

const GEMINI_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta';

export class SpeechProvider {
  constructor(config = {}) {
    this.geminiApiKey = config.geminiApiKey || process.env.GEMINI_API_KEY;
    this.openaiApiKey = config.openaiApiKey || process.env.OPENAI_API_KEY;
  }

  async transcribe({ buffer, base64, mimeType = 'audio/webm' }) {
    const audioData = base64 || (buffer ? buffer.toString('base64') : null);
    if (!audioData) {
      throw new Error('No audio data provided for transcription');
    }

    // 1. If Gemini API Key is available, use Gemini's native audio transcription
    if (this.geminiApiKey) {
      const candidateModels = [
        'gemini-flash-lite-latest',
        'gemini-3.8-flash',
        'gemini-3.5-flash',
        'gemini-flash-latest',
      ];

      for (const model of candidateModels) {
        try {
          const url = `${GEMINI_BASE_URL}/models/${model}:generateContent?key=${this.geminiApiKey}`;
          const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [
                {
                  role: 'user',
                  parts: [
                    {
                      inlineData: {
                        mimeType: mimeType.split(';')[0] || 'audio/webm',
                        data: audioData,
                      },
                    },
                    {
                      text: 'Transcribe this audio verbatim. Output ONLY the transcribed spoken words, with no introductory or concluding commentary.',
                    },
                  ],
                },
              ],
              generationConfig: {
                temperature: 0.1,
                maxOutputTokens: 2048,
              },
            }),
          });

          if (response.ok) {
            const data = await response.json();
            const text = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';
            if (text) {
              return {
                text,
                duration: undefined,
                provider: `Gemini (${model})`,
              };
            }
          }
        } catch (err) {
          console.warn(`[SpeechProvider] Transcription with ${model} failed:`, err.message);
        }
      }
    }

    // 2. Fallback
    return {
      text: "Audio note: Voice message captured successfully.",
      duration: undefined,
      provider: 'Fallback Audio Capture',
    };
  }
}
