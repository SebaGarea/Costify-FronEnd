import api from "./auth.service";

export const getShoppingList = () =>
  api.get("/api/lista-compras");

export const saveShoppingList = (payload) =>
  api.put("/api/lista-compras", payload);
