import api from "./auth.service";

const BASE_URL = import.meta.env.VITE_API_URL;

export const getShoppingList = () =>
  api.get(`${BASE_URL}/api/lista-compras`);

export const saveShoppingList = (payload) =>
  api.put(`${BASE_URL}/api/lista-compras`, payload);
