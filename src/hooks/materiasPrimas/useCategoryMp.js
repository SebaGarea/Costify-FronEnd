import { useEffect, useState } from "react";
import { getAllCategoriesMp } from "../../services/rawMaterials.service.js";

//Get all Categories de Materias Primas
export const useCategoryMp = () => {
  const [categoriesMp, setCategoriesMp] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() =>{
    getAllCategoriesMp()
      .then((res) => setCategoriesMp(res.data.categorias || []))
      .catch((error) => {
        console.error("Error al cargar categorías de materias primas", error);
        setCategoriesMp([]);
      })
      .finally(() => setLoading(false));
  },[])

  return { categoriesMp, loading };
};
