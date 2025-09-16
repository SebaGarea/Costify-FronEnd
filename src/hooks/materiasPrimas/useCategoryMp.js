import { useEffect, useState } from "react";
import { getAllCategoriesMp } from "../../services/products.service.js";

//Get all Categories de Materias Primas
export const useCategoryMp = () => {
  const [categoriesMp, setCategoriesMp] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() =>{
    getAllCategoriesMp()
      .then((res) => setCategoriesMp(res.data.categorias))
      .catch((error) => console.log(error))
      .finally(() => setLoading(false));
  },[])

  return { categoriesMp, loading };
};
