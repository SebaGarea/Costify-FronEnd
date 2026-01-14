import { useState, useEffect } from "react";
import { getAllMateriasPrimas } from "../../services/rawMaterials.service.js";

//Get all Materias Primas
export const useItemsMateriasPrimas = () => {
  const [rawsMaterialData, setRawsMaterialData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAllMateriasPrimas()
      .then((res) => {
        setRawsMaterialData(res.data.materiasPrimas || []);
      })
      .catch((error) => {
        console.error("Error al cargar materias primas", error);
        setRawsMaterialData([]);
      })
      .finally(() => setLoading(false));
  }, []);

  return { rawsMaterialData, loading };
}
