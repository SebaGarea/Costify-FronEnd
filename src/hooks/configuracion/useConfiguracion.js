import { useEffect, useState, useCallback } from "react";
import { getConfiguracion } from "../../services/configuracion.service.js";

export const useConfiguracion = () => {
  const [config, setConfig] = useState({ precioPinturaM2: 15000 });
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await getConfiguracion();
      setConfig(data);
    } catch {
      /* mantiene el valor por defecto */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { config, loading, refetch: fetch };
};
