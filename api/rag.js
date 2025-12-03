import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs/promises";
import Document from "../models/Document.js";
import Chunk from "../models/Chunk.js";
import { extractTextFromFile, cleanText } from "../utils/fileProcessor.js";
import { chunkText } from "../utils/chunking.js";
import { generateEmbeddingsBatch } from "../utils/embeddings.js";
import { sendFileToN8N } from "../services/n8nService.js";

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = "uploads/";
    try {
      await fs.mkdir(uploadDir, { recursive: true });
      cb(null, uploadDir);
    } catch (error) {
      cb(error);
    }
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + "-" + file.originalname);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      "application/pdf",
      "text/plain",
      "text/markdown",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];

    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(
        new Error(
          "Invalid file type. Only PDF, TXT, MD, and DOCX files are allowed."
        )
      );
    }
  },
});

// Upload and process document
router.post("/upload", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const {
      chunkStrategy = "overlapping",
      chunkSize = 500,
      chunkOverlap = 50,
    } = req.body;

    // Create document record
    const document = await Document.create({
      filename: req.file.filename,
      originalName: req.file.originalname,
      fileType: req.file.mimetype,
      fileSize: req.file.size,
      content: "", // Will be updated after extraction
      chunkStrategy,
      chunkSize: parseInt(chunkSize),
      chunkOverlap: parseInt(chunkOverlap),
      status: "processing",
    });

    // Send file to n8n webhook (non-blocking)
    sendFileToN8N({
      filePath: req.file.path,
      filename: req.file.originalname,
      fileType: req.file.mimetype,
      fileSize: req.file.size,
      documentId: document._id.toString(),
      uploadedBy: req.body.uploadedBy || "anonymous",
    }).catch((error) => {
      console.error("n8n webhook error (non-blocking):", error.message);
    });

    // Process file asynchronously
    processDocument(document._id, req.file.path, req.file.mimetype, {
      chunkStrategy,
      chunkSize: parseInt(chunkSize),
      chunkOverlap: parseInt(chunkOverlap),
    }).catch((error) => {
      console.error("Error processing document:", error);
    });

    res.json({
      message: "File uploaded successfully. Processing in background.",
      documentId: document._id,
      status: document.status,
    });
  } catch (error) {
    console.error("Upload error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Background processing function
async function processDocument(documentId, filePath, fileType, options) {
  try {
    // Extract text from file
    const rawText = await extractTextFromFile(filePath, fileType);
    const cleanedText = cleanText(rawText);

    // Update document with extracted content
    await Document.findByIdAndUpdate(documentId, {
      content: cleanedText,
    });

    // Chunk the text
    const chunks = chunkText(cleanedText, options.chunkStrategy, {
      chunkSize: options.chunkSize,
      overlap: options.chunkOverlap,
    });

    console.log(
      `📄 Created ${chunks.length} chunks for document ${documentId}`
    );

    // Generate embeddings for all chunks
    const chunkTexts = chunks.map((chunk) => chunk.content);
    const embeddings = await generateEmbeddingsBatch(chunkTexts);

    // Save chunks to database
    const chunkDocs = chunks.map((chunk, index) => ({
      documentId,
      content: chunk.content,
      embedding: embeddings[index],
      chunkIndex: index,
      metadata: chunk.metadata,
    }));

    await Chunk.insertMany(chunkDocs);

    // Update document status
    await Document.findByIdAndUpdate(documentId, {
      totalChunks: chunks.length,
      status: "ready",
    });

    // Clean up uploaded file
    await fs.unlink(filePath);

    console.log(`✅ Document ${documentId} processed successfully`);
  } catch (error) {
    console.error(`Error processing document ${documentId}:`, error);

    await Document.findByIdAndUpdate(documentId, {
      status: "error",
      errorMessage: error.message,
    });
  }
}

// Get all documents
router.get("/documents", async (req, res) => {
  try {
    const documents = await Document.find()
      .select("-content") // Exclude large content field
      .sort({ createdAt: -1 });

    res.json({ documents });
  } catch (error) {
    console.error("Error fetching documents:", error);
    res.status(500).json({ error: error.message });
  }
});

// Get single document with its chunks
router.get("/documents/:id", async (req, res) => {
  try {
    const document = await Document.findById(req.params.id);

    if (!document) {
      return res.status(404).json({ error: "Document not found" });
    }

    const chunks = await Chunk.find({ documentId: req.params.id })
      .select("-embedding") // Exclude large embedding arrays
      .sort({ chunkIndex: 1 });

    res.json({ document, chunks });
  } catch (error) {
    console.error("Error fetching document:", error);
    res.status(500).json({ error: error.message });
  }
});

// Delete document and its chunks
router.delete("/documents/:id", async (req, res) => {
  try {
    const document = await Document.findById(req.params.id);

    if (!document) {
      return res.status(404).json({ error: "Document not found" });
    }

    // Delete all chunks
    await Chunk.deleteMany({ documentId: req.params.id });

    // Delete document
    await Document.findByIdAndDelete(req.params.id);

    res.json({ message: "Document deleted successfully" });
  } catch (error) {
    console.error("Error deleting document:", error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
