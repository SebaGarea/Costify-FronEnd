import { useQuery } from '@tanstack/react-query';
import { getAllPlantillas } from '../../services/plantillas.service.js';

export const useGetAllPlantillas = (filtros) => {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['plantillas', filtros?.tipoProyecto, filtros?.search],
    queryFn: () => getAllPlantillas(filtros || {}),
    select: (response) => response.data,
    staleTime: 30_000,
  });

  return {
    plantillasData: data ?? [],
    loading: isLoading,
    error: error?.response?.data?.error || (error ? 'Error al cargar las plantillas' : null),
    refetch,
  };
};
