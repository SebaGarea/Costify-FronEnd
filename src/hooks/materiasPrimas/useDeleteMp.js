import { useState } from "react";
import { deleteRawMaterial as deleteRawMaterialService } from "../../services/products.service.js";

export const useDeleteMp = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const deleteMp = async (id) => {
    setLoading(true);
    setError(null);

    try {
      await deleteRawMaterialService(id);
        return true;
    } catch (error) {
      console.error("Error al eliminar la materia prima:", error);
      setError(error.response?.data?.error || "Error al eliminar la materia prima");
      return false;
    } finally {
      setLoading(false);
    }
  };

  return { deleteMp, loading, error };
};
