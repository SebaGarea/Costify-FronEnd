import axios from "axios";
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
  return await axios.get(url);
};

export const getPlantillaById = async (id) => {
    return await axios.get(`${BASE_URL}/api/plantillas/${id}`);
};

export const createPlantilla = async (plantillaData) => {
    return await axios.post(`${BASE_URL}/api/plantillas`, plantillaData);
};

export const updatePlantilla = async (id, plantillaData) => {
  return await axios.put(`${BASE_URL}/api/plantillas/${id}`, plantillaData);
};

export const deletePlantilla = async (id) => {
  return await axios.delete(`${BASE_URL}/api/plantillas/${id}`);
};

export const calculatePlantillaCost = async (plantillaData) => {
  return await axios.post(`${BASE_URL}/api/plantillas/calculate`, plantillaData);
};

