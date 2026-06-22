// Chat con streaming: axios no maneja bien streams en el navegador, usamos fetch.
const BASE_URL = import.meta.env.VITE_API_URL;

export const streamChatMessage = async ({ messages, onChunk, signal }) => {
  const token = localStorage.getItem("costify-token");
  const res = await fetch(`${BASE_URL}/api/chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
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
          msg = data.error || data.message || msg;
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
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    const text = decoder.decode(value, { stream: true });
    if (text) onChunk(text);
  }
};
