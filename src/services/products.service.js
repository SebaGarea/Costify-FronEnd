import api from "./auth.service";

export async function getAllProducts() {
  return await api.get("/api/productos");
}

export async function getProductById(id) {
  return await api.get(`/api/productos/${id}`);
}

export async function getProductsByCatalogo(catalogo) {
  return await api.get(`/api/productos/catalogo/${catalogo}`);
}

export async function getProductsByModelo(modelo) {
  return await api.get(`/api/productos/modelo/${modelo}`);
}

export async function createProduct(productData, isFormData = false) {
  return await api.post(
    "/api/productos",
    productData,
    isFormData ? { headers: { "Content-Type": "multipart/form-data" } } : undefined
  );
}

export async function updateProduct(id, productData, isFormData = false) {
  return await api.put(
    `/api/productos/${id}`,
    productData,
    isFormData ? { headers: { "Content-Type": "multipart/form-data" } } : undefined
  );
}

export async function deleteProduct(id) {
  return await api.delete(`/api/productos/${id}`);
}