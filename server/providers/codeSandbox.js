/**
 * Sandboxed Code Execution Runner
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';

const execAsync = promisify(exec);

export async function executeCode({ language = 'javascript', code }) {
  const startTime = Date.now();

  if (language === 'javascript' || language === 'js') {
    try {
      // Evaluate in a separate sub-process with 5s timeout
      const tmpFile = path.join(os.tmpdir(), `sandbox-${Date.now()}.mjs`);
      await fs.writeFile(tmpFile, code, 'utf-8');

      const { stdout, stderr } = await execAsync(`node "${tmpFile}"`, { timeout: 5000 });
      await fs.unlink(tmpFile).catch(() => {});

      return {
        success: true,
        stdout: stdout || '(No console output)',
        stderr: stderr || '',
        executionTimeMs: Date.now() - startTime,
      };
    } catch (err) {
      return {
        success: false,
        stdout: '',
        stderr: err.stderr || err.message,
        executionTimeMs: Date.now() - startTime,
      };
    }
  }

  if (language === 'python' || language === 'py') {
    try {
      const tmpFile = path.join(os.tmpdir(), `sandbox-${Date.now()}.py`);
      await fs.writeFile(tmpFile, code, 'utf-8');

      const pythonCmd = process.platform === 'win32' && await fs.access('C:\\Python314\\python.exe').then(() => true).catch(() => false)
        ? 'C:\\Python314\\python.exe'
        : 'python';

      const { stdout, stderr } = await execAsync(`"${pythonCmd}" "${tmpFile}"`, { timeout: 8000 });
      await fs.unlink(tmpFile).catch(() => {});

      return {
        success: true,
        stdout: stdout || '(Code ran with no stdout output)',
        stderr: stderr || '',
        executionTimeMs: Date.now() - startTime,
      };
    } catch (err) {
      return {
        success: false,
        stdout: '',
        stderr: err.stderr || err.message,
        executionTimeMs: Date.now() - startTime,
      };
    }
  }

  return {
    success: false,
    stdout: '',
    stderr: `Language ${language} execution requires Docker backend sandbox.`,
    executionTimeMs: Date.now() - startTime,
  };
}
