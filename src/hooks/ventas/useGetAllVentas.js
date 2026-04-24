import { useEffect, useState, useCallback } from "react";
import { getAllVentas } from "../../services/ventas.service.js";
//hook
const BASE_URL = import.meta.env.VITE_API_URL;

export const useGetAllVentas = () => {
  const [ventasData, setVentasData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchVentas = async () => {
      try {
        setLoading(true);

        const response = await getAllVentas();

        setVentasData(response || []);
      } catch (error) {
        setError(error.response?.data?.error || "Error al cargar las ventas");
      } finally {
        setLoading(false);
      }
    };

    fetchVentas();
  }, []);

  return { ventasData, loading, error };
};
