import { useState } from "react";
import { createRawMaterial } from "../../services/products.service.js";

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
            setError(error.response?.data?.error || "Error al agregar la materia prima");
            return false;
        } finally {
            setLoading(false);
        }
    }

return { addRawMaterial, loading, error };
}