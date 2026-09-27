import api from "./auth.service";

export const getShoppingList = () =>
  api.get("/api/lista-compras");

export const saveShoppingList = (payload) =>
  api.put("/api/lista-compras", payload);

// Agrega (o actualiza) un ítem de una planilla en la lista de compras.
export const linkPlantillaItem = (payload) =>
  api.post("/api/lista-compras/plantilla-items", payload);

export const unlinkPlantillaItem = (plantillaId, uid) =>
  api.delete(
    `/api/lista-compras/plantilla-items/${encodeURIComponent(plantillaId)}/${encodeURIComponent(uid)}`
  );
