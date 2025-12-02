# MiniGPT v2 - RAG System Documentation

## 🚀 New Features in v2

MiniGPT v2 introduces a powerful **Retrieval-Augmented Generation (RAG)** system that allows you to chat with your documents using AI.

### Key Features

1. **📤 File Upload** - Upload PDF, TXT, MD, and DOCX files
2. **📊 Smart Chunking** - Three chunking strategies:
   - **Fixed-size**: Equal-sized chunks
   - **Overlapping**: Chunks with overlap for better context
   - **Semantic**: Intelligent splitting at paragraph/sentence boundaries
3. **🔮 Embeddings** - OpenAI's `text-embedding-3-small` model for vector embeddings
4. **🎯 RAG Chat** - Context-aware responses using vector similarity search
5. **💾 MongoDB** - Persistent storage with Mongoose for documents and chunks

---

## 📂 Project Structure

```
chatgpt-clone/
├── config/
│   └── database.js          # MongoDB connection setup
├── models/
│   ├── Document.js          # Document schema (metadata, content)
│   └── Chunk.js             # Chunk schema (with embeddings)
├── utils/
│   ├── chunking.js          # Chunking strategies
│   ├── embeddings.js        # OpenAI embeddings + similarity search
│   └── fileProcessor.js     # File text extraction (PDF, DOCX, TXT)
├── api/
│   ├── rag.js               # Document upload & management routes
│   └── ragChat.js           # RAG chat endpoint
├── src/
│   └── components/
│       └── RAGMode.jsx      # RAG UI component
└── server.js                # Express server with all routes
```

---

## 🔧 Architecture

### 1. Document Upload & Processing Pipeline

```
User uploads file
    ↓
Multer saves to /uploads
    ↓
Extract text (PDF/DOCX/TXT)
    ↓
Clean & normalize text
    ↓
Apply chunking strategy
    ↓
Generate embeddings for each chunk
    ↓
Save to MongoDB
    ↓
Delete uploaded file
```

### 2. RAG Chat Flow

```
User asks question
    ↓
Generate query embedding
    ↓
Retrieve chunks from MongoDB
    ↓
Calculate cosine similarity
    ↓
Select top-K most relevant chunks
    ↓
Inject context into GPT-4o prompt
    ↓
Generate context-aware response
```

---

## 📚 Chunking Strategies

### Fixed-Size Chunking

- **Use case**: Simple, predictable chunks
- **How it works**: Splits text into equal-sized chunks (default: 500 chars)
- **Pros**: Fast, consistent chunk sizes
- **Cons**: May split mid-sentence

### Overlapping Chunking (Default)

- **Use case**: Best for general documents
- **How it works**: Chunks with overlap (default: 500 chars, 50 overlap)
- **Pros**: Preserves context across boundaries
- **Cons**: Some redundancy

### Semantic Chunking

- **Use case**: Documents with clear structure
- **How it works**: Splits at paragraph/sentence boundaries
- **Pros**: Natural, meaningful chunks
- **Cons**: Variable chunk sizes

---

## 🗄️ Database Schema

### Document Model

```javascript
{
  filename: String,           // Stored filename
  originalName: String,       // Original upload name
  fileType: String,          // MIME type
  fileSize: Number,          // Bytes
  content: String,           // Full extracted text
  chunkStrategy: String,     // 'fixed-size' | 'overlapping' | 'semantic'
  chunkSize: Number,         // Characters per chunk
  chunkOverlap: Number,      // Overlap for overlapping strategy
  totalChunks: Number,       // Total chunks created
  status: String,            // 'uploading' | 'processing' | 'ready' | 'error'
  errorMessage: String,      // If status is 'error'
  createdAt: Date,
  updatedAt: Date
}
```

### Chunk Model

```javascript
{
  documentId: ObjectId,      // Reference to Document
  content: String,           // Chunk text
  embedding: [Number],       // 1536-dim vector from OpenAI
  chunkIndex: Number,        // Position in document
  metadata: {
    startChar: Number,       // Start position in original text
    endChar: Number,         // End position
    tokenCount: Number       // Estimated tokens
  },
  createdAt: Date,
  updatedAt: Date
}
```

---

## 🔌 API Endpoints

### Document Management

#### Upload Document

```http
POST /api/rag/upload
Content-Type: multipart/form-data

file: <file>
chunkStrategy: "overlapping" | "fixed-size" | "semantic"
chunkSize: 500
chunkOverlap: 50
```

**Response:**

```json
{
  "message": "File uploaded successfully. Processing in background.",
  "documentId": "507f1f77bcf86cd799439011",
  "status": "processing"
}
```

#### Get All Documents

```http
GET /api/rag/documents
```

**Response:**

```json
{
  "documents": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "originalName": "report.pdf",
      "fileType": "application/pdf",
      "fileSize": 245678,
      "status": "ready",
      "totalChunks": 42,
      "createdAt": "2025-12-02T10:30:00Z"
    }
  ]
}
```

