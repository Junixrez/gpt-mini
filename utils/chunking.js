/**
 * Chunking Utilities for RAG System
 * Supports multiple strategies: fixed-size, overlapping, and semantic
 */

/**
 * Fixed-size chunking - splits text into equal chunks
 * @param {string} text - Input text to chunk
 * @param {number} chunkSize - Characters per chunk
 * @returns {Array<{content: string, metadata: object}>}
 */
export const fixedSizeChunking = (text, chunkSize = 500) => {
  const chunks = [];
  let startChar = 0;

  while (startChar < text.length) {
    const endChar = Math.min(startChar + chunkSize, text.length);
    const content = text.slice(startChar, endChar);

    chunks.push({
      content: content.trim(),
      metadata: {
        startChar,
        endChar,
        tokenCount: estimateTokens(content),
      },
    });

    startChar = endChar;
  }

  return chunks;
};

/**
 * Overlapping chunking - chunks with overlap for better context
 * @param {string} text - Input text to chunk
 * @param {number} chunkSize - Characters per chunk
 * @param {number} overlap - Characters to overlap
 * @returns {Array<{content: string, metadata: object}>}
 */
export const overlappingChunking = (text, chunkSize = 500, overlap = 50) => {
  const chunks = [];
  let startChar = 0;

  while (startChar < text.length) {
    const endChar = Math.min(startChar + chunkSize, text.length);
    const content = text.slice(startChar, endChar);

    chunks.push({
      content: content.trim(),
      metadata: {
        startChar,
        endChar,
        tokenCount: estimateTokens(content),
      },
    });

    // Move forward by chunkSize - overlap
    startChar += chunkSize - overlap;

    // Prevent infinite loop if we're at the end
    if (endChar >= text.length) break;
  }

  return chunks;
};

/**
 * Semantic chunking - splits on natural boundaries (paragraphs, sentences)
 * @param {string} text - Input text to chunk
 * @param {number} targetSize - Target chunk size in characters
 * @returns {Array<{content: string, metadata: object}>}
 */
export const semanticChunking = (text, targetSize = 500) => {
  // Split into paragraphs first
  const paragraphs = text.split(/\n\n+/);
  const chunks = [];
  let currentChunk = "";
  let startChar = 0;

  for (const paragraph of paragraphs) {
    const trimmedPara = paragraph.trim();
    if (!trimmedPara) continue;

    // If adding this paragraph exceeds target, save current chunk
    if (currentChunk && currentChunk.length + trimmedPara.length > targetSize) {
      const endChar = startChar + currentChunk.length;
      chunks.push({
        content: currentChunk.trim(),
        metadata: {
          startChar,
          endChar,
          tokenCount: estimateTokens(currentChunk),
        },
      });
      startChar = endChar;
      currentChunk = "";
    }

    currentChunk += (currentChunk ? "\n\n" : "") + trimmedPara;

    // If current chunk is very large, split by sentences
    if (currentChunk.length > targetSize * 1.5) {
      const sentences = splitIntoSentences(currentChunk);
      let tempChunk = "";

      for (const sentence of sentences) {
        if (tempChunk.length + sentence.length > targetSize && tempChunk) {
          const endChar = startChar + tempChunk.length;
          chunks.push({
            content: tempChunk.trim(),
            metadata: {
              startChar,
              endChar,
              tokenCount: estimateTokens(tempChunk),
            },
          });
          startChar = endChar;
          tempChunk = sentence;
        } else {
          tempChunk += (tempChunk ? " " : "") + sentence;
        }
      }

      currentChunk = tempChunk;
    }
  }

  // Add remaining chunk
  if (currentChunk.trim()) {
    const endChar = startChar + currentChunk.length;
    chunks.push({
      content: currentChunk.trim(),
      metadata: {
        startChar,
        endChar,
        tokenCount: estimateTokens(currentChunk),
      },
    });
  }

  return chunks;
};

/**
 * Split text into sentences
 * @param {string} text - Input text
 * @returns {Array<string>}
 */
const splitIntoSentences = (text) => {
  // Simple sentence splitting on period, question mark, exclamation
  return text
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => s);
};

/**
 * Estimate token count (rough approximation: 1 token ≈ 4 characters)
 * @param {string} text - Input text
 * @returns {number}
 */
const estimateTokens = (text) => {
  return Math.ceil(text.length / 4);
};

/**
 * Main chunking function that routes to the appropriate strategy
 * @param {string} text - Input text to chunk
 * @param {string} strategy - Chunking strategy
 * @param {object} options - Strategy options
 * @returns {Array<{content: string, metadata: object}>}
 */
export const chunkText = (text, strategy = "overlapping", options = {}) => {
  const { chunkSize = 500, overlap = 50 } = options;

  switch (strategy) {
    case "fixed-size":
      return fixedSizeChunking(text, chunkSize);
    case "overlapping":
      return overlappingChunking(text, chunkSize, overlap);
    case "semantic":
      return semanticChunking(text, chunkSize);
    default:
      throw new Error(`Unknown chunking strategy: ${strategy}`);
  }
};
