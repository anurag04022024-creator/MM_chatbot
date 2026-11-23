/**
 * Sandboxed Code Execution Runner for Browser & Backend
 * - HTML/JS: Sandboxed iframe with console redirection
 * - Python: Browser Pyodide with stdout/stderr capture
 * - Other: Backend /api/execute-code endpoint
 */

export interface ExecutionResult {
  success: boolean;
  stdout: string;
  stderr: string;
  plotUrl?: string;
  executionTimeMs: number;
}

let pyodideInstance: any = null;
let pyodideLoadingPromise: Promise<any> | null = null;

async function getPyodide(): Promise<any> {
  if (pyodideInstance) return pyodideInstance;
  if (pyodideLoadingPromise) return pyodideLoadingPromise;

  pyodideLoadingPromise = (async () => {
    // Inject script if not loaded
    if (!(window as any).loadPyodide) {
      await new Promise<void>((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/pyodide/v0.26.4/full/pyodide.js';
        script.onload = () => resolve();
        script.onerror = () => reject(new Error('Failed to load Pyodide from CDN'));
        document.head.appendChild(script);
      });
    }

    const py = await (window as any).loadPyodide({
      indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.26.4/full/',
    });
    pyodideInstance = py;
    return py;
  })();

  return pyodideLoadingPromise;
}

export async function runCode(language: string, code: string): Promise<ExecutionResult> {
  const cleanLang = language.toLowerCase();
  const startTime = performance.now();

  // --- Python Browser Execution via Pyodide ---
  if (cleanLang === 'python' || cleanLang === 'py') {
    try {
      const py = await getPyodide();

      let stdout = '';
      let stderr = '';

      py.setStdout({ batched: (msg: string) => { stdout += msg + '\n'; } });
      py.setStderr({ batched: (msg: string) => { stderr += msg + '\n'; } });

      // Run code in isolated namespace
      await py.runPythonAsync(code);

      return {
        success: true,
        stdout: stdout.trim() || '(Executed successfully with no stdout)',
        stderr: stderr.trim(),
        executionTimeMs: Math.round(performance.now() - startTime),
      };
    } catch (pyErr: any) {
      // If Pyodide CDN is blocked or fails, fall back to backend execution
      try {
        const res = await fetch('http://localhost:3001/api/execute-code', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ language: 'python', code }),
        });
        if (res.ok) {
          const data = await res.json();
          return data;
        }
      } catch {}

      return {
        success: false,
        stdout: '',
        stderr: pyErr.message || String(pyErr),
        executionTimeMs: Math.round(performance.now() - startTime),
      };
    }
  }

  // --- JavaScript / TypeScript / HTML Sandboxed Execution ---
  if (cleanLang === 'javascript' || cleanLang === 'js' || cleanLang === 'html') {
    return new Promise((resolve) => {
      const iframe = document.createElement('iframe');
      iframe.style.display = 'none';
      iframe.setAttribute('sandbox', 'allow-scripts');

      let logs: string[] = [];
      let errors: string[] = [];

      const handleMessage = (e: MessageEvent) => {
        if (e.data?.type === 'SANDBOX_LOG') {
          logs.push(e.data.message);
        } else if (e.data?.type === 'SANDBOX_ERROR') {
          errors.push(e.data.message);
        } else if (e.data?.type === 'SANDBOX_DONE') {
          cleanup();
          resolve({
            success: errors.length === 0,
            stdout: logs.join('\n') || '(Code executed with no console output)',
            stderr: errors.join('\n'),
            executionTimeMs: Math.round(performance.now() - startTime),
          });
        }
      };

      const cleanup = () => {
        window.removeEventListener('message', handleMessage);
        document.body.removeChild(iframe);
      };

      window.addEventListener('message', handleMessage);

      // Safe runner script inside iframe
      const runnerHtml = `
        <!DOCTYPE html>
        <html>
        <head><meta charset="utf-8" /></head>
        <body>
          <script>
            (function() {
              const post = (type, message) => {
                window.parent.postMessage({ type, message: String(message) }, '*');
              };
              console.log = (...args) => post('SANDBOX_LOG', args.map(a => typeof a === 'object' ? JSON.stringify(a, null, 2) : String(a)).join(' '));
              console.warn = (...args) => post('SANDBOX_LOG', '[warn] ' + args.join(' '));
              console.error = (...args) => post('SANDBOX_ERROR', args.join(' '));

              try {
                ${cleanLang === 'html' ? '' : code}
                post('SANDBOX_DONE', '');
              } catch(err) {
                post('SANDBOX_ERROR', err.message);
                post('SANDBOX_DONE', '');
              }
            })();
          </script>
          ${cleanLang === 'html' ? code : ''}
        </body>
        </html>
      `;

      document.body.appendChild(iframe);
      iframe.srcdoc = runnerHtml;

      // Timeout safety guard (5s)
      setTimeout(() => {
        cleanup();
        resolve({
          success: false,
          stdout: logs.join('\n'),
          stderr: 'Execution timed out after 5000ms',
          executionTimeMs: 5000,
        });
      }, 5000);
    });
  }

  // --- Other languages: Backend Sandbox ---
  try {
    const res = await fetch('http://localhost:3001/api/execute-code', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ language, code }),
    });
    if (res.ok) {
      return await res.json();
    }
  } catch {}

  return {
    success: false,
    stdout: '',
    stderr: `Language "${language}" execution is only available for Python and JavaScript in this runtime.`,
    executionTimeMs: Math.round(performance.now() - startTime),
  };
}
