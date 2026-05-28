const fs = require('fs');
const pdfParse = require('pdf-parse');

/**
 * Extracts text from a PDF file.
 * @param {string} filePath - The absolute path to the PDF file.
 * @returns {Promise<string>} - The extracted text content.
 */
const extractTextFromPDF = async (filePath) => {
  try {
    const dataBuffer = fs.readFileSync(filePath);
    const data = await pdfParse(dataBuffer);
    
    // Return extracted text, defaulting to empty string if parsed text is null
    return data.text || '';
  } catch (error) {
    throw new Error(`Failed to parse PDF: ${error.message}`);
  }
};

module.exports = {
  extractTextFromPDF,
};
