import React, { useState, useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";
import {
  Upload,
  FileText,
  Trash2,
  MessageCircle,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Send,
  Database,
  Menu,
  X,
} from "lucide-react";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

const RAGMode = ({ messages, setMessages }) => {
  const [documents, setDocuments] = useState([]);
  const [selectedDocs, setSelectedDocs] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState("");
  const [chunkStrategy, setChunkStrategy] = useState("overlapping");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  // Fetch documents on mount
  useEffect(() => {
    fetchDocuments();
  }, []);

  // Auto-scroll messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const fetchDocuments = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/rag/documents`);
      const data = await response.json();
      setDocuments(data.documents || []);
    } catch (error) {
      console.error("Error fetching documents:", error);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsUploading(true);
    setUploadProgress(`Uploading ${file.name}...`);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("chunkStrategy", chunkStrategy);
    formData.append("chunkSize", "500");
    formData.append("chunkOverlap", "50");

    try {
      const response = await fetch(`${API_BASE_URL}/api/rag/upload`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Upload failed");
      }

      const data = await response.json();
      setUploadProgress("Processing document...");

      // Poll for document status
      await pollDocumentStatus(data.documentId);

      setUploadProgress("");
      fetchDocuments();
    } catch (error) {
      console.error("Upload error:", error);
      setUploadProgress("Upload failed. Please try again.");
      setTimeout(() => setUploadProgress(""), 3000);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const pollDocumentStatus = async (documentId) => {
    return new Promise((resolve, reject) => {
      const interval = setInterval(async () => {
        try {
          const response = await fetch(
            `${API_BASE_URL}/api/rag/documents/${documentId}`
          );
          const data = await response.json();

          if (data.document.status === "ready") {
            clearInterval(interval);
            resolve();
          } else if (data.document.status === "error") {
            clearInterval(interval);
            reject(new Error(data.document.errorMessage));
          }
        } catch (error) {
          clearInterval(interval);
          reject(error);
        }
      }, 2000);

      // Timeout after 5 minutes
      setTimeout(() => {
        clearInterval(interval);
        resolve();
      }, 300000);
    });
  };

  const handleDeleteDocument = async (docId) => {
    if (!confirm("Are you sure you want to delete this document?")) return;

    try {
      await fetch(`${API_BASE_URL}/api/rag/documents/${docId}`, {
        method: "DELETE",
      });
      fetchDocuments();
      setSelectedDocs(selectedDocs.filter((id) => id !== docId));
    } catch (error) {
      console.error("Delete error:", error);
    }
  };

  const toggleDocumentSelection = (docId) => {
    setSelectedDocs((prev) =>
      prev.includes(docId)
        ? prev.filter((id) => id !== docId)
        : [...prev, docId]
    );
    // Close sidebar on mobile after selection
    if (window.innerWidth < 768) {
      setTimeout(() => setIsSidebarOpen(false), 300);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    if (documents.filter((d) => d.status === "ready").length === 0) {
      alert("Please upload at least one document first!");
      return;
    }

    const userMessage = { role: "user", content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const history = messages.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const response = await fetch(`${API_BASE_URL}/api/rag-chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: input,
          documentIds: selectedDocs.length > 0 ? selectedDocs : undefined,
          topK: 5,
          history,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Request failed");
      }

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: data.content,
          metadata: data.metadata,
        },
      ]);
    } catch (error) {
      console.error("Error in RAG chat:", error);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `Error: ${error.message}`,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const readyDocs = documents.filter((d) => d.status === "ready");

  return (
    <div className="flex h-full relative">
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        className="md:hidden fixed top-20 left-4 z-50 p-2 bg-blue-600 text-white rounded-lg shadow-lg hover:bg-blue-700 transition-all"
      >
        {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Overlay for mobile */}
      {isSidebarOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-30"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar - Document Management */}
      <div
        className={`
          fixed md:relative z-40 md:z-0
          w-80 md:w-80 h-full
          border-r border-gray-200 bg-white flex flex-col
          transition-transform duration-300 ease-in-out
          ${
            isSidebarOpen
              ? "translate-x-0"
              : "-translate-x-full md:translate-x-0"
          }
        `}
      >
        <div className="p-4 border-b border-gray-200 bg-linear-to-r from-blue-50 to-indigo-50">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Database className="text-blue-600" size={20} />
              <h2 className="font-semibold text-gray-800">Knowledge Base</h2>
            </div>
            {/* Close button for mobile */}
            <button
              onClick={() => setIsSidebarOpen(false)}
              className="md:hidden text-gray-600 hover:text-gray-800"
            >
              <X size={20} />
            </button>
          </div>

          {/* Upload Section */}
          <div className="space-y-2">
            <select
              value={chunkStrategy}
              onChange={(e) => setChunkStrategy(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
              disabled={isUploading}
            >
              <option value="overlapping">Overlapping Chunks</option>
              <option value="fixed-size">Fixed Size</option>
              <option value="semantic">Semantic</option>
            </select>

            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-sm font-medium shadow-sm"
            >
              {isUploading ? (
                <>
                  <Loader2 className="animate-spin" size={16} />
                  <span>Uploading...</span>
                </>
              ) : (
                <>
                  <Upload size={16} />
                  <span>Upload Document</span>
                </>
              )}
            </button>

            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.txt,.md,.docx"
              onChange={handleFileUpload}
              className="hidden"
            />

            {uploadProgress && (
              <p className="text-xs text-blue-600 text-center">
                {uploadProgress}
              </p>
            )}
          </div>
        </div>

        {/* Documents List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {documents.length === 0 ? (
            <div className="text-center py-8 text-gray-400 text-sm">
              <FileText className="mx-auto mb-2" size={32} />
              <p>No documents yet</p>
            </div>
          ) : (
            documents.map((doc) => (
              <div
                key={doc._id}
                className={`p-3 rounded-lg border transition-all cursor-pointer ${
                  selectedDocs.includes(doc._id)
                    ? "bg-blue-50 border-blue-300"
                    : "bg-white border-gray-200 hover:border-gray-300"
                }`}
                onClick={() =>
                  doc.status === "ready" && toggleDocumentSelection(doc._id)
                }
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <FileText size={14} className="text-gray-500 shrink-0" />
                      <p className="text-sm font-medium text-gray-800 truncate">
                        {doc.originalName}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      {doc.status === "ready" && (
                        <>
                          <CheckCircle2 size={12} className="text-green-500" />
                          <span>{doc.totalChunks} chunks</span>
                        </>
                      )}
                      {doc.status === "processing" && (
                        <>
                          <Loader2
                            size={12}
                            className="animate-spin text-blue-500"
                          />
                          <span>Processing...</span>
                        </>
                      )}
                      {doc.status === "error" && (
                        <>
                          <AlertCircle size={12} className="text-red-500" />
                          <span>Error</span>
                        </>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteDocument(doc._id);
                    }}
                    className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Selection Info */}
        {readyDocs.length > 0 && (
          <div className="p-3 border-t border-gray-200 bg-gray-50 text-xs text-gray-600">
            {selectedDocs.length > 0 ? (
              <p>
                Using {selectedDocs.length} of {readyDocs.length} documents
              </p>
            ) : (
              <p>Using all {readyDocs.length} documents</p>
            )}
          </div>
        )}
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col w-full md:w-auto">
        <div className="flex-1 overflow-y-auto p-3 sm:p-6 space-y-3 sm:space-y-4">
          {messages.length === 0 ? (
            <div className="text-center mt-16 sm:mt-32 space-y-4 sm:space-y-6 px-4">
              <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto bg-linear-to-br from-blue-100 to-indigo-100 rounded-2xl sm:rounded-3xl flex items-center justify-center">
                <MessageCircle className="text-blue-600" size={32} />
              </div>
              <div>
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2">
                  Chat with Your Documents
                </h2>
                <p className="text-sm sm:text-base text-gray-500">
                  Upload documents and ask questions about their content
                </p>
              </div>
            </div>
          ) : (
            messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex ${
                  msg.role === "user" ? "justify-end" : "justify-start"
                } animate-in fade-in slide-in-from-bottom-2 duration-500`}
              >
                <div
                  className={`max-w-[90%] sm:max-w-[85%] rounded-xl sm:rounded-2xl px-4 sm:px-5 py-2.5 sm:py-3 shadow-sm ${
                    msg.role === "user"
                      ? "bg-linear-to-br from-blue-600 to-indigo-600 text-white"
                      : "bg-white text-gray-800 border border-gray-200"
                  }`}
                >
                  <div className="prose prose-sm sm:prose max-w-none dark:prose-invert wrap-break-word">
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                  </div>

                  {msg.metadata && (
                    <div className="mt-2 sm:mt-3 pt-2 sm:pt-3 border-t border-gray-200 text-xs text-gray-500">
                      <p>
                        📚 Retrieved {msg.metadata.chunksRetrieved} relevant
                        chunks (similarity:{" "}
                        {(msg.metadata.topSimilarity * 100).toFixed(1)}%)
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}

          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-white rounded-xl sm:rounded-2xl px-4 sm:px-5 py-2.5 sm:py-3 text-gray-500 border border-gray-200 shadow-sm">
                <div className="flex items-center gap-2">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" />
                    <div
                      className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"
                      style={{ animationDelay: "150ms" }}
                    />
                    <div
                      className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"
                      style={{ animationDelay: "300ms" }}
                    />
                  </div>
                  <span className="text-xs sm:text-sm">
                    Searching documents...
                  </span>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-3 sm:p-6 bg-white/50 backdrop-blur-sm border-t border-gray-200/50">
          <form onSubmit={handleSubmit} className="relative max-w-3xl mx-auto">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask a question about your documents..."
              className="w-full p-3 sm:p-4 pr-12 sm:pr-14 rounded-xl sm:rounded-2xl border-2 border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-lg bg-white transition-all text-sm sm:text-base"
              disabled={isLoading || readyDocs.length === 0}
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim() || readyDocs.length === 0}
              className="absolute right-1.5 sm:right-2 top-1/2 -translate-y-1/2 p-2.5 sm:p-3 bg-linear-to-br from-blue-600 to-indigo-600 text-white rounded-lg sm:rounded-xl hover:shadow-lg hover:scale-105 disabled:opacity-50 disabled:hover:scale-100 transition-all shadow-md"
            >
              <Send size={16} className="sm:w-[18px] sm:h-[18px]" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default RAGMode;
