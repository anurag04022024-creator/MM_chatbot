import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');
const XLSX = require('xlsx');

/**
 * Robust document text extractor for PDFs, DOCX, XLSX/CSV, and plain code/text.
 */
export async function extractDocumentContent({ buffer, mimeType, filename = 'document' }) {
  const ext = (filename.split('.').pop() || '').toLowerCase();

  // 1. PDF Documents
  if (mimeType === 'application/pdf' || ext === 'pdf') {
    try {
      const data = await pdfParse(buffer);
      const text = (data.text || '').trim();
      const numPages = data.numpages || 1;

      // If PDF has no extractable text (e.g. scanned images), flag for vision model
      const isScanned = text.length < 40;
      return {
        text: isScanned ? '' : text,
        numPages,
        isScanned,
        info: data.info,
      };
    } catch (err) {
      console.warn(`[DocumentParser] pdf-parse error on ${filename}:`, err.message);
      return { text: '', isScanned: true, error: err.message };
    }
  }

  // 2. Word Documents (DOCX)
  if (
    mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    mimeType === 'application/msword' ||
    ext === 'docx' ||
    ext === 'doc'
  ) {
    try {
      const result = await mammoth.extractRawText({ buffer });
      return {
        text: result.value.trim(),
        warnings: result.messages,
        isScanned: false,
      };
    } catch (err) {
      console.warn(`[DocumentParser] mammoth error on ${filename}:`, err.message);
      return { text: '', isScanned: false, error: err.message };
    }
  }

  // 3. Excel Spreadsheets & CSV (XLSX, XLS, CSV)
  if (
    mimeType.includes('spreadsheet') ||
    mimeType.includes('excel') ||
    mimeType.includes('csv') ||
    ['xlsx', 'xls', 'csv'].includes(ext)
  ) {
    try {
      const workbook = XLSX.read(buffer, { type: 'buffer' });
      const sheetOutputs = [];

      for (const sheetName of workbook.SheetNames) {
        const sheet = workbook.Sheets[sheetName];
        const csvContent = XLSX.utils.sheet_to_csv(sheet);
        if (csvContent.trim()) {
          sheetOutputs.push(`### Sheet: ${sheetName}\n\`\`\`csv\n${csvContent.trim()}\n\`\`\``);
        }
      }

      return {
        text: sheetOutputs.join('\n\n'),
        isScanned: false,
      };
    } catch (err) {
      console.warn(`[DocumentParser] xlsx error on ${filename}:`, err.message);
      return { text: '', isScanned: false, error: err.message };
    }
  }

  // 4. Plain Text, Markdown, and Code files
  try {
    const text = buffer.toString('utf-8');
    return {
      text: text.trim(),
      isScanned: false,
    };
  } catch (err) {
    return { text: '', isScanned: false, error: err.message };
  }
}
