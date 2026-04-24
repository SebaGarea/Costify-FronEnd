import api from "./auth.service";

export const getPerfilesPintura = () => api.get("/api/perfilesPintura");
export const createPerfilPintura = (data) => api.post("/api/perfilesPintura", data);
export const updatePerfilPintura = (id, data) => api.put(`/api/perfilesPintura/${id}`, data);
export const deletePerfilPintura = (id) => api.delete(`/api/perfilesPintura/${id}`);
