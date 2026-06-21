import { useState, useEffect, useCallback } from "react";
import { getPerfilesPintura } from "../../services/perfilesPintura.service.js";

// Cache a nivel módulo: evita refetchear los perfiles en cada montaje.
const CACHE = { data: null, ts: 0 };
const TTL = 5 * 60 * 1000; // 5 minutos

export const invalidatePerfilesPinturaCache = () => {
  CACHE.data = null;
  CACHE.ts = 0;
};

const isFresh = () => CACHE.data && Date.now() - CACHE.ts < TTL;

export const usePerfilesPintura = () => {
  const [perfiles, setPerfiles] = useState(() => CACHE.data ?? []);
  const [loading, setLoading] = useState(() => !isFresh());

  const fetchPerfiles = useCallback(async ({ force = false } = {}) => {
    if (!force && isFresh()) {
      setPerfiles(CACHE.data);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await getPerfilesPintura();
      const data = res.data.perfiles ?? [];
      CACHE.data = data;
      CACHE.ts = Date.now();
      setPerfiles(data);
    } catch {
      setPerfiles([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPerfiles();
  }, [fetchPerfiles]);

  return { perfiles, loading, refetch: () => fetchPerfiles({ force: true }) };
};
