import { useQuery } from '@tanstack/react-query';
import { getTiposProyecto } from '../../services/plantillas.service.js';

export const useGetTiposProyectoUnicos = () => {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['plantillas-tipos'],
    queryFn: getTiposProyecto,
    staleTime: 5 * 60_000,
    refetchOnWindowFocus: true,
  });

  return {
    tiposProyecto: data ?? [],
    loading: isLoading,
    error: error?.response?.data?.error || (error ? 'Error al cargar los tipos de proyecto' : null),
    refetch,
  };
};
