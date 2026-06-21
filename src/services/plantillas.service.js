import api from "./auth.service";

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

  const url = `/api/plantillas${params.toString() ? `?${params.toString()}` : ''}`;
  return await api.get(url);
};

export const getPlantillaById = async (id) => {
  return await api.get(`/api/plantillas/${id}`);
};

export const createPlantilla = async (plantillaData) => {
  return await api.post("/api/plantillas", plantillaData);
};

export const updatePlantilla = async (id, plantillaData) => {
  return await api.put(`/api/plantillas/${id}`, plantillaData);
};

export const deletePlantilla = async (id) => {
  return await api.delete(`/api/plantillas/${id}`);
};

export const duplicatePlantilla = async (id, payload = {}) => {
  return await api.post(`/api/plantillas/${id}/duplicate`, payload);
};

export const calculatePlantillaCost = async (plantillaData) => {
  return await api.post("/api/plantillas/calculate", plantillaData);
};

export const syncPinturaPrice = async () => {
  return await api.post("/api/plantillas/sync-pintura-price");
};

export const previewPlantilla = async (payload) => {
  return await api.post("/api/plantillas/preview", payload);
};

export const renameTipoProyecto = async (tipoActual, tipoNuevo) => {
  return await api.put("/api/plantillas/renombrar-tipo", { tipoActual, tipoNuevo });
};

export const uploadArchivosPlantilla = async (id, files) => {
  const formData = new FormData();
  Array.from(files).forEach((file) => formData.append("archivos", file));
  return await api.post(`/api/plantillas/${id}/archivos`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
};

export const deleteArchivoPlantilla = async (id, publicId) => {
  return await api.delete(`/api/plantillas/${id}/archivos`, {
    params: { publicId },
  });
};

export const getTiposProyecto = async () => {
  const response = await api.get('/api/plantillas/tipos');
  return response.data;
};

