

import { useEffect, useState, useCallback } from 'react'
import { getAllPlantillas } from '../../services/plantillas.service.js';


export const useGetAllPlantillas = (filtros) => {

const [plantillasData, setPlantillasData] = useState([]);
const [loading, setLoading] = useState(false);
const [error, setError] = useState(null);

const fetchPlantillas = useCallback(async() => {
  setLoading(true);
  setError(null);
  try {
    const response = await getAllPlantillas(filtros || {});
    setPlantillasData(response.data);
  } catch (error) {
    console.error("Error al cargar las plantillas:", error);
    setError(error.response?.data?.error || "Error al cargar las plantillas");
  } finally {
    setLoading(false);
  }
}, [filtros]);

  useEffect(() => { 
    fetchPlantillas();
  }, [fetchPlantillas]);

  return { plantillasData, loading, error, refetch: fetchPlantillas };
};
