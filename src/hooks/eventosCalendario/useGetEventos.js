import { useCallback, useEffect, useState } from "react";
import { getEventos } from "../../services/eventosCalendario.service.js";

export const useGetEventos = ({ desde, hasta } = {}) => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const desdeKey = desde ? new Date(desde).toISOString() : "";
  const hastaKey = hasta ? new Date(hasta).toISOString() : "";

  const fetchEventos = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getEventos({ desde: desdeKey, hasta: hastaKey });
      setItems(Array.isArray(res) ? res : []);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.error || "Error al cargar los eventos");
    } finally {
      setLoading(false);
    }
  }, [desdeKey, hastaKey]);

  useEffect(() => {
    fetchEventos();
  }, [fetchEventos]);

  return { items, loading, error, refetch: fetchEventos };
};
