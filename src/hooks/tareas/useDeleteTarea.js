import { useState } from "react";
import { deleteTarea } from "../../services/tareas.service.js";

export const useDeleteTarea = () => {
  const [loading, setLoading] = useState(false);

  const removeTarea = async (id) => {
    try {
      setLoading(true);
      return await deleteTarea(id);
    } finally {
      setLoading(false);
    }
  };

  return { removeTarea, loading };
};