#### Get Single Document

```http
GET /api/rag/documents/:id
```

**Response:**

```json
{
  "document": {
    /* document object */
  },
  "chunks": [
    {
      "content": "Chunk text...",
      "chunkIndex": 0,
      "metadata": {
        "startChar": 0,
        "endChar": 500,
        "tokenCount": 125
      }
    }
  ]
}
```

#### Delete Document

```http
DELETE /api/rag/documents/:id
```

### RAG Chat

#### Chat with Documents

```http
POST /api/rag-chat
Content-Type: application/json

{
  "prompt": "What is the main topic of the document?",
  "documentIds": ["507f1f77bcf86cd799439011"],  // Optional, uses all if empty
  "topK": 5,                                     // Number of chunks to retrieve
  "history": [                                   // Conversation history
    {
      "role": "user",
      "content": "Previous question"
    },
    {
      "role": "assistant",
      "content": "Previous answer"
    }
  ]
}
```

**Response:**

```json
{
  "content": "Based on the provided context...",
  "metadata": {
    "chunksRetrieved": 5,
    "topSimilarity": 0.8534,
    "documentsUsed": 1,
    "sources": [
      {
        "index": 1,
        "similarity": 0.8534,
        "preview": "This section discusses..."
      }
    ]
  }
}
```

---

## 🧮 Vector Similarity Search

The RAG system uses **cosine similarity** to find relevant chunks:

```
similarity = (A · B) / (||A|| × ||B||)
```

Where:

- `A` = Query embedding vector (1536 dimensions)
- `B` = Chunk embedding vector (1536 dimensions)
- Result ranges from -1 (opposite) to 1 (identical)

Top-K chunks with highest similarity are used as context.

---

## 🎨 Frontend Components

### RAGMode Component

**Features:**

- **Sidebar**: Document library with upload, delete, selection
- **Main Area**: Chat interface with context-aware responses
- **Status Indicators**: Real-time processing status
- **Strategy Selector**: Choose chunking strategy before upload
- **Source Citations**: Shows which chunks were used for answers

**State Management:**

- Messages persist across mode switches (lifted to App.jsx)
- Document list auto-refreshes after uploads
- Selected documents highlighted in sidebar

---

## 🔒 Security & Best Practices

1. **File Size Limit**: 10MB per file
2. **Allowed Types**: Only PDF, TXT, MD, DOCX
3. **Temp Files**: Deleted after processing
4. **Environment Variables**: MongoDB URI and OpenAI key in `.env`
5. **Error Handling**: Comprehensive try-catch blocks
6. **Uploads Folder**: Added to `.gitignore`

---

## 🚀 Usage Examples

### Upload a Document

1. Click "Upload Document" in RAG mode
2. Select chunking strategy (default: Overlapping)
3. Choose file (PDF, TXT, DOCX, MD)
4. Wait for processing (status shows in sidebar)

### Chat with Documents

1. Select documents from sidebar (or use all)
2. Type your question in the input field
3. Receive context-aware response with source citations
4. Continue conversation with history

### Manage Documents

- **Delete**: Click trash icon on document card
- **View Details**: Click on document to select
- **Check Status**: Green checkmark = ready, spinner = processing

---

## 🔄 Workflow Tips

1. **Upload multiple documents** for comprehensive knowledge base
2. **Use semantic chunking** for structured documents (reports, articles)
3. **Use overlapping chunking** for general-purpose documents
4. **Select specific documents** for focused queries
5. **Check similarity scores** in metadata to gauge answer quality

---

## 📊 Performance Considerations

- **Embedding Generation**: ~100 chunks per batch
- **Similarity Search**: In-memory cosine calculation
- **MongoDB**: Indexed on `documentId` and `embedding`
- **Async Processing**: Upload returns immediately, processes in background

---

## 🐛 Troubleshooting

### "No documents available"

- Upload at least one document
- Wait for processing to complete (status: "ready")

### "Processing stuck"

- Check MongoDB connection
- Verify OpenAI API key in `.env`
- Check server logs for errors

### "Low similarity scores"

- Document may not contain relevant information
- Try different phrasing
- Upload more relevant documents

---

## 📝 Environment Variables Required

```bash
# .env file
VITE_OPENAI_API_KEY=sk-...
MONGO_URI=mongodb+srv://...
PORT=3001  # Optional
VITE_API_URL=http://localhost:3001  # Optional
```

---

## 🎯 Future Enhancements

- [ ] Vector database (Pinecone, Weaviate) for large-scale deployments
- [ ] Multi-modal support (images, audio)
- [ ] Advanced filtering (by date, document type)
- [ ] Export chat history
- [ ] Document summarization
- [ ] Keyword highlighting in sources

---

Built with ❤️ using React, Express, MongoDB, and OpenAI
