import { useEffect, useState, useCallback } from "react";
import { getAllVentasPaginated } from "../../services/ventas.service.js";

// filtro: todas | sin_despachar | pendiente | en_proceso | finalizada | despachada | cancelada | con_saldo
export const useGetVentasPaginated = (initialPage = 1, initialLimit = 10, initialFiltro = "todas") => {
  const [page, setPage] = useState(initialPage);
  const [filtro, setFiltroState] = useState(initialFiltro);
  const [conteosFiltro, setConteosFiltro] = useState({});
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
      const res = await getAllVentasPaginated(p, l, filtro);
      setItems(res.items || []);
      setTotal(res.total || 0);
      setTotalPages(res.totalPages || 1);
      setPendingAmountTotal(res.pendingAmountTotal ?? 0);
      setStatusMetricsGlobal(res.statusMetricsGlobal ?? null);
      setDueSoonCountGlobal(res.dueSoonCountGlobal ?? 0);
      setDueSoonListGlobal(res.dueSoonListGlobal ?? []);
      setConteosFiltro(res.conteosFiltro ?? {});
    } catch (err) {
      setError(err.response?.data?.error || "Error al cargar las ventas");
    } finally {
      if (!silent) setLoading(false);
    }
  }, [page, limit, filtro]);

  // Al cambiar de filtro se vuelve a la primera página.
  const setFiltro = useCallback((nuevo) => {
    setFiltroState(nuevo || "todas");
    setPage(1);
  }, []);

  useEffect(() => {
    fetchVentas(page, limit);
  }, [page, limit, fetchVentas]);

  return {
    page,
    limit,
    filtro,
    setFiltro,
    conteosFiltro,
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
