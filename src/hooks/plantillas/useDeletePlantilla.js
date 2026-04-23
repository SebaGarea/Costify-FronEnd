import React, { useState } from 'react'
import { deletePlantilla as deletePlantillaService } from '../../services/plantillas.service.js';


export const useDeletePlantilla = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    
    const deletePlantilla = async (id) => {
        setLoading(true);
        setError(null);

        try {
            await deletePlantillaService(id);
            return true;
        }catch (error) {
            setError(error.response?.data?.error || 'Error al eliminar la plantilla');
            return false;
        }finally {
            setLoading(false);
        }
    }


  return { loading, error, deletePlantilla }
}
