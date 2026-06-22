import api from "./auth.service";

export const getAllContenido = async (params = {}) => {
  const response = await api.get("/api/contenido", { params });
  return response.data;
};

export const createContenido = async (payload) => {
  const response = await api.post("/api/contenido", payload);
  return response.data;
};

export const updateContenido = async (id, payload) => {
  const response = await api.put(`/api/contenido/${id}`, payload);
  return response.data;
};

export const deleteContenido = async (id) => {
  const response = await api.delete(`/api/contenido/${id}`);
  return response.data;
};

export const getUsuarios = async () => {
  const response = await api.get("/api/usuarios");
  // El backend puede devolver un array o { usuarios: [...] }
  const data = response.data;
  if (Array.isArray(data)) return data;
  return data?.usuarios ?? data?.users ?? [];
};
