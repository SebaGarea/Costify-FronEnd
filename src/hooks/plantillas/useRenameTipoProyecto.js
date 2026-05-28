import { useState } from 'react';
import { renameTipoProyecto } from '../../services/plantillas.service.js';

export const useRenameTipoProyecto = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const renameTipo = async (tipoActual, tipoNuevo) => {
    setLoading(true);
    setError(null);
    try {
      const response = await renameTipoProyecto(tipoActual, tipoNuevo);
      return response.data.modifiedCount;
    } catch (err) {
      setError(err.response?.data?.error || "Error al renombrar el tipo de proyecto");
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { renameTipo, loading, error };
};
