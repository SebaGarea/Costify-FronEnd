import { useState } from "react";
import { deleteProduct as deleteProductService } from "../../services/products.service.js";
export const useDeleteProduct = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const deleteProduct = async (id) => {
    setLoading(true);
    setError(null);
    try {
      await deleteProductService(id);
      return true;
    } catch (error) {
      console.error("Error al eliminar el producto:", error);
      return false;
    } finally {
      setLoading(false);
    }
  };

  return { deleteProduct, loading, error };
};
