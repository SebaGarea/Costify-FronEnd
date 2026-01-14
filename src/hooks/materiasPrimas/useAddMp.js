import { useState } from "react";
import { createRawMaterial } from "../../services/rawMaterials.service.js";

export const useAddMp = () => {
    const[loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const addRawMaterial = async (form, isFormData = false) =>{
        setLoading(true);
        setError(null);
        try {
            await createRawMaterial(form, isFormData);
            return true
        } catch (error) {
            const validationErrors = error.response?.data?.errores;
            if (Array.isArray(validationErrors) && validationErrors.length > 0) {
                setError(validationErrors.map((err) => err.msg).join(". "));
            } else {
                setError(
                    error.response?.data?.error ||
                    error.response?.data?.mensaje ||
                    "Error al agregar la materia prima"
                );
            }
            return false;
        } finally {
            setLoading(false);
        }
    }

return { addRawMaterial, loading, error };
}