import React from 'react'
import { updatePlantilla as updatePlantillaService } from '../../services/plantillas.service.js';


export const useUpdatePlantilla = () => {
    const [loading, setLoading] = React.useState(false);
    const [error, setError] = React.useState(null);

    const updatePlantilla = async (id, plantillaData, isFormData = false) => {  
        setLoading(true);
        setError(null);
        try {
            await updatePlantillaService(id, plantillaData, isFormData);
            return true;
        } catch (error) {
            
            setError(error.response?.data?.message || error.response?.data?.error || error.message || 'Error al actualizar la plantilla');
            return false;
        } finally {
            setLoading(false);
        }
    }
  return { loading, error, updatePlantilla }   
}
