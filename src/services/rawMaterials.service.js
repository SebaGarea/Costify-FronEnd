import api from "./auth.service";
const BASE_URL = import.meta.env.VITE_API_URL;


export async function getAllCategoriesMp() {
  return await api.get(`${BASE_URL}/api/materiasPrimas/categories`);
}

export async function getAllMateriasPrimas() {
  return await api.get(`${BASE_URL}/api/materiasPrimas`);
}

export async function getMpByCategory(category) {
  return await api.get(
    `${BASE_URL}/api/materiasPrimas/category/${category}`
  );
}

export async function createRawMaterial(rawMaterialData) {
  return await api.post(`${BASE_URL}/api/materiasPrimas`, rawMaterialData);
}

export async function updateRawMaterial(id, rawMaterialData) {
  return await api.put(`${BASE_URL}/api/materiasPrimas/${id}`, rawMaterialData);
}

export async function deleteRawMaterial(id) {
  return await api.delete(`${BASE_URL}/api/materiasPrimas/${id}`);
}

export async function getRawMaterialById(id) {
  return await api.get(`${BASE_URL}/api/materiasPrimas/${id}`);
}
