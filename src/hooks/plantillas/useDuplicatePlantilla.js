import React, { useState } from "react";
import { duplicatePlantilla as duplicatePlantillaService } from "../../services/plantillas.service.js";

export const useDuplicatePlantilla = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const duplicatePlantilla = async (id, payload = {}) => {
    setLoading(true);
    setError(null);

    try {
      const response = await duplicatePlantillaService(id, payload);
      return response.data;
    } catch (error) {
      setError(error.response?.data?.error || "Error al duplicar la plantilla");
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { loading, error, duplicatePlantilla };
};
