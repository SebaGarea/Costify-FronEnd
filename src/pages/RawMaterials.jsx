import { useState, useCallback } from "react";
import { useToast } from "@chakra-ui/react";
import { Loader, ItemListContainerRawMaterials } from "../components";
import { useItemsMateriasPrimas } from "../hooks/materiasPrimas";
import { deleteAllRawMaterials } from "../services/rawMaterials.service";

export const RawMaterials = () => {
    const toast = useToast();
    const [isBulkDeleting, setIsBulkDeleting] = useState(false);
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
            onDeleteAll={handleDeleteAll}
            isDeletingAll={isBulkDeleting}
        />
    );
};

