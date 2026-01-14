import axios from "axios";

const api = axios.create({ baseURL: import.meta.env.VITE_API_URL });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("costify-token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const login = (credentials) => api.post("/api/usuarios/login", credentials);
export default api;