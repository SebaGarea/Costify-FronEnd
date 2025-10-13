import { useState } from "react";
import { deleteVenta } from "../../services/ventas.service.js";

export const useDeleteVenta = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const removeVenta = async (id) => {
    setLoading(true);
    setError(null);
    try {
      const res = await deleteVenta(id);
      return res;
    } catch (err) {
      console.error("Error al eliminar venta:", err);
      setError(err.response?.data?.error || "Error al eliminar la venta");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { removeVenta, loading, error };
};
