import api from "./auth.service";

export async function getAllCategoriesMp() {
  return await api.get("/api/materiasPrimas/categories");
}

export async function getAllMateriasPrimas({ page = 1, limit = 10, category, type, medida, nombreMadera } = {}) {
  return await api.get("/api/materiasPrimas", {
    params: { page, limit, category, type, medida, nombreMadera },
  });
}

export async function getMateriasPrimasMeta({ category, type, medida, nombreMadera } = {}) {
  return await api.get("/api/materiasPrimas/meta", {
    params: { category, type, medida, nombreMadera },
  });
}

export async function getMpByCategory(category) {
  return await api.get(`/api/materiasPrimas/category/${category}`);
}

export async function createRawMaterial(rawMaterialData) {
  return await api.post("/api/materiasPrimas", rawMaterialData);
}

export async function updateRawMaterial(id, rawMaterialData) {
  return await api.put(`/api/materiasPrimas/${id}`, rawMaterialData);
}

export async function deleteRawMaterial(id) {
  return await api.delete(`/api/materiasPrimas/${id}`);
}

export async function deleteAllRawMaterials() {
  return await api.delete("/api/materiasPrimas");
}

export async function getRawMaterialById(id) {
  return await api.get(`/api/materiasPrimas/${id}`);
}

export async function importRawMaterialsExcel(file) {
  const formData = new FormData();
  formData.append("file", file);

  return await api.post("/api/materiasPrimas/import", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
}
