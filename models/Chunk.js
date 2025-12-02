import mongoose from "mongoose";

const chunkSchema = new mongoose.Schema(
  {
    documentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Document",
      required: true,
      index: true,
    },
    content: {
      type: String,
      required: true,
    },
    embedding: {
      type: [Number],
      required: true,
    },
    chunkIndex: {
      type: Number,
      required: true,
    },
    metadata: {
      startChar: Number,
      endChar: Number,
      tokenCount: Number,
    },
  },
  {
    timestamps: true,
  }
);

// Create index for vector similarity search
chunkSchema.index({ embedding: 1 });

const Chunk = mongoose.model("Chunk", chunkSchema);

export default Chunk;
