import React, { useState } from 'react'

export const useUpdateProduct = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

const updateProduct = async (id, form, isFormData = false) =>{
    setLoading(true);
    setError(null);
    try {
    await updateProduct(id, form, isFormData);   
    } catch (error) {
        setError(error.response?.data?.error || "Error al editar el producto");
    } finally {
        setLoading(false);
    }
}

  return { updateProduct, loading, error };
}
