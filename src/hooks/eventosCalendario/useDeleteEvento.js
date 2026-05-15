import { useState } from "react";
import { deleteEvento } from "../../services/eventosCalendario.service.js";

export const useDeleteEvento = () => {
  const [loading, setLoading] = useState(false);

  const removeEvento = async (id) => {
    try {
      setLoading(true);
      return await deleteEvento(id);
    } finally {
      setLoading(false);
    }
  };

  return { removeEvento, loading };
};
