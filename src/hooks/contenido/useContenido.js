import { useCallback, useEffect, useState } from "react";
import {
  getAllContenido,
  createContenido,
  updateContenido,
  deleteContenido,
  getUsuarios,
} from "../../services/contenido.service.js";

export const useContenido = () => {
  const [contenidos, setContenidos] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchContenidos = useCallback(async () => {
    try {
      setLoading(true);
      // Sin page/limit => devuelve todas (para el tablero kanban)
      const data = await getAllContenido({ sort: "kanban" });
      setContenidos(Array.isArray(data) ? data : data?.items ?? []);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.error || "Error al cargar las publicaciones");
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchUsuarios = useCallback(async () => {
    try {
      const data = await getUsuarios();
      setUsuarios(Array.isArray(data) ? data : []);
    } catch {
      setUsuarios([]);
    }
  }, []);

  useEffect(() => {
    fetchContenidos();
    fetchUsuarios();
  }, [fetchContenidos, fetchUsuarios]);

  const addContenido = useCallback(
    async (payload) => {
      const created = await createContenido(payload);
      await fetchContenidos();
      return created;
    },
    [fetchContenidos]
  );

  const editContenido = useCallback(
    async (id, payload) => {
      const updated = await updateContenido(id, payload);
      await fetchContenidos();
      return updated;
    },
    [fetchContenidos]
  );

  // Update optimista (para drag&drop entre columnas, sin parpadeo)
  const moveContenido = useCallback(
    async (id, estado) => {
      setContenidos((prev) =>
        prev.map((c) => (c._id === id ? { ...c, estado } : c))
      );
      try {
        await updateContenido(id, { estado });
      } catch {
        await fetchContenidos(); // revertir si falla
      }
    },
    [fetchContenidos]
  );

  const removeContenido = useCallback(
    async (id) => {
      await deleteContenido(id);
      await fetchContenidos();
    },
    [fetchContenidos]
  );

  return {
    contenidos,
    usuarios,
    loading,
    error,
    refetch: fetchContenidos,
    addContenido,
    editContenido,
    moveContenido,
    removeContenido,
  };
};
