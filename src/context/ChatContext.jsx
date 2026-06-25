import { createContext, useContext, useState, useCallback, useEffect, useRef } from "react";
import {
  streamChatMessage,
  fetchChatHistory,
  clearChatHistory,
  fetchResumen,
} from "../services/chat.service.js";

const STORAGE_KEY = "costify-chat";

// Etiquetas amigables para el indicador "usando herramienta…".
const TOOL_LABELS = {
  getMetricasNegocio: "Consultando métricas",
  getEntregasProximas: "Revisando entregas",
  buscarProducto: "Buscando producto",
  getMateriasBajoStock: "Revisando stock",
  getMargenProductos: "Calculando márgenes",
  compararVentas: "Comparando ventas",
  getClima: "Consultando el clima",
  getDolar: "Consultando el dólar",
  buscarWeb: "Buscando en internet",
  crearTarea: "Creando tarea",
  completarTarea: "Completando tarea",
  editarTarea: "Editando tarea",
  borrarTarea: "Borrando tarea",
  registrarCobro: "Registrando cobro",
  marcarDespachada: "Marcando entrega",
  crearVenta: "Registrando venta",
  crearProducto: "Creando producto",
  agregarListaCompra: "Agregando a la lista",
  crearPublicacion: "Creando publicación",
};

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
  const [toolStatus, setToolStatus] = useState(null);
  const [resumen, setResumen] = useState("");
  const abortRef = useRef(null);

  // Historial persistido en el servidor (sirve para reabrir en otro dispositivo).
  useEffect(() => {
    let activo = true;
    fetchChatHistory().then((serverMsgs) => {
      if (activo && serverMsgs.length) setMessages(serverMsgs);
    });
    return () => {
      activo = false;
    };
  }, []);

  // Cache local (offline / arranque rápido).
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(messages.slice(-50)));
    } catch {
      /* storage lleno/deshabilitado */
    }
  }, [messages]);

  // Resumen proactivo: se trae al abrir el chat por primera vez sin conversación.
  useEffect(() => {
    if (isOpen && !resumen && messages.length === 0) {
      fetchResumen().then((txt) => txt && setResumen(txt));
    }
  }, [isOpen, resumen, messages.length]);

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
      setToolStatus(null);
      abortRef.current = new AbortController();

      try {
        await streamChatMessage({
          messages: history.map((m) => ({ role: m.role, content: m.content })),
          onChunk: appendToLast,
          onTool: (name) => setToolStatus(TOOL_LABELS[name] || "Trabajando"),
          onAction: (entities) => {
            // La IA creó/modificó datos: avisamos a las vistas para que refresquen.
            try {
              window.dispatchEvent(
                new CustomEvent("costify:data-changed", { detail: { entities } })
              );
            } catch {
              /* navegador sin CustomEvent */
            }
          },
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
        setToolStatus(null);
        abortRef.current = null;
      }
    },
    [messages, isStreaming, appendToLast]
  );

  const stop = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  const clear = useCallback(() => {
    setMessages([]);
    setResumen("");
    clearChatHistory();
  }, []);

  return (
    <ChatContext.Provider
      value={{ messages, isStreaming, isOpen, setIsOpen, send, stop, clear, toolStatus, resumen }}
    >
      {children}
    </ChatContext.Provider>
  );
};
