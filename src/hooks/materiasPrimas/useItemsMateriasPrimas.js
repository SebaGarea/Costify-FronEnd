import { useState, useEffect, useCallback } from "react";
import { getAllMateriasPrimas } from "../../services/rawMaterials.service.js";
import {
  getCodesForMaterialTypeLabel,
  mapCodesToTypeLabels,
} from "../../constants/materialTypes.js";

//Get all Materias Primas
export const useItemsMateriasPrimas = (pageSize = 10, options = {}) => {
  const { fetchAll = false } = options;
  const [rawsMaterialData, setRawsMaterialData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: pageSize, totalPages: 1 });
  const [filtersMeta, setFiltersMeta] = useState({ availableTypes: [], availableMedidas: [] });
  const [filters, setFilters] = useState({ category: null, type: null, medida: null });

  const buildTypeParam = (typeLabel) => {
    if (!typeLabel) return undefined;
    const codes = getCodesForMaterialTypeLabel(typeLabel);
    if (!Array.isArray(codes) || codes.length === 0) return undefined;
    return codes.join(",");
  };

  const fetchData = useCallback(() => {
    setLoading(true);
    const fetch = async () => {
      try {
        if (fetchAll) {
          const aggregatedItems = [];
          const availableTypeSet = new Set();
          const availableMedidasSet = new Set();
          let currentPage = 1;
          let totalPages = 1;
          let lastPagination = null;

          do {
            const res = await getAllMateriasPrimas({
              page: currentPage,
              limit: pageSize,
              category: filters.category || undefined,
              type: buildTypeParam(filters.type),
              medida: filters.medida || undefined,
            });
            const pageItems = res.data.materiasPrimas || [];
            aggregatedItems.push(...pageItems);
            const rawMeta = res.data.filtersMeta || { availableTypes: [], availableMedidas: [] };
            (rawMeta.availableTypes || []).forEach((code) => availableTypeSet.add(code));
            (rawMeta.availableMedidas || []).forEach((medida) => availableMedidasSet.add(medida));
            lastPagination = res.data.pagination || null;
            totalPages = lastPagination?.totalPages || 1;
            currentPage += 1;
          } while (currentPage <= totalPages);

          setRawsMaterialData(aggregatedItems);
          if (lastPagination) {
            setPagination({
              ...lastPagination,
              total: lastPagination.total ?? aggregatedItems.length,
              page: 1,
              limit: aggregatedItems.length || lastPagination.limit || pageSize,
              totalPages: 1,
            });
          } else {
            setPagination({ total: aggregatedItems.length, page: 1, limit: aggregatedItems.length, totalPages: 1 });
          }
          setFiltersMeta({
            availableTypes: mapCodesToTypeLabels(Array.from(availableTypeSet)),
            availableMedidas: Array.from(availableMedidasSet),
          });
          return;
        }

        const res = await getAllMateriasPrimas({
          page,
          limit: pageSize,
          category: filters.category || undefined,
          type: buildTypeParam(filters.type),
          medida: filters.medida || undefined,
        });
        setRawsMaterialData(res.data.materiasPrimas || []);
        setPagination(res.data.pagination || { total: 0, page, limit: pageSize, totalPages: 1 });
        const rawMeta = res.data.filtersMeta || { availableTypes: [], availableMedidas: [] };
        setFiltersMeta({
          availableTypes: mapCodesToTypeLabels(rawMeta.availableTypes || []),
          availableMedidas: rawMeta.availableMedidas || [],
        });
      } catch (error) {
        console.error("Error al cargar materias primas", error);
        setRawsMaterialData([]);
      } finally {
        setLoading(false);
      }
    };

    fetch();
  }, [fetchAll, filters.category, filters.medida, filters.type, page, pageSize]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const updateFilters = (partialFilters) => {
    setPage(1);
    setFilters((prev) => ({ ...prev, ...partialFilters }));
  };

  return {
    rawsMaterialData,
    loading,
    page,
    pagination,
    filtersMeta,
    filters,
    setPage,
    updateFilters,
    refetch: fetchData,
  };
};
