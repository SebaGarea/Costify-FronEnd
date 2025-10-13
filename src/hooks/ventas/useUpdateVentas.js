import { useState } from "react";
import { getUpdateVentas } from "../../services/ventas.service.js";

export const useUpdateVentas = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const updateVenta = async (id, ventasData) => {
    setLoading(true);
    setError(null);
    try {
      const res = await getUpdateVentas(id, ventasData);
      return res.data || res;
    } catch (err) {
      console.error("Error actualizando venta:", err);
      setError(err.response?.data?.error || "Error al actualizar la venta");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { updateVenta, loading, error };
};
