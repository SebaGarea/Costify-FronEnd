import { useState } from "react";
import { getUpdateVentas } from "../../services/ventas.service.js";

export const useUpdateVentas = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const updateVenta = async (id, ventasData) => {
    setLoading(true);
    setError(null);
    try {
      await getUpdateVentas(id, ventasData);
    } catch (err) {
      setError(err.message || "Error al actualizar la venta");
    } finally {
      setLoading(false);
    }
  };

  return { updateVenta, loading, error };
};
