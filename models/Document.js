import mongoose from "mongoose";

const documentSchema = new mongoose.Schema(
  {
    filename: {
      type: String,
      required: true,
    },
    originalName: {
      type: String,
      required: true,
    },
    fileType: {
      type: String,
      required: true,
    },
    fileSize: {
      type: Number,
      required: true,
    },
    content: {
      type: String,
      required: false,
      default: "",
    },
    chunkStrategy: {
      type: String,
      enum: ["fixed-size", "overlapping", "semantic"],
      default: "overlapping",
    },
    chunkSize: {
      type: Number,
      default: 500,
    },
    chunkOverlap: {
      type: Number,
      default: 50,
    },
    totalChunks: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ["uploading", "processing", "ready", "error"],
      default: "uploading",
    },
    errorMessage: String,
  },
  {
    timestamps: true,
  }
);

const Document = mongoose.model("Document", documentSchema);

export default Document;
