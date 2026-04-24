import { useState, useEffect, useCallback } from "react";
import { getPerfilesPintura } from "../../services/perfilesPintura.service.js";

export const usePerfilesPintura = () => {
  const [perfiles, setPerfiles] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchPerfiles = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getPerfilesPintura();
      setPerfiles(res.data.perfiles ?? []);
    } catch {
      setPerfiles([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPerfiles();
  }, [fetchPerfiles]);

  return { perfiles, loading, refetch: fetchPerfiles };
};
