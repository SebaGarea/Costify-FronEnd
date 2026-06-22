import { createContext, useContext, useState, useCallback, useEffect, useRef } from "react";
import { streamChatMessage } from "../services/chat.service.js";

const STORAGE_KEY = "costify-chat";

const ChatContext = createContext(null);

export const useChat = () => {
  const ctx = useContext(ChatContext);
  if (!ctx) throw new Error("useChat debe usarse dentro de <ChatProvider>");
  return ctx;
};

export const ChatProvider = ({ children }) => {
  const [messages, setMessages] = useState(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });
  const [isStreaming, setIsStreaming] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const abortRef = useRef(null);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(messages.slice(-50)));
    } catch {
      /* storage lleno/deshabilitado */
    }
  }, [messages]);

  const appendToLast = useCallback((chunk) => {
    setMessages((prev) => {
      const copy = [...prev];
      const last = copy[copy.length - 1];
      copy[copy.length - 1] = { ...last, content: last.content + chunk };
      return copy;
    });
  }, []);

  const send = useCallback(
    async (text) => {
      const content = (text || "").trim();
      if (!content || isStreaming) return;

      const history = [...messages, { role: "user", content }];
      setMessages([...history, { role: "assistant", content: "" }]);
      setIsStreaming(true);
      abortRef.current = new AbortController();

      try {
        await streamChatMessage({
          messages: history.map((m) => ({ role: m.role, content: m.content })),
          onChunk: appendToLast,
          signal: abortRef.current.signal,
        });
      } catch (err) {
        setMessages((prev) => {
          const copy = [...prev];
          copy[copy.length - 1] = {
            role: "assistant",
            content: `⚠️ ${err.message || "Ocurrió un error con el asistente."}`,
          };
          return copy;
        });
      } finally {
        setIsStreaming(false);
        abortRef.current = null;
      }
    },
    [messages, isStreaming, appendToLast]
  );

  const stop = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  const clear = useCallback(() => setMessages([]), []);

  return (
    <ChatContext.Provider value={{ messages, isStreaming, isOpen, setIsOpen, send, stop, clear }}>
      {children}
    </ChatContext.Provider>
  );
};
