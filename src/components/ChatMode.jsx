import React, { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import { Send } from "lucide-react";
import { generateResponse } from "../api";

const ChatMode = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = { role: "user", content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      // Pass history excluding the last user message we just added locally for display
      // Actually api.js expects history to include previous context.
      // We should pass the current messages state (which doesn't have the new one yet in the closure)
      // plus the new one.
      const history = messages.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      console.log("Sending request to OpenAI with:", {
        mode: "chat",
        prompt: input,
        history,
      });
      const response = await generateResponse("chat", input, history);
      console.log("Received response:", response);

      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: response },
      ]);
    } catch (error) {
      console.error("Error in ChatMode:", error);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `Error: ${
            error.message ||
            "Unknown error occurred. Check console for details."
          }`,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full max-w-4xl mx-auto w-full">
      <div className="flex-1 overflow-y-auto p-3 sm:p-6 space-y-3 sm:space-y-4">
        {messages.length === 0 && (
          <div className="text-center mt-16 sm:mt-32 space-y-4 sm:space-y-6 px-4">
            <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto bg-linear-to-br from-violet-100 to-indigo-100 rounded-2xl sm:rounded-3xl flex items-center justify-center">
              <span className="text-3xl sm:text-4xl">💬</span>
            </div>
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2">
                Start a Conversation
              </h2>
              <p className="text-sm sm:text-base text-gray-500">
                Ask me anything, I'm here to help!
              </p>
            </div>
          </div>
        )}

        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`flex ${
              msg.role === "user" ? "justify-end" : "justify-start"
            } animate-in fade-in slide-in-from-bottom-2 duration-500`}
          >
            <div
              className={`max-w-[90%] sm:max-w-[85%] rounded-xl sm:rounded-2xl px-3 sm:px-5 py-2.5 sm:py-3 shadow-sm ${
                msg.role === "user"
                  ? "bg-linear-to-br from-violet-600 to-indigo-600 text-white"
                  : "bg-white text-gray-800 border border-gray-200"
              }`}
            >
              <div className="prose prose-sm max-w-none dark:prose-invert wrap-break-word">
                <ReactMarkdown
                  components={{
                    code({ node, inline, className, children, ...props }) {
                      return !inline ? (
                        <div className="bg-gray-900 text-gray-100 p-2 sm:p-3 rounded-lg my-2 overflow-x-auto text-xs sm:text-sm">
                          <code {...props}>{children}</code>
                        </div>
                      ) : (
                        <code
                          className="bg-violet-100 text-violet-800 px-1 sm:px-1.5 py-0.5 rounded text-xs sm:text-sm font-mono"
                          {...props}
                        >
                          {children}
                        </code>
                      );
                    },
                  }}
                >
                  {msg.content}
                </ReactMarkdown>
              </div>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white rounded-xl sm:rounded-2xl px-4 sm:px-5 py-2.5 sm:py-3 text-gray-500 border border-gray-200 shadow-sm">
              <div className="flex items-center gap-2">
                <div className="flex gap-1">
                  <div
                    className="w-2 h-2 bg-violet-600 rounded-full animate-bounce"
                    style={{ animationDelay: "0ms" }}
                  ></div>
                  <div
                    className="w-2 h-2 bg-violet-600 rounded-full animate-bounce"
                    style={{ animationDelay: "150ms" }}
                  ></div>
                  <div
                    className="w-2 h-2 bg-violet-600 rounded-full animate-bounce"
                    style={{ animationDelay: "300ms" }}
                  ></div>
                </div>
                <span className="text-xs sm:text-sm">Thinking...</span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-3 sm:p-6 bg-white/50 backdrop-blur-sm border-t border-gray-200/50">
        <form onSubmit={handleSubmit} className="relative max-w-3xl mx-auto">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your message..."
            className="w-full p-3 sm:p-4 pr-12 sm:pr-14 rounded-xl sm:rounded-2xl border-2 border-gray-200 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent shadow-lg bg-white transition-all text-sm sm:text-base"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="absolute right-1.5 sm:right-2 top-1/2 -translate-y-1/2 p-2.5 sm:p-3 bg-linear-to-br from-violet-600 to-indigo-600 text-white rounded-lg sm:rounded-xl hover:shadow-lg hover:scale-105 disabled:opacity-50 disabled:hover:scale-100 transition-all shadow-md shadow-violet-500/30"
          >
            <Send size={16} className="sm:w-[18px] sm:h-[18px]" />
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatMode;
