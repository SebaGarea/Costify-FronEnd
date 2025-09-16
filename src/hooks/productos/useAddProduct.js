import { useState } from "react";
import { createProduct } from "../../services/products.service.js";

export const useAddProduct = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

const addProduct = async (form, isFormData = false) =>{
    setLoading(true);
    setError(null);
    try {
        await createProduct(form, isFormData);
        return true;
    } catch (error) {
        setError(error.response?.data?.error || "Error al agregar el producto");
        return false;
    } finally {
        setLoading(false);  
    }
}

  return { addProduct, loading, error };
}
