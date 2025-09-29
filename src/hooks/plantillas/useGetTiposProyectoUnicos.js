import { useEffect, useState, useCallback } from 'react'
import { getAllPlantillas } from '../../services/plantillas.service.js';

export const useGetTiposProyectoUnicos = () => {
  const [tiposProyecto, setTiposProyecto] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchTiposProyecto = useCallback(async() => {
    setLoading(true);
    setError(null);
    try {
      // Obtenemos todas las plantillas sin filtros
      const response = await getAllPlantillas({});
      const plantillas = response.data;
      
      // Extraemos los tipos de proyecto únicos
      const tiposUnicos = [...new Set(
        plantillas
          .map(plantilla => plantilla.tipoProyecto)
          .filter(tipo => tipo && tipo.trim() !== '' && tipo !== 'Otro')
      )].sort();
      
      setTiposProyecto(tiposUnicos);
    } catch (error) {
      console.error("Error al cargar los tipos de proyecto:", error);
      setError(error.response?.data?.error || "Error al cargar los tipos de proyecto");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { 
    fetchTiposProyecto();
  }, [fetchTiposProyecto]);

  // Refrescar automáticamente cuando la ventana recibe foco (útil cuando se navega entre páginas)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        fetchTiposProyecto();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [fetchTiposProyecto]);

  return { tiposProyecto, loading, error, refetch: fetchTiposProyecto };
};