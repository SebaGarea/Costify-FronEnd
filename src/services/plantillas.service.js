import api from "./auth.service";
const BASE_URL = import.meta.env.VITE_API_URL;

export const getAllPlantillas = async (filtros = {}) => {
  const params = new URLSearchParams();
  
  if (filtros.categoria && filtros.categoria !== 'todas') {
    params.append('categoria', filtros.categoria);
  }
  
  if (filtros.tipoProyecto && filtros.tipoProyecto !== 'todos') {
    params.append('tipoProyecto', filtros.tipoProyecto);
  }
  
  if (filtros.search && filtros.search.trim()) {
    params.append('search', filtros.search.trim());
  }
  
  const url = `${BASE_URL}/api/plantillas${params.toString() ? `?${params.toString()}` : ''}`;
  return await api.get(url);
};

export const getPlantillaById = async (id) => {
    return await api.get(`${BASE_URL}/api/plantillas/${id}`);
};

export const createPlantilla = async (plantillaData) => {
    return await api.post(`${BASE_URL}/api/plantillas`, plantillaData);
};

export const updatePlantilla = async (id, plantillaData) => {
  return await api.put(`${BASE_URL}/api/plantillas/${id}`, plantillaData);
};

export const deletePlantilla = async (id) => {
  return await api.delete(`${BASE_URL}/api/plantillas/${id}`);
};

export const duplicatePlantilla = async (id, payload = {}) => {
  return await api.post(`${BASE_URL}/api/plantillas/${id}/duplicate`, payload);
};

export const calculatePlantillaCost = async (plantillaData) => {
  return await api.post(`${BASE_URL}/api/plantillas/calculate`, plantillaData);
};

