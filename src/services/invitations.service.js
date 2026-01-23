import api from "./auth.service";

export const createInvitation = (payload) => api.post("/api/usuarios/invitaciones", payload);
export const listInvitations = () => api.get("/api/usuarios/invitaciones");
