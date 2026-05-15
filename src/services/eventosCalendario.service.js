import api from "./auth.service";

export const getEventos = async ({ desde, hasta } = {}) => {
  const params = {};
  if (desde) params.desde = desde;
  if (hasta) params.hasta = hasta;
  const response = await api.get("/api/eventos-calendario", { params });
  return response.data;
};

export const createEvento = async (payload) => {
  const response = await api.post("/api/eventos-calendario", payload);
  return response.data;
};

export const updateEvento = async (id, payload) => {
  const response = await api.put(`/api/eventos-calendario/${id}`, payload);
  return response.data;
};

export const deleteEvento = async (id) => {
  const response = await api.delete(`/api/eventos-calendario/${id}`);
  return response.data;
};
