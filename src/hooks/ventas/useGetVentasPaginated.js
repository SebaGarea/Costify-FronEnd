import { useEffect, useState, useCallback } from "react";
import { getAllVentasPaginated } from "../../services/ventas.service.js";

export const useGetVentasPaginated = (initialPage = 1, initialLimit = 10) => {
  const [page, setPage] = useState(initialPage);
  const [limit, setLimit] = useState(initialLimit);
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchVentas = useCallback(async (p = page, l = limit) => {
    try {
      setLoading(true);
      const res = await getAllVentasPaginated(p, l);
      setItems(res.items || []);
      setTotal(res.total || 0);
      setTotalPages(res.totalPages || 1);
    } catch (err) {
      console.error("❌ Error:", err);
      setError(err.response?.data?.error || "Error al cargar las ventas");
    } finally {
      setLoading(false);
    }
  }, [page, limit]);

  useEffect(() => {
    fetchVentas(page, limit);
  }, [page, limit, fetchVentas]);

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
    refetch: () => fetchVentas(page, limit)
  };
};
