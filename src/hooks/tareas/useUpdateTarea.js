import { useState } from "react";
import { updateTarea } from "../../services/tareas.service.js";

export const useUpdateTarea = () => {
  const [loading, setLoading] = useState(false);

  const editTarea = async (id, payload) => {
    try {
      setLoading(true);
      return await updateTarea(id, payload);
    } finally {
      setLoading(false);
    }
  };

  return { editTarea, loading };
};
