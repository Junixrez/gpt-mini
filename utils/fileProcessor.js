import fs from "fs/promises";
import mammoth from "mammoth";
import { createRequire } from "module";

// pdf-parse is CommonJS, so we need to use require
const require = createRequire(import.meta.url);
const pdfParse = require("pdf-parse");

/**
 * Extract text from uploaded file based on file type
 * @param {string} filePath - Path to uploaded file
 * @param {string} fileType - MIME type of the file
 * @returns {Promise<string>} - Extracted text content
 */
export const extractTextFromFile = async (filePath, fileType) => {
  try {
    // Handle PDF files
    if (fileType === "application/pdf") {
      const dataBuffer = await fs.readFile(filePath);
      const pdfData = await pdfParse(dataBuffer);
      return pdfData.text;
    }

    // Handle DOCX files
    if (
      fileType ===
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
      filePath.endsWith(".docx")
    ) {
      const result = await mammoth.extractRawText({ path: filePath });
      return result.value;
    }

    // Handle plain text files
    if (fileType === "text/plain" || filePath.endsWith(".txt")) {
      return await fs.readFile(filePath, "utf-8");
    }

    // Handle markdown files
    if (fileType === "text/markdown" || filePath.endsWith(".md")) {
      return await fs.readFile(filePath, "utf-8");
    }

    throw new Error(`Unsupported file type: ${fileType}`);
  } catch (error) {
    console.error("Error extracting text from file:", error);
    throw error;
  }
};

/**
 * Clean and normalize extracted text
 * @param {string} text - Raw extracted text
 * @returns {string} - Cleaned text
 */
export const cleanText = (text) => {
  return (
    text
      // Remove excessive whitespace
      .replace(/\s+/g, " ")
      // Remove excessive newlines (keep paragraph breaks)
      .replace(/\n{3,}/g, "\n\n")
      // Trim
      .trim()
  );
};
