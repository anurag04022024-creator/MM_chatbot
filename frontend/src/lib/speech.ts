// Web Speech API interface definitions for TypeScript
interface IWindow extends Window {
  SpeechRecognition?: any;
  webkitSpeechRecognition?: any;
}

export function isSpeechRecognitionSupported(): boolean {
  if (typeof window === 'undefined') return false;
  const win = window as unknown as IWindow;
  return Boolean(win.SpeechRecognition || win.webkitSpeechRecognition);
}

export function createSpeechRecognition(
  onResult: (transcript: string) => void,
  onError: (error: string) => void,
  onEnd: () => void
): any {
  if (typeof window === 'undefined') return null;
  const win = window as unknown as IWindow;
  const SpeechClass = win.SpeechRecognition || win.webkitSpeechRecognition;

  if (!SpeechClass) {
    onError('Speech recognition is not supported in this browser.');
    return null;
  }

  const recognition = new SpeechClass();
  recognition.continuous = true;
  recognition.interimResults = true;
  recognition.lang = 'en-US';

  recognition.onresult = (event: any) => {
    let current = '';
    for (let i = event.resultIndex; i < event.results.length; ++i) {
      current += event.results[i][0].transcript;
    }
    onResult(current);
  };

  recognition.onerror = (event: any) => {
    onError(event.error || 'Speech recognition error');
  };

  recognition.onend = () => {
    onEnd();
  };

  return recognition;
}
