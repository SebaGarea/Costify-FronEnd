import  { useState } from 'react'
import { deleteVenta } from '../../services/ventas.service.js';

export const useDeleteVenta = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const removeVenta = async (id) => {
    setLoading(true);
    setError(null);

    try {
      const response = await deleteVenta(id);
      return response;
    } catch (error) {
      setError(error);
    } finally {
      setLoading(false);
    }
  };

  return { removeVenta, loading, error };
}
