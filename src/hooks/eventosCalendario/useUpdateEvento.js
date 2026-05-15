import { useState } from "react";
import { updateEvento } from "../../services/eventosCalendario.service.js";

export const useUpdateEvento = () => {
  const [loading, setLoading] = useState(false);

  const editEvento = async (id, payload) => {
    try {
      setLoading(true);
      return await updateEvento(id, payload);
    } finally {
      setLoading(false);
    }
  };

  return { editEvento, loading };
};
