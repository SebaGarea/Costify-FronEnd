import React, { useState } from 'react'
import { updateProduct as updateProductService } from '../../services/products.service.js';
export const useUpdateProduct = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

const updateProduct = async (id, form, isFormData = false) =>{
    setLoading(true);
    setError(null);
    try {
    await updateProductService(id, form, isFormData);  
    return true ;
    } catch (error) {
        setError(error.response?.data?.error || "Error al editar el producto");
        return false;
    } finally {
        setLoading(false);
    }
}

  return { updateProduct, loading, error };
}
