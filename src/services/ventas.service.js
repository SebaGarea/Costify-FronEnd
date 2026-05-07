import api from "./auth.service";

export const getAllVentas = async () => {
  try {
    const response = await api.get("/api/ventas");
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getAllVentasPaginated = async (page = 1, limit = 10) => {
  try {
    const response = await api.get("/api/ventas", {
      params: { page, limit }
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getUpdateVentas = async (id, ventasData) => {
  try {
    const response = await api.put(`/api/ventas/${id}`, ventasData);
    return response;
  } catch (error) {
    throw error;
  }
};

export const createVenta = async (ventaData) => {
  try {
    const response = await api.post("/api/ventas", ventaData);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const deleteVenta = async (id) => {
  try {
    const response = await api.delete(`/api/ventas/${id}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};