import axios from "axios";
const BASE_URL = import.meta.env.VITE_API_URL;


// PRODUCTOS
export async function getAllProducts() {
  return await axios.get(`${BASE_URL}/api/productos`);
}

export async function getProductById(id) {
  return await axios.get(`${BASE_URL}/api/productos/${id}`);
}

export async function getProductsByCatalogo(catalogo) {
  return await axios.get(
    `${BASE_URL}/api/productos/catalogo/${catalogo}`
  );
}

export async function getProductsByModelo(modelo) {
  return await axios.get(
    `${BASE_URL}/api/productos/modelo/${modelo}`
  );
}

export async function createProduct(productData, isFormData = false) {
  return await axios.post(
    `${BASE_URL}/api/productos`,
    productData,
    isFormData
      ? { headers: { "Content-Type": "multipart/form-data" } }
      : undefined
  );
}

export async function updateProduct(id, productData, isFormData = false) {
  return await axios.put(
    `${BASE_URL}/api/productos/${id}`,
    productData,
    isFormData
      ? { headers: { "Content-Type": "multipart/form-data" } }
      : undefined
  );
}

export async function deleteProduct(id) {
  return await axios.delete(`${BASE_URL}/api/productos/${id}`);
}

//  MATERIAS PRIMAS
export async function getAllCategoriesMp() {
  return await axios.get(`${BASE_URL}/api/materiasPrimas/categories`);
}

export async function getAllMateriasPrimas() {
  return await axios.get(`${BASE_URL}/api/materiasPrimas`);
}

export async function getMpByCategory(category) {
  return await axios.get(
    `${BASE_URL}/api/materiasPrimas/category/${category}`
  );
}

export async function createRawMaterial(rawMaterialData) {
  return await axios.post(`${BASE_URL}/api/materiasPrimas`, rawMaterialData);
}

export async function updateRawMaterial(id, rawMaterialData) {
  return await axios.put(`${BASE_URL}/api/materiasPrimas/${id}`, rawMaterialData);
}

export async function deleteRawMaterial(id) {
  return await axios.delete(`${BASE_URL}/api/materiasPrimas/${id}`);
}
export async function getRawMaterialById(id) {
  return await axios.get(`${BASE_URL}/api/materiasPrimas/${id}`);
}