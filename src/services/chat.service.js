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
    let msg = "No se pudo contactar al asistente.";
    try {
      const data = await res.json();
      msg = data.error || data.message || msg;
    } catch {
      /* respuesta sin json */
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
