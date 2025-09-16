import { useState, useEffect } from "react";
import { getAllMateriasPrimas } from "../../services/products.service.js";

//Get all Materias Primas
export const useItemsMateriasPrimas = () => {
  const [rawsMaterialData, setRawsMaterialData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAllMateriasPrimas()
      .then((res) => {
        setRawsMaterialData(res.data.materiasPrimas);
      })
      .catch((error) => {
        console.log(error);
      })
      .finally(() => setLoading(false));
  }, []);

  return { rawsMaterialData, loading };
}
