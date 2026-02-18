import { useState } from "react";
import { createTarea } from "../../services/tareas.service.js";

export const useAddTarea = () => {
  const [loading, setLoading] = useState(false);

  const addTarea = async (payload) => {
    try {
      setLoading(true);
      return await createTarea(payload);
    } finally {
      setLoading(false);
    }
  };

  return { addTarea, loading };
};
