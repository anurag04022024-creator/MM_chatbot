import { Attachment } from '../types/chat';
import { generateId } from './utils';

/**
 * Resizes images so the maximum dimension does not exceed maxDim (1568px).
 * Preserves aspect ratio, reduces payload size, and speeds up processing.
 */
export async function processImageFile(file: File): Promise<{ base64: string; url: string }> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const rawDataUrl = e.target?.result as string;
      const img = new Image();
      img.onload = () => {
        const MAX_DIM = 1568;
        let { width, height } = img;

        if (width > MAX_DIM || height > MAX_DIM) {
          if (width > height) {
            height = Math.round((height * MAX_DIM) / width);
            width = MAX_DIM;
          } else {
            width = Math.round((width * MAX_DIM) / height);
            height = MAX_DIM;
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            const resizedDataUrl = canvas.toDataURL(file.type || 'image/jpeg', 0.92);
            resolve({ base64: resizedDataUrl, url: resizedDataUrl });
            return;
          }
        }
        resolve({ base64: rawDataUrl, url: rawDataUrl });
      };
      img.onerror = () => resolve({ base64: rawDataUrl, url: rawDataUrl });
      img.src = rawDataUrl;
    };
    reader.readAsDataURL(file);
  });
}

/**
 * Reads any File or Blob as Base64 Data URL.
 */
export function readFileAsBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/**
 * Converts a raw File into a rich multimodal Attachment with base64 and auto-extracted data.
 */
export async function createAttachmentFromFile(file: File): Promise<Attachment> {
  const mime = file.type || '';
  const ext = (file.name.split('.').pop() || '').toLowerCase();

  let type: 'image' | 'audio' | 'document' = 'document';
  if (mime.startsWith('image/')) type = 'image';
  else if (mime.startsWith('audio/') || ['mp3', 'wav', 'm4a', 'ogg', 'webm'].includes(ext)) type = 'audio';

  let base64 = '';
  let url = '';

  if (type === 'image') {
    const processed = await processImageFile(file);
    base64 = processed.base64;
    url = processed.url;
  } else {
    base64 = await readFileAsBase64(file);
    url = URL.createObjectURL(file);
  }

  const attachment: Attachment = {
    id: generateId(),
    name: file.name,
    type,
    mimeType: file.type || (type === 'audio' ? 'audio/webm' : 'application/octet-stream'),
    size: file.size,
    url,
    base64,
    thumbnailUrl: type === 'image' ? url : undefined,
  };

  // If audio, trigger background transcription
  if (type === 'audio') {
    fetch('http://localhost:3001/api/transcribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ audio: base64, mimeType: attachment.mimeType }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.text) {
          attachment.transcript = data.text;
        }
      })
      .catch((err) => console.warn('[Audio Transcribe Error]:', err));
  }

  // If document (PDF, DOCX, XLSX, TXT), trigger pre-extraction
  if (type === 'document') {
    fetch('http://localhost:3001/api/documents/parse', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        file: base64,
        filename: file.name,
        mimeType: file.type,
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.text) {
          attachment.extractedText = data.text;
        }
      })
      .catch((err) => console.warn('[Doc Parse Error]:', err));
  }

  return attachment;
}
