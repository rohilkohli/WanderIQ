import React, { useState, useRef, useEffect } from "react";
import { useGeminiChat } from "@/hooks/useGeminiChat";

interface ChatDrawerProps {
  onClose: () => void;
  itineraryContext?: string;
}

const ChatDrawer: React.FC<ChatDrawerProps> = ({ onClose, itineraryContext }) => {
  const { messages, isLoading, sendMessage } = useGeminiChat(itineraryContext);
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || isLoading) return;
    setInput("");
    await sendMessage(text);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const QUICK_PROMPTS = ["What should I pack?", "Suggest vegetarian restaurants", "Optimize my budget", "Travel tips for this destination"];

  return (
    <>
      <div className="overlay-backdrop" onClick={onClose} aria-hidden="true" />
      <aside className="drawer" role="complementary" aria-label="AI Travel Assistant" aria-live="polite">
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)", padding: "var(--space-4) var(--space-5)", borderBottom: "1px solid var(--color-border)", background: "var(--color-surface)" }}>
          <div style={{ width: 40, height: 40, borderRadius: "var(--radius-md)", background: "linear-gradient(135deg, var(--color-accent), var(--color-highlight))", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.25rem" }} aria-hidden="true">
            ✨
          </div>
          <div style={{ flex: 1 }}>
            <h2 style={{ fontSize: "1rem", fontFamily: "var(--font-display)", marginBottom: 2 }}>AI Travel Assistant</h2>
            <p style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>Powered by Gemini · Always ready</p>
          </div>
          <button onClick={onClose} aria-label="Close AI assistant" style={{ background: "transparent", border: "none", cursor: "pointer", color: "var(--color-text-muted)", fontSize: "1.5rem", padding: "var(--space-1)", borderRadius: "var(--radius-sm)", lineHeight: 1 }}>
            ×
          </button>
        </div>

        {/* Messages */}
        <div role="log" aria-label="Chat conversation" aria-live="polite" style={{ flex: 1, overflowY: "auto", padding: "var(--space-4) var(--space-5)", display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
          {messages.length === 0 && (
            <div style={{ textAlign: "center", padding: "var(--space-8) 0" }}>
              <div style={{ fontSize: "3rem", marginBottom: "var(--space-4)" }} aria-hidden="true">
                🗺️
              </div>
              <h3 style={{ fontFamily: "var(--font-display)", fontSize: "1.25rem", marginBottom: "var(--space-2)" }}>Your travel companion</h3>
              <p style={{ color: "var(--color-text-muted)", fontSize: "0.875rem", lineHeight: 1.6 }}>Ask me anything about your trip — restaurants, packing, routes, budget tips, and more.</p>

              {/* Quick prompts */}
              <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)", marginTop: "var(--space-6)" }}>
                {QUICK_PROMPTS.map((prompt) => (
                  <button
                    key={prompt}
                    onClick={() => sendMessage(prompt)}
                    style={{ background: "var(--color-surface-alt)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-md)", padding: "var(--space-3) var(--space-4)", cursor: "pointer", fontSize: "0.875rem", color: "var(--color-text-muted)", textAlign: "left", transition: "all var(--transition-fast)", fontFamily: "var(--font-body)" }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = "var(--color-accent)";
                      e.currentTarget.style.color = "var(--color-accent)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = "var(--color-border)";
                      e.currentTarget.style.color = "var(--color-text-muted)";
                    }}
                  >
                    {prompt} →
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg, i) => (
            <div key={msg.id} style={{ display: "flex", flexDirection: msg.role === "user" ? "row-reverse" : "row", gap: "var(--space-3)", animation: `${msg.role === "user" ? "slideInLeft" : "slideInRight"} 250ms ease-out`, animationDelay: `${i * 30}ms`, animationFillMode: "both" }}>
              {/* Avatar */}
              <div style={{ width: 32, height: 32, borderRadius: "50%", background: msg.role === "user" ? "var(--color-highlight)" : "linear-gradient(135deg, var(--color-accent), #2D9CDB)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.875rem", flexShrink: 0, color: "white", fontWeight: 700 }} aria-hidden="true">
                {msg.role === "user" ? "U" : "✨"}
              </div>

              {/* Bubble */}
              <div style={{ maxWidth: "80%", padding: "var(--space-3) var(--space-4)", borderRadius: msg.role === "user" ? "var(--radius-lg) var(--radius-md) var(--radius-sm) var(--radius-lg)" : "var(--radius-md) var(--radius-lg) var(--radius-lg) var(--radius-sm)", background: msg.role === "user" ? "var(--color-accent)" : "var(--color-surface)", color: msg.role === "user" ? "white" : "var(--color-text-primary)", border: msg.role === "model" ? "1px solid var(--color-border)" : "none", fontSize: "0.9375rem", lineHeight: 1.6, whiteSpace: "pre-wrap" }}>
                {msg.isStreaming && !msg.content ? (
                  <span className="animate-pulse" style={{ display: "flex", gap: 4 }}>
                    <span style={{ width: 6, height: 6, background: "var(--color-text-muted)", borderRadius: "50%", display: "inline-block" }} />
                    <span style={{ width: 6, height: 6, background: "var(--color-text-muted)", borderRadius: "50%", display: "inline-block", animationDelay: "0.15s" }} />
                    <span style={{ width: 6, height: 6, background: "var(--color-text-muted)", borderRadius: "50%", display: "inline-block", animationDelay: "0.3s" }} />
                  </span>
                ) : (
                  <span dangerouslySetInnerHTML={{ __html: formatMarkdown(msg.content) }} />
                )}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div style={{ padding: "var(--space-4) var(--space-5)", borderTop: "1px solid var(--color-border)", background: "var(--color-surface)" }}>
          <div style={{ display: "flex", gap: "var(--space-2)", alignItems: "flex-end" }}>
            <label htmlFor="chat-input" className="sr-only">
              Message the AI assistant
            </label>
            <textarea id="chat-input" ref={inputRef} value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={handleKeyDown} placeholder="Ask about your trip..." rows={1} style={{ flex: 1, resize: "none", fontFamily: "var(--font-body)", fontSize: "0.9375rem", padding: "var(--space-3) var(--space-4)", background: "var(--color-surface-alt)", border: "1.5px solid var(--color-border)", borderRadius: "var(--radius-lg)", color: "var(--color-text-primary)", outline: "none", lineHeight: 1.5, maxHeight: 120, overflowY: "auto" }} aria-label="Chat message input" />
            <button onClick={handleSend} disabled={!input.trim() || isLoading} className="btn btn-primary" style={{ padding: "var(--space-3)", minHeight: "auto", borderRadius: "var(--radius-lg)", alignSelf: "flex-end" }} aria-label="Send message">
              {isLoading ? <span style={{ display: "block", width: 16, height: 16, border: "2px solid rgba(255,255,255,0.4)", borderTopColor: "white", borderRadius: "50%", animation: "spin 1s linear infinite" }} /> : "↑"}
            </button>
          </div>
          <p style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", marginTop: "var(--space-2)", textAlign: "center" }}>Powered by Gemini 2.5 Flash · Press Enter to send</p>
        </div>
      </aside>
    </>
  );
};

/** Very simple markdown-to-HTML for bold and line breaks */
function formatMarkdown(text: string): string {
  const escaped = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
  return escaped
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.*?)\*/g, "<em>$1</em>")
    .replace(/\n/g, "<br/>");
}

export default ChatDrawer;
