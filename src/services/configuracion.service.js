import api from "./auth.service.js";

export const getConfiguracion = () => api.get("/api/configuracion");
export const updateConfiguracion = (data) => api.put("/api/configuracion", data);
export const aplicarPrecioPinturaATodas = (precioPinturaM2) =>
  api.post("/api/configuracion/aplicar-precio-pintura", { precioPinturaM2 });
