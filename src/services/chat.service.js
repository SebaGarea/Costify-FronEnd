// Chat con streaming: axios no maneja bien streams en el navegador, usamos fetch.
const BASE_URL = import.meta.env.VITE_API_URL;

const authHeaders = () => {
  const token = localStorage.getItem("costify-token");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

// Marcadores que el backend agrega al stream y que NO deben mostrarse en el chat:
//   <<<COSTIFY_REFRESH:tarea,contenido>>>  -> refrescar esas entidades
//   <<<COSTIFY_TOOL:getMetricasNegocio>>>  -> indicador "usando herramienta…"
const MARKER_PREFIX = "<<<COSTIFY_";
const MARKER_RE = /\n?<<<COSTIFY_(REFRESH|TOOL):([^>]*)>>>/;

// Índice desde donde retener el buffer porque podría ser un marcador (parcial o
// completo-sin-cerrar). -1 si no hay nada que retener.
const holdbackIndex = (s) => {
  const p = s.lastIndexOf(MARKER_PREFIX);
  if (p !== -1 && s.indexOf(">>>", p) === -1) {
    return s[p - 1] === "\n" ? p - 1 : p;
  }
  const start = Math.max(0, s.length - MARKER_PREFIX.length - 1);
  for (let i = start; i < s.length; i += 1) {
    const suf = s.slice(i);
    if (MARKER_PREFIX.startsWith(suf) || `\n${MARKER_PREFIX}`.startsWith(suf)) return i;
  }
  return -1;
};

export const streamChatMessage = async ({ messages, onChunk, onAction, onTool, signal }) => {
  const res = await fetch(`${BASE_URL}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify({ messages }),
    signal,
  });

  if (!res.ok || !res.body) {
    let msg = `No se pudo contactar al asistente (HTTP ${res.status}).`;
    if (res.status === 401) {
      msg = "Tu sesión expiró o no estás autenticado. Volvé a iniciar sesión.";
    } else {
      try {
        const ct = res.headers.get("content-type") || "";
        if (ct.includes("application/json")) {
          const data = await res.json();
          msg = data.error || data.message || data.mensaje || msg;
        } else {
          const txt = await res.text();
          if (txt) msg = `${msg} ${txt}`.slice(0, 200);
        }
      } catch {
        /* sin cuerpo legible */
      }
    }
    throw new Error(msg);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();

  let buffer = ""; // texto acumulado (puede contener marcadores)
  let emitted = 0; // cuánto del buffer ya enviamos a onChunk

  const process = (final) => {
    // Extraer todos los marcadores completos presentes en el buffer.
    let m;
    while ((m = buffer.match(MARKER_RE))) {
      const [tipo, payload] = [m[1], m[2]];
      if (tipo === "REFRESH") {
        const entities = payload.split(",").map((s) => s.trim()).filter(Boolean);
        if (entities.length) onAction?.(entities);
      } else if (tipo === "TOOL") {
        onTool?.(payload.trim());
      }
      buffer = buffer.slice(0, m.index) + buffer.slice(m.index + m[0].length);
    }

    // Emitir lo seguro; si no es el final, retener un posible marcador parcial.
    let safeEnd = buffer.length;
    if (!final) {
      const hb = holdbackIndex(buffer);
      if (hb !== -1) safeEnd = hb;
    }
    if (safeEnd > emitted) {
      onChunk(buffer.slice(emitted, safeEnd));
      emitted = safeEnd;
    }
  };

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    const text = decoder.decode(value, { stream: true });
    if (text) {
      buffer += text;
      process(false);
    }
  }
  process(true);
};

export const fetchChatHistory = async () => {
  try {
    const res = await fetch(`${BASE_URL}/api/chat/history`, { headers: authHeaders() });
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data?.messages) ? data.messages : [];
  } catch {
    return [];
  }
};

export const clearChatHistory = async () => {
  try {
    await fetch(`${BASE_URL}/api/chat/history`, { method: "DELETE", headers: authHeaders() });
  } catch {
    /* silencioso */
  }
};

export const fetchResumen = async () => {
  try {
    const res = await fetch(`${BASE_URL}/api/chat/resumen`, { headers: authHeaders() });
    if (!res.ok) return "";
    const data = await res.json();
    return data?.resumen || "";
  } catch {
    return "";
  }
};
