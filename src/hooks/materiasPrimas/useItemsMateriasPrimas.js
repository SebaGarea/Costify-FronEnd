import { useState, useEffect, useCallback } from "react";
import { getAllMateriasPrimas, getMateriasPrimasMeta } from "../../services/rawMaterials.service.js";
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
  const [filtersMeta, setFiltersMeta] = useState({ availableTypes: [], availableMedidas: [], availableNombresMadera: [] });
  const [filters, setFilters] = useState({ category: null, type: null, medida: null, nombreMadera: null });

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
        const categoryParam = filters.category || undefined;
        const typeParam = buildTypeParam(filters.type);
        const medidaParam = filters.medida || undefined;
        const nombreMaderaParam = filters.nombreMadera || undefined;

        if (fetchAll) {
          const aggregatedItems = [];
          const availableTypeSet = new Set();
          const availableMedidasSet = new Set();
          let lastPagination = null;
          const metaRequest = getMateriasPrimasMeta({
            category: categoryParam,
            type: typeParam,
            medida: medidaParam,
            nombreMadera: nombreMaderaParam,
          }).catch((metaError) => {
            console.error("Error al obtener metadatos de materias primas", metaError);
            return null;
          });

          const firstResponse = await getAllMateriasPrimas({
            page: 1,
            limit: pageSize,
            category: categoryParam,
            type: typeParam,
            medida: medidaParam,
            nombreMadera: nombreMaderaParam,
          });
          const firstItems = firstResponse.data.materiasPrimas || [];
          aggregatedItems.push(...firstItems);
          const firstMeta = firstResponse.data.filtersMeta || { availableTypes: [], availableMedidas: [] };
          (firstMeta.availableTypes || []).forEach((code) => availableTypeSet.add(code));
          (firstMeta.availableMedidas || []).forEach((medida) => availableMedidasSet.add(medida));
          lastPagination = firstResponse.data.pagination || null;
          const totalPages = lastPagination?.totalPages || 1;

          if (totalPages > 1) {
            const remainingRequests = [];
            for (let nextPage = 2; nextPage <= totalPages; nextPage += 1) {
              remainingRequests.push(
                getAllMateriasPrimas({
                  page: nextPage,
                  limit: pageSize,
                  category: categoryParam,
                  type: typeParam,
                  medida: medidaParam,
                  nombreMadera: nombreMaderaParam,
                })
              );
            }

            const remainingResponses = await Promise.all(remainingRequests);
            remainingResponses.forEach((res) => {
              const pageItems = res.data.materiasPrimas || [];
              aggregatedItems.push(...pageItems);
              const rawMeta = res.data.filtersMeta || { availableTypes: [], availableMedidas: [] };
              (rawMeta.availableTypes || []).forEach((code) => availableTypeSet.add(code));
              (rawMeta.availableMedidas || []).forEach((medida) => availableMedidasSet.add(medida));
            });
          }

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
          const metaResponse = await metaRequest;
          const fetchedMeta = metaResponse?.data?.filtersMeta || { availableTypes: [], availableMedidas: [], availableNombresMadera: [] };
          const finalMeta = {
            availableTypes: (fetchedMeta.availableTypes?.length ? fetchedMeta.availableTypes : Array.from(availableTypeSet)) || [],
            availableMedidas: (fetchedMeta.availableMedidas?.length ? fetchedMeta.availableMedidas : Array.from(availableMedidasSet)) || [],
            availableNombresMadera: fetchedMeta.availableNombresMadera || [],
          };
          setFiltersMeta({
            availableTypes: mapCodesToTypeLabels(finalMeta.availableTypes),
            availableMedidas: finalMeta.availableMedidas,
            availableNombresMadera: finalMeta.availableNombresMadera,
          });
          return;
        }

        const res = await getAllMateriasPrimas({
          page,
          limit: pageSize,
          category: categoryParam,
          type: typeParam,
          medida: medidaParam,
          nombreMadera: nombreMaderaParam,
        });
        setRawsMaterialData(res.data.materiasPrimas || []);
        setPagination(res.data.pagination || { total: 0, page, limit: pageSize, totalPages: 1 });
        const rawMeta = res.data.filtersMeta || { availableTypes: [], availableMedidas: [], availableNombresMadera: [] };
        setFiltersMeta({
          availableTypes: mapCodesToTypeLabels(rawMeta.availableTypes || []),
          availableMedidas: rawMeta.availableMedidas || [],
          availableNombresMadera: rawMeta.availableNombresMadera || [],
        });
      } catch (error) {
        console.error("Error al cargar materias primas", error);
        setRawsMaterialData([]);
      } finally {
        setLoading(false);
      }
    };

    fetch();
  }, [fetchAll, filters.category, filters.medida, filters.type, filters.nombreMadera, page, pageSize]);

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
