import { useState, useCallback } from "react";
import { useToast } from "@chakra-ui/react";
import { Loader, ItemListContainerRawMaterials } from "../components";
import { useItemsMateriasPrimas } from "../hooks/materiasPrimas";
import { deleteAllRawMaterials, getAllMateriasPrimas } from "../services/rawMaterials.service";
import { getCodesForMaterialTypeLabel } from "../constants/materialTypes";

export const RawMaterials = () => {
    const toast = useToast();
    const [isBulkDeleting, setIsBulkDeleting] = useState(false);
    const [isExporting, setIsExporting] = useState(false);
    const {
        rawsMaterialData,
        loading,
        pagination,
        filters,
        filtersMeta,
        setPage,
        updateFilters,
        refetch,
    } = useItemsMateriasPrimas(10);

    const buildTypeParam = (typeLabel) => {
        if (!typeLabel) return undefined;
        const codes = getCodesForMaterialTypeLabel(typeLabel);
        if (!Array.isArray(codes) || codes.length === 0) return undefined;
        return codes.join(",");
    };

    const normalizeFamilyLabel = (value = "") =>
        value
            .toString()
            .trim()
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/\s+/g, "_");

    const buildFamilyValue = (item) => {
        const rawType = item?.type ?? "";
        const normalizedType = normalizeFamilyLabel(rawType);
        if (/^\d{4}$/.test(normalizedType)) {
            return normalizedType;
        }

        const categoria = normalizeFamilyLabel(item?.categoria ?? "");
        const categoryMap = {
            madera: "maderas",
            maderas: "maderas",
            proteccion: "proteccion",
            protecciones: "proteccion",
            herrajes: "herrajes",
            insumos: "insumos",
            hierro: "hierro",
            canos: "canos",
            cano: "canos",
        };

        return categoryMap[categoria] || normalizedType || categoria || "";
    };

    const buildDescripcion = (item) => {
        const nombre = item?.nombre ?? "";
        const medida = item?.medida ?? "";
        const espesor = item?.espesor ?? "";
        if (!medida && !espesor) return nombre;
        const size = `${medida}${espesor ? `x${espesor}` : ""}`;
        return nombre ? `${nombre} ${size}` : size;
    };

    const handleExport = useCallback(async () => {
        setIsExporting(true);
        try {
            const categoryParam = filters.category || undefined;
            const typeParam = buildTypeParam(filters.type);
            const medidaParam = filters.medida || undefined;
            const limit = 100;

            const firstResponse = await getAllMateriasPrimas({
                page: 1,
                limit,
                category: categoryParam,
                type: typeParam,
                medida: medidaParam,
            });

            const firstItems = firstResponse.data.materiasPrimas || [];
            const totalPages = firstResponse.data.pagination?.totalPages || 1;
            const allItems = [...firstItems];

            if (totalPages > 1) {
                const requests = [];
                for (let page = 2; page <= totalPages; page += 1) {
                    requests.push(
                        getAllMateriasPrimas({
                            page,
                            limit,
                            category: categoryParam,
                            type: typeParam,
                            medida: medidaParam,
                        })
                    );
                }
                const responses = await Promise.all(requests);
                responses.forEach((res) => {
                    const pageItems = res.data.materiasPrimas || [];
                    allItems.push(...pageItems);
                });
            }

            if (!allItems.length) {
                toast({
                    title: "No hay materias primas para exportar",
                    status: "info",
                    duration: 4000,
                    isClosable: true,
                });
                return;
            }

            const XLSX = await import("xlsx-js-style");
            const rows = [
                ["FAMILIA", "DESCRIPCION", "PRECIO_X_BARRA_FINAL"],
                ...allItems.map((item) => [
                    buildFamilyValue(item),
                    buildDescripcion(item),
                    Number(item?.precio ?? 0) || 0,
                ]),
            ];

            const workbook = XLSX.utils.book_new();
            const worksheet = XLSX.utils.aoa_to_sheet(rows);
            XLSX.utils.book_append_sheet(workbook, worksheet, "MateriasPrimas");
            const timestamp = new Date().toISOString().split("T")[0];
            XLSX.writeFile(workbook, `materias-primas-${timestamp}.xlsx`);
        } catch (error) {
            console.error("Error al exportar materias primas", error);
            toast({
                title: "No se pudo exportar",
                description: "Intentá nuevamente en unos segundos.",
                status: "error",
                duration: 4000,
                isClosable: true,
            });
        } finally {
            setIsExporting(false);
        }
    }, [filters.category, filters.medida, filters.type, toast]);

    const handleDeleteAll = useCallback(async () => {
        try {
            setIsBulkDeleting(true);
            await deleteAllRawMaterials();
            toast({
                title: "Materias primas eliminadas",
                description: "Se eliminaron todos los registros correctamente.",
                status: "success",
                duration: 4000,
                isClosable: true,
            });
            await refetch();
        } catch (error) {
            console.error("Error eliminando materias primas", error);
            toast({
                title: "Error al eliminar",
                description: error?.response?.data?.message || "No se pudieron eliminar las materias primas.",
                status: "error",
                duration: 5000,
                isClosable: true,
            });
        } finally {
            setIsBulkDeleting(false);
        }
    }, [refetch, toast]);

    if (loading && rawsMaterialData.length === 0) {
        return <Loader />;
    }

    return (
        <ItemListContainerRawMaterials
            rawMaterials={rawsMaterialData}
            pagination={pagination}
            filters={filters}
            filtersMeta={filtersMeta}
            onPageChange={setPage}
            onFiltersChange={updateFilters}
            isLoading={loading}
            onExport={handleExport}
            isExporting={isExporting}
            onDeleteAll={handleDeleteAll}
            isDeletingAll={isBulkDeleting}
        />
    );
};

