# MiniGPT v2 - AI-Powered Assistant with RAG

A modern, full-featured AI assistant built with React, Express, MongoDB, and OpenAI. Features multiple modes including conversational chat, image generation, creative writing, and **RAG (Retrieval-Augmented Generation)** for chatting with your documents.

![MiniGPT v2](https://img.shields.io/badge/version-2.0-blue)
![React](https://img.shields.io/badge/react-19.2.0-61dafb)
![Node](https://img.shields.io/badge/node-express-green)
![MongoDB](https://img.shields.io/badge/database-mongodb-47A248)

---

## ✨ Features

### 🤖 Chat Mode

- Conversational AI powered by GPT-4o Mini
- Message history with markdown support
- Real-time streaming responses

### 📚 RAG Mode (NEW in v2!)

- **Upload documents** (PDF, TXT, DOCX, MD)
- **Smart chunking** with 3 strategies (fixed-size, overlapping, semantic)
- **Vector embeddings** using OpenAI's text-embedding-3-small
- **Semantic search** with cosine similarity
- **Context-aware chat** that references your documents
- **MongoDB storage** for persistent document library

### 🎨 Image Mode

- Generate images using DALL-E 3
- High-quality 1024x1024 outputs
- Download generated images

### ✨ Creative Mode

- Long-form content generation with GPT-4o
- Stories, poems, articles, and more
- Beautiful prose formatting

---

## 🚀 Quick Start

### Prerequisites

- Node.js (v18+)
- MongoDB (local or Atlas)
- OpenAI API key

### Installation

1. **Clone the repository**

```bash
git clone <your-repo-url>
cd chatgpt-clone
```

2. **Install dependencies**

```bash
npm install
```

3. **Configure environment variables**

Create a `.env` file in the root directory:

```env
VITE_OPENAI_API_KEY=sk-your-openai-api-key
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/
PORT=3001
VITE_API_URL=http://localhost:3001
```

4. **Start the development server**

Run both frontend and backend concurrently:

```bash
npm run dev:all
```

Or run separately:

```bash
# Terminal 1 - Backend
npm run server

# Terminal 2 - Frontend
npm run dev
```

5. **Open your browser**

```
http://localhost:5173
```

---

## 📁 Project Structure

```
chatgpt-clone/
├── config/
│   └── database.js           # MongoDB connection
├── models/
│   ├── Document.js           # Document schema
│   └── Chunk.js              # Chunk schema with embeddings
├── utils/
│   ├── chunking.js           # Chunking strategies
│   ├── embeddings.js         # OpenAI embeddings & similarity
│   └── fileProcessor.js      # File extraction (PDF, DOCX)
├── api/
│   ├── rag.js                # Document upload & management
│   └── ragChat.js            # RAG chat endpoint
├── src/
│   ├── components/
│   │   ├── ChatMode.jsx      # Conversational chat
│   │   ├── RAGMode.jsx       # Document chat (NEW!)
│   │   ├── ImageMode.jsx     # Image generation
│   │   ├── CreativeMode.jsx  # Creative writing
│   │   └── ModeSwitcher.jsx  # Mode navigation
│   ├── App.jsx               # Main app component
│   └── api.js                # Frontend API client
├── server.js                 # Express server
└── package.json
```

---

## 🎯 RAG System Overview

### How It Works

1. **Upload Documents** → Files are parsed (PDF/DOCX/TXT/MD)
2. **Text Extraction** → Clean and normalize content
3. **Chunking** → Split into manageable pieces (500 chars, 50 overlap)
4. **Embeddings** → Generate 1536-dim vectors using OpenAI
5. **Storage** → Save to MongoDB with metadata
6. **Query** → User asks question
7. **Retrieval** → Find top-K similar chunks via cosine similarity
8. **Generation** → Inject context into GPT-4o prompt
9. **Response** → Context-aware answer with source citations

### Chunking Strategies

- **Fixed-size**: Equal chunks, fast and predictable
- **Overlapping** (default): Chunks with overlap for better context
- **Semantic**: Intelligent splitting at paragraph/sentence boundaries

### Tech Stack

- **Embeddings**: OpenAI text-embedding-3-small (1536 dimensions)
- **Database**: MongoDB with Mongoose ODM
- **File Upload**: Multer with PDF/DOCX parsing
- **Similarity**: Cosine similarity for vector search

📖 **[Full RAG Documentation](./RAG_DOCUMENTATION.md)**

---

## 🛠️ Tech Stack

### Frontend

- **React 19.2.0** - UI library
- **Vite 7.2.4** - Build tool
- **TailwindCSS 4.1.17** - Styling
- **Lucide React** - Icons
- **React Markdown** - Markdown rendering

### Backend

- **Express 5.1.0** - Web framework
- **MongoDB + Mongoose 9.0.0** - Database
- **OpenAI SDK 6.9.1** - AI integration
- **Multer** - File uploads
- **pdf-parse** - PDF extraction
- **mammoth** - DOCX extraction

---

## 📚 API Reference

### Chat Endpoints

#### Standard Chat

```http
POST /api/chat
Content-Type: application/json

{
  "mode": "chat" | "creative",
  "prompt": "Your message",
  "history": [...]
}
```

#### RAG Chat

```http
POST /api/rag-chat
Content-Type: application/json

{
  "prompt": "Question about documents",
  "documentIds": ["id1", "id2"],  // Optional
  "topK": 5,
  "history": [...]
}
```

#### Image Generation

```http
POST /api/image
Content-Type: application/json

{
  "prompt": "A beautiful landscape"
}
```

### Document Management

```http
POST   /api/rag/upload        # Upload document
GET    /api/rag/documents     # List all documents
GET    /api/rag/documents/:id # Get document details
DELETE /api/rag/documents/:id # Delete document
```

---

## 🎨 Features Breakdown

### Persistent State Management

- Chat history persists across mode switches
- Creative content saved when switching modes
- RAG conversation history maintained

### Responsive Design

- Mobile-optimized layouts
- Adaptive breakpoints (sm, md, lg)
- Touch-friendly UI elements

### Modern UI/UX

- Glass morphism effects
- Smooth animations
- Gradient backgrounds
- Loading states
- Error handling

---

## 🔒 Security

- ✅ API key stored server-side only
- ✅ `.env` file in `.gitignore`
- ✅ File upload validation (type + size limits)
- ✅ Uploaded files deleted after processing
- ✅ CORS enabled for cross-origin requests
- ✅ Environment variable isolation

---

## 📊 Performance

- **Embeddings**: Batch processing (100 chunks at a time)
- **File Size Limit**: 10MB per upload
- **Chunk Size**: 500 characters (configurable)
- **Top-K Retrieval**: 5 most relevant chunks
- **Async Processing**: Background document processing

---

## 🐛 Known Issues & Solutions

### MongoDB Connection

Ensure your `MONGO_URI` is correct and network access is allowed in MongoDB Atlas.

### Large Files

Files over 10MB will be rejected. Split them or increase the limit in `api/rag.js`.

### Slow Embedding Generation

This is normal for large documents. Processing happens in background.

---

## 🚧 Roadmap

- [ ] Vector database integration (Pinecone, Weaviate)
- [ ] Multi-modal RAG (images, audio)
- [ ] Chat history export
- [ ] Document summarization
- [ ] Advanced search filters
- [ ] User authentication
- [ ] Conversation sharing

---

## 📝 Scripts

```bash
npm run dev        # Start frontend only (Vite)
npm run server     # Start backend only (Express)
npm run dev:all    # Start both concurrently
npm run build      # Build for production
npm run preview    # Preview production build
npm run lint       # Run ESLint
```

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

---

## 📄 License

This project is open source and available under the MIT License.

---

## 🙏 Acknowledgments

- OpenAI for GPT-4o and DALL-E 3 APIs
- MongoDB for database infrastructure
- Vite team for amazing build tool
- TailwindCSS for utility-first CSS

---

**Built with ❤️ using React, Express, MongoDB, and OpenAI**
