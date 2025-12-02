import OpenAI from "openai";
import dotenv from "dotenv";

dotenv.config();

const client = new OpenAI({
  apiKey: process.env.VITE_OPENAI_API_KEY,
});

/**
 * Generate embeddings for a single text
 * @param {string} text - Text to embed
 * @returns {Promise<Array<number>>} - Embedding vector
 */
export const generateEmbedding = async (text) => {
  try {
    const response = await client.embeddings.create({
      model: "text-embedding-3-small",
      input: text,
      encoding_format: "float",
    });

    return response.data[0].embedding;
  } catch (error) {
    console.error("Error generating embedding:", error);
    throw error;
  }
};

/**
 * Generate embeddings for multiple texts in batch
 * @param {Array<string>} texts - Array of texts to embed
 * @returns {Promise<Array<Array<number>>>} - Array of embedding vectors
 */
export const generateEmbeddingsBatch = async (texts) => {
  try {
    // OpenAI supports batch processing up to 2048 inputs
    const batchSize = 100;
    const allEmbeddings = [];

    for (let i = 0; i < texts.length; i += batchSize) {
      const batch = texts.slice(i, i + batchSize);

      const response = await client.embeddings.create({
        model: "text-embedding-3-small",
        input: batch,
        encoding_format: "float",
      });

      const embeddings = response.data.map((item) => item.embedding);
      allEmbeddings.push(...embeddings);

      console.log(
        `✅ Generated embeddings for batch ${Math.floor(i / batchSize) + 1}`
      );
    }

    return allEmbeddings;
  } catch (error) {
    console.error("Error generating embeddings batch:", error);
    throw error;
  }
};

/**
 * Calculate cosine similarity between two vectors
 * @param {Array<number>} vecA - First vector
 * @param {Array<number>} vecB - Second vector
 * @returns {number} - Similarity score between -1 and 1
 */
export const cosineSimilarity = (vecA, vecB) => {
  if (vecA.length !== vecB.length) {
    throw new Error("Vectors must have the same length");
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }

  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
};

/**
 * Find most similar chunks to a query embedding
 * @param {Array<number>} queryEmbedding - Query vector
 * @param {Array<{embedding: Array<number>, content: string}>} chunks - Chunks with embeddings
 * @param {number} topK - Number of top results to return
 * @returns {Array<{content: string, similarity: number}>}
 */
export const findSimilarChunks = (queryEmbedding, chunks, topK = 5) => {
  const similarities = chunks.map((chunk) => ({
    ...chunk,
    similarity: cosineSimilarity(queryEmbedding, chunk.embedding),
  }));

  // Sort by similarity descending and return top K
  return similarities
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, topK);
};
