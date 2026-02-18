import { useCallback, useEffect, useState } from "react";
import { getAllTareasPaginated } from "../../services/tareas.service.js";

export const useGetTareasPaginated = (initialPage = 1, initialLimit = 15) => {
  const [page, setPage] = useState(initialPage);
  const [limit, setLimit] = useState(initialLimit);
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchTareas = useCallback(
    async (p = page, l = limit) => {
      try {
        setLoading(true);
        const res = await getAllTareasPaginated(p, l);
        setItems(res.items || []);
        setTotal(res.total || 0);
        setTotalPages(res.totalPages || 1);
        setError(null);
      } catch (err) {
        console.error("❌ Error:", err);
        setError(err.response?.data?.error || "Error al cargar las tareas");
      } finally {
        setLoading(false);
      }
    },
    [page, limit]
  );

  useEffect(() => {
    fetchTareas(page, limit);
  }, [page, limit, fetchTareas]);

  return {
    page,
    limit,
    items,
    total,
    totalPages,
    loading,
    error,
    setPage,
    setLimit,
    refetch: () => fetchTareas(page, limit),
  };
};
