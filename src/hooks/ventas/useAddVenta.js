import { useState } from "react";
import { createVenta } from "../../services/ventas.service.js";

export const useAddVenta = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const addVenta = async (form) => {
    setLoading(true);
    setError(null);

    try {
      const response = await createVenta(form);
      return response;
    } catch (error) {
      setError(error.response?.data?.error || "Error al agregar la venta");
      return false;
    } finally {
      setLoading(false);
    }
  };
  return { addVenta, loading, error };
};
