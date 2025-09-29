import { useEffect, useState } from "react";
import { getPlantillaById } from "../../services/plantillas.service.js";

export const useGetPlantillaById = (id) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [plantillaData, setPlantillaData] = useState(null);

  useEffect(() => {
    if (!id) {
      setLoading(false);
      setError("No se proporcionó un ID válido");
      return;
    }

    const fetchPlantilla = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await getPlantillaById(id);
        setPlantillaData(response.data);
      } catch (error) {
        setError(
          error.response?.data?.error || "Error al obtener la plantilla"
        );
        console.error("Error al obtener la plantilla:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchPlantilla();
  }, [id]);

  return { loading, error, plantillaData };
};
