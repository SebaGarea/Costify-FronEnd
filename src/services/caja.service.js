import api from "./auth.service";

export const getCuentasCaja = (params) => api.get("/api/caja/cuentas", { params });
export const createCuentaCaja = (data) => api.post("/api/caja/cuentas", data);
export const updateCuentaCaja = (id, data) => api.put(`/api/caja/cuentas/${id}`, data);
export const ajustarSaldoCuenta = (id, saldoReal) =>
  api.post(`/api/caja/cuentas/${id}/ajuste`, { saldoReal });
export const setCuentaCobroDefault = (cuentaId) =>
  api.put("/api/caja/cuenta-cobro-default", { cuentaId });

export const getCategoriasCaja = (params) => api.get("/api/caja/categorias", { params });
export const createCategoriaCaja = (data) => api.post("/api/caja/categorias", data);
export const updateCategoriaCaja = (id, data) => api.put(`/api/caja/categorias/${id}`, data);
export const deleteCategoriaCaja = (id) => api.delete(`/api/caja/categorias/${id}`);

export const getMovimientosCaja = (params) => api.get("/api/caja/movimientos", { params });
export const createMovimientoCaja = (data) => api.post("/api/caja/movimientos", data);
export const updateMovimientoCaja = (id, data) => api.put(`/api/caja/movimientos/${id}`, data);
export const deleteMovimientoCaja = (id) => api.delete(`/api/caja/movimientos/${id}`);

export const getResumenCaja = (params) => api.get("/api/caja/resumen", { params });

// Registra una compra de la lista de compras como egreso (categoría Materiales).
export const registrarCompraCaja = (data) => api.post("/api/caja/compras", data);

// Integración con Mercado Pago: estado y sincronización manual.
export const getMercadoPagoEstado = () => api.get("/api/caja/mercadopago");
export const syncMercadoPago = () => api.post("/api/caja/mercadopago/sync");
