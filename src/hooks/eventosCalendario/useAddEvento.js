import { useState } from "react";
import { createEvento } from "../../services/eventosCalendario.service.js";

export const useAddEvento = () => {
  const [loading, setLoading] = useState(false);

  const addEvento = async (payload) => {
    try {
      setLoading(true);
      return await createEvento(payload);
    } finally {
      setLoading(false);
    }
  };

  return { addEvento, loading };
};
