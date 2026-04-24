import api from "./auth.service";

export const getAllTareas = async (params = {}) => {
  try {
    const response = await api.get("/api/tareas", { params });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getAllTareasPaginated = async (page = 1, limit = 10, params = {}) => {
  try {
    const response = await api.get("/api/tareas", {
      params: { page, limit, ...params },
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const createTarea = async (payload) => {
  try {
    const response = await api.post("/api/tareas", payload);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const updateTarea = async (id, payload) => {
  try {
    const response = await api.put(`/api/tareas/${id}`, payload);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const deleteTarea = async (id) => {
  try {
    const response = await api.delete(`/api/tareas/${id}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};
