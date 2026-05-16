import { useEffect, useRef, useState } from "react";
import { previewPlantilla } from "../../services/plantillas.service.js";

const EMPTY_PREVIEW = {
  precioFinal: 0,
  costoTotal: 0,
  ganancia: 0,
  costoMateriales: 0,
  extrasTotal: 0,
  totalPinturaHorno: 0,
  subtotalesPorCategoria: {},
  precioFinalesPorCategoria: {},
};

export const usePlantillaPreview = (payload, debounceMs = 300) => {
  const [preview, setPreview] = useState(EMPTY_PREVIEW);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const requestIdRef = useRef(0);

  const payloadKey = JSON.stringify(payload ?? null);

  useEffect(() => {
    if (!payload) {
      setPreview(EMPTY_PREVIEW);
      return;
    }

    const handle = setTimeout(async () => {
      const reqId = ++requestIdRef.current;
      setLoading(true);
      try {
        const response = await previewPlantilla(payload);
        if (reqId === requestIdRef.current) {
          setPreview(response.data ?? EMPTY_PREVIEW);
          setError(null);
        }
      } catch (err) {
        if (reqId === requestIdRef.current) {
          setError(err?.response?.data?.error || "Error al calcular preview");
        }
      } finally {
        if (reqId === requestIdRef.current) {
          setLoading(false);
        }
      }
    }, debounceMs);

    return () => clearTimeout(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [payloadKey, debounceMs]);

  return { preview, loading, error };
};
