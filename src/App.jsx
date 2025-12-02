import React, { useState } from "react";
import ModeSwitcher from "./components/ModeSwitcher";
import ChatMode from "./components/ChatMode";
import ImageMode from "./components/ImageMode";
import CreativeMode from "./components/CreativeMode";
import RAGMode from "./components/RAGMode";

function App() {
  const [mode, setMode] = useState("chat");
  // Persistent state for each mode
  const [chatMessages, setChatMessages] = useState([]);
  const [ragMessages, setRagMessages] = useState([]);
  const [creativeContent, setCreativeContent] = useState("");

  return (
    <div className="flex flex-col h-screen bg-linear-to-br from-gray-50 to-gray-100 overflow-hidden">
      <header className="bg-white/80 backdrop-blur-md border-b border-gray-200/50 shadow-sm z-10">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between px-3 sm:px-6 py-3 sm:py-4">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-linear-to-br from-violet-600 to-indigo-600 rounded-lg sm:rounded-xl flex items-center justify-center text-white font-bold text-base sm:text-lg shadow-lg shadow-violet-500/30">
                M
              </div>
              <div>
                <h1 className="font-bold text-lg sm:text-xl tracking-tight bg-linear-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                  MiniGPT
                </h1>
                <p className="text-xs text-gray-500 hidden sm:block">
                  AI-Powered Assistant
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="px-2 sm:px-3 py-1 sm:py-1.5 bg-gray-100 rounded-full text-xs font-medium text-gray-600 border border-gray-200">
                {mode === "chat" && (
                  <>
                    <span className="hidden sm:inline">🤖 GPT-4o Mini</span>
                    <span className="sm:hidden">🤖 Chat</span>
                  </>
                )}
                {mode === "rag" && (
                  <>
                    <span className="hidden sm:inline">📚 RAG System</span>
                    <span className="sm:hidden">📚 RAG</span>
                  </>
                )}
                {mode === "image" && (
                  <>
                    <span className="hidden sm:inline">🎨 DALL-E 3</span>
                    <span className="sm:hidden">🎨 Image</span>
                  </>
                )}
                {mode === "creative" && (
                  <>
                    <span className="hidden sm:inline">✨ GPT-4o Creative</span>
                    <span className="sm:hidden">✨ Creative</span>
                  </>
                )}
              </div>
            </div>
          </div>
          <ModeSwitcher currentMode={mode} setMode={setMode} />
        </div>
      </header>

      <main className="flex-1 overflow-hidden relative">
        {mode === "chat" && (
          <ChatMode messages={chatMessages} setMessages={setChatMessages} />
        )}
        {mode === "rag" && (
          <RAGMode messages={ragMessages} setMessages={setRagMessages} />
        )}
        {mode === "image" && <ImageMode />}
        {mode === "creative" && (
          <CreativeMode
            content={creativeContent}
            setContent={setCreativeContent}
          />
        )}
      </main>
    </div>
  );
}

export default App;
