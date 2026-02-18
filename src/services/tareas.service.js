import api from "./auth.service";

const BASE_URL = import.meta.env.VITE_API_URL;

export const getAllTareas = async (params = {}) => {
  try {
    const response = await api.get(`${BASE_URL}/api/tareas`, { params });
    return response.data;
  } catch (error) {
    console.error("Error en getAllTareas:", error);
    throw error;
  }
};

export const getAllTareasPaginated = async (page = 1, limit = 10, params = {}) => {
  try {
    const response = await api.get(`${BASE_URL}/api/tareas`, {
      params: { page, limit, ...params },
    });
    return response.data; // { items, total, page, limit, totalPages }
  } catch (error) {
    console.error("Error en getAllTareasPaginated:", error);
    throw error;
  }
};

export const createTarea = async (payload) => {
  try {
    const response = await api.post(`${BASE_URL}/api/tareas`, payload);
    return response.data;
  } catch (error) {
    console.error("Error en createTarea:", error);
    throw error;
  }
};

export const updateTarea = async (id, payload) => {
  try {
    const response = await api.put(`${BASE_URL}/api/tareas/${id}`, payload);
    return response.data;
  } catch (error) {
    console.error("Error en updateTarea:", error);
    throw error;
  }
};

export const deleteTarea = async (id) => {
  try {
    const response = await api.delete(`${BASE_URL}/api/tareas/${id}`);
    return response.data;
  } catch (error) {
    console.error("Error en deleteTarea:", error);
    throw error;
  }
};
