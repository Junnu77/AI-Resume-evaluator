const fs = require('fs');

// pdfjs-dist v4+ ships as ESM. We use the legacy CJS-compatible build.
// Dynamic import is required since the legacy build is an .mjs file.
let pdfjsLib = null;
const getPdfjsLib = async () => {
  if (!pdfjsLib) {
    pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.mjs');
  }
  return pdfjsLib;
};

/**
 * Extracts plain text from a PDF file using pdfjs-dist (legacy Node.js build).
 * This handles modern/complex PDFs that pdf-parse fails on (bad XRef entries, etc.)
 * @param {string} filePath - The absolute path to the PDF file.
 * @returns {Promise<string>} - The extracted text content.
 */
const extractTextFromPDF = async (filePath) => {
  try {
    const { getDocument } = await getPdfjsLib();

    const dataBuffer = fs.readFileSync(filePath);
    const data = new Uint8Array(dataBuffer);

    const doc = await getDocument({
      data,
      // Suppress font/worker warnings in Node
      verbosity: 0,
    }).promise;

    let text = '';
    for (let i = 1; i <= doc.numPages; i++) {
      const page = await doc.getPage(i);
      const content = await page.getTextContent();

      // Join items; insert space between words, newline between blocks
      const pageText = content.items
        .map(item => item.str)
        .join(' ');
      text += pageText + '\n';
    }

    return text.trim() || '';
  } catch (error) {
    throw new Error(`Failed to parse PDF: ${error.message}`);
  }
};

module.exports = {
  extractTextFromPDF,
};
