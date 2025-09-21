import { useState } from 'react'
import { updateRawMaterial as updateRawMaterialServices  } from '../../services/rawMaterials.service.js'

export const useUpdateRawMaterials = () => {
    const[loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const updateRawMaterial = async (id, form, isFormData = false) => {
        setLoading(true);
        setError(null);
        try {
            await updateRawMaterialServices(id, form, isFormData);
            return true;
        } catch (error) {
            setError(error.response?.data?.error || "Error al editar la materia prima") ;
        return false
        } finally {
            setLoading(false);
        }
    };

    return { loading, error, updateRawMaterial };
}
