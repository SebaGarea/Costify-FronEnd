import React, { useState } from 'react'
import { createPlantilla } from '../../services/plantillas.service.js';

export const useAddPlantilla = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null); 


    const addPlantilla = async (plantillaData) => {
        setLoading(true);
        setError(null);
        try {
            const response = await createPlantilla(plantillaData);
            return response.data; // Devolver los datos de la respuesta
        } catch (error) {
            setError(error.response?.data?.error || "Error al crear la plantilla");
            console.error("Error al crear la plantilla:", error);
            return false;
        } finally {
            setLoading(false);
        }
    };

  return { loading, error, addPlantilla };
}
