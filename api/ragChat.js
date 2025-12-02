import express from "express";
import OpenAI from "openai";
import dotenv from "dotenv";
import Chunk from "../models/Chunk.js";
import Document from "../models/Document.js";
import { generateEmbedding, findSimilarChunks } from "../utils/embeddings.js";

dotenv.config();

const router = express.Router();
const client = new OpenAI({
  apiKey: process.env.VITE_OPENAI_API_KEY,
});

/**
 * RAG Chat endpoint - retrieves relevant context and generates response
 */
router.post("/", async (req, res) => {
  try {
    const { prompt, documentIds = [], topK = 5, history = [] } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: "Prompt is required" });
    }

    // If no documents specified, use all available documents
    let targetDocumentIds = documentIds;
    if (!documentIds || documentIds.length === 0) {
      const allDocs = await Document.find({ status: "ready" }).select("_id");
      targetDocumentIds = allDocs.map((doc) => doc._id.toString());
    }

    if (targetDocumentIds.length === 0) {
      return res.status(400).json({
        error: "No documents available. Please upload documents first.",
      });
    }

    // Generate embedding for the user's query
    console.log("🔍 Generating query embedding...");
    const queryEmbedding = await generateEmbedding(prompt);

    // Retrieve relevant chunks from specified documents
    console.log("📚 Retrieving relevant chunks...");
    const chunks = await Chunk.find({
      documentId: { $in: targetDocumentIds },
    }).lean();

    if (chunks.length === 0) {
      return res.status(400).json({
        error: "No chunks found for the specified documents.",
      });
    }

    // Find most similar chunks
    const similarChunks = findSimilarChunks(queryEmbedding, chunks, topK);

    console.log(
      `✅ Found ${
        similarChunks.length
      } relevant chunks (top similarity: ${similarChunks[0]?.similarity.toFixed(
        4
      )})`
    );

    // Build context from retrieved chunks
    const context = similarChunks
      .map((chunk, idx) => `[Context ${idx + 1}]:\n${chunk.content}`)
      .join("\n\n");

    // Create system prompt with RAG context
    const systemPrompt = `You are a helpful AI assistant with access to document context. Use the provided context to answer the user's question accurately and comprehensively.

Context from documents:
${context}

Instructions:
- Answer based primarily on the provided context
- If the context doesn't contain enough information, say so clearly
- Cite which context section you're using when relevant
- Keep your answers clear and well-structured
- Use markdown formatting for better readability`;

    // Build messages for OpenAI
    const messages = [
      { role: "system", content: systemPrompt },
      ...history,
      { role: "user", content: prompt },
    ];

    // Generate response with GPT-4o
    console.log("🤖 Generating response...");
    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: messages,
      temperature: 0.7,
    });

    const responseContent = completion.choices[0].message.content;

    // Return response with metadata
    res.json({
      content: responseContent,
      metadata: {
        chunksRetrieved: similarChunks.length,
        topSimilarity: similarChunks[0]?.similarity,
        documentsUsed: targetDocumentIds.length,
        sources: similarChunks.map((chunk, idx) => ({
          index: idx + 1,
          similarity: chunk.similarity,
          preview: chunk.content.substring(0, 100) + "...",
        })),
      },
    });
  } catch (error) {
    console.error("RAG Chat Error:", error);
    res.status(500).json({
      error: error.message || "An error occurred while processing your request",
    });
  }
});

export default router;
