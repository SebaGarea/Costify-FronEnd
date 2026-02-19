import { useEffect, useState, useCallback } from "react";
import { getAllVentasPaginated } from "../../services/ventas.service.js";

export const useGetVentasPaginated = (initialPage = 1, initialLimit = 10) => {
  const [page, setPage] = useState(initialPage);
  const [limit, setLimit] = useState(initialLimit);
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [pendingAmountTotal, setPendingAmountTotal] = useState(0);
  const [statusMetricsGlobal, setStatusMetricsGlobal] = useState(null);
  const [dueSoonCountGlobal, setDueSoonCountGlobal] = useState(0);
  const [dueSoonListGlobal, setDueSoonListGlobal] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchVentas = useCallback(async (p = page, l = limit, options = {}) => {
    const silent = Boolean(options?.silent);
    try {
      if (!silent) setLoading(true);
      const res = await getAllVentasPaginated(p, l);
      setItems(res.items || []);
      setTotal(res.total || 0);
      setTotalPages(res.totalPages || 1);
      setPendingAmountTotal(res.pendingAmountTotal ?? 0);
      setStatusMetricsGlobal(res.statusMetricsGlobal ?? null);
      setDueSoonCountGlobal(res.dueSoonCountGlobal ?? 0);
      setDueSoonListGlobal(res.dueSoonListGlobal ?? []);
    } catch (err) {
      console.error("❌ Error:", err);
      setError(err.response?.data?.error || "Error al cargar las ventas");
    } finally {
      if (!silent) setLoading(false);
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
    pendingAmountTotal,
    statusMetricsGlobal,
    dueSoonCountGlobal,
    dueSoonListGlobal,
    loading,
    error,
    setPage,
    setLimit,
    refetch: (options) => fetchVentas(page, limit, options)
  };
};
