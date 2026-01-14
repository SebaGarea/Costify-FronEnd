import { useState } from 'react'
import { updateRawMaterial as updateRawMaterialServices  } from '../../services/rawMaterials.service.js'

export const useUpdateRawMaterials = () => {
    const[loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

        const updateRawMaterial = async (id, form, isFormData = false) => {
        setLoading(true);
        setError(null);
        try {
                        const payload = isFormData
                            ? form
                            : Object.fromEntries(
                                    Object.entries(form).filter(([, value]) =>
                                        value !== "" && value !== null && value !== undefined
                                    )
                                );
                        await updateRawMaterialServices(id, payload, isFormData);
            return true;
        } catch (error) {
            const validationErrors = error.response?.data?.errores;
            if (Array.isArray(validationErrors) && validationErrors.length > 0) {
                setError(validationErrors.map((err) => err.msg).join(". "));
            } else {
                setError(
                    error.response?.data?.error ||
                    error.response?.data?.mensaje ||
                    "Error al editar la materia prima"
                );
            }
        return false
        } finally {
            setLoading(false);
        }
    };

    return { loading, error, updateRawMaterial };
}
