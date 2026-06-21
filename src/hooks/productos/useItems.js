import { useState, useEffect } from "react";
import { getAllProducts } from "../../services/products.service.js";

// Cache a nivel módulo: evita refetchear todos los productos en cada montaje
// (p. ej. cada vez que se entra al editor de plantillas).
const CACHE = { data: null, ts: 0 };
const TTL = 5 * 60 * 1000; // 5 minutos

export const invalidateProductsCache = () => {
  CACHE.data = null;
  CACHE.ts = 0;
};

const isFresh = () => CACHE.data && Date.now() - CACHE.ts < TTL;

export const useItems = () => {
  const [productsData, setProductsData] = useState(() => CACHE.data ?? []);
  const [loading, setLoading] = useState(() => !isFresh());

  useEffect(() => {
    if (isFresh()) {
      setProductsData(CACHE.data);
      setLoading(false);
      return;
    }
    let active = true;
    getAllProducts()
      .then((res) => {
        CACHE.data = res.data;
        CACHE.ts = Date.now();
        if (active) setProductsData(res.data);
      })
      .catch(() => {})
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  return { productsData, loading };
};
