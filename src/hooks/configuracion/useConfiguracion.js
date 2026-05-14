import { useEffect, useState, useCallback } from "react";
import { getConfiguracion } from "../../services/configuracion.service.js";
import { buildDefaultPlataformasConfig } from "../../constants/platformPricing.js";

const DEFAULT_CONFIG = {
  precioPinturaM2: 15000,
  porcentajesPlataformas: buildDefaultPlataformasConfig(),
};

export const useConfiguracion = () => {
  const [config, setConfig] = useState(DEFAULT_CONFIG);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await getConfiguracion();
      setConfig({
        ...DEFAULT_CONFIG,
        ...data,
        porcentajesPlataformas: {
          ...DEFAULT_CONFIG.porcentajesPlataformas,
          ...(data?.porcentajesPlataformas ?? {}),
        },
      });
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
