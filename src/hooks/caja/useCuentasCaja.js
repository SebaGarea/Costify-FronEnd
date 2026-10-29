import { useCallback, useEffect, useState } from "react";
import { getCuentasCaja } from "../../services/caja.service.js";
import { useDataChanged } from "../useDataChanged.js";

// Cuentas de Caja con su saldo, totales (efectivo / digital) y la cuenta de cobro
// por defecto. Lo usan Caja, Ventas y la Lista de compras.
export const useCuentasCaja = ({ incluirArchivadas = false } = {}) => {
  const [cuentas, setCuentas] = useState([]);
  const [totales, setTotales] = useState({ total: 0, efectivo: 0, digital: 0 });
  const [cuentaCobroDefault, setCuentaCobroDefault] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchCuentas = useCallback(async () => {
    try {
      const res = await getCuentasCaja(incluirArchivadas ? { archivadas: "true" } : undefined);
      setCuentas(res.data?.cuentas ?? []);
      setTotales(res.data?.totales ?? { total: 0, efectivo: 0, digital: 0 });
      setCuentaCobroDefault(res.data?.cuentaCobroDefault ?? null);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.mensaje || "No se pudieron cargar las cuentas");
    } finally {
      setLoading(false);
    }
  }, [incluirArchivadas]);

  useEffect(() => {
    fetchCuentas();
  }, [fetchCuentas]);

  // Si el asistente registra un gasto o un cobro, los saldos cambian.
  useDataChanged(() => fetchCuentas(), ["caja", "venta"]);

  return {
    cuentas,
    cuentasActivas: cuentas.filter((c) => c.activa),
    totales,
    cuentaCobroDefault,
    loading,
    error,
    refetch: fetchCuentas,
  };
};
