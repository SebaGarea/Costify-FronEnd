import { useEffect, useState } from 'react'
import { getMpByCategory } from '../../services/products.service.js';

//Get Materias Primas by Category
export const useMpByCategories = (category) => {
  const[ mp, setMp] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getMpByCategory(category)
        .then((res) => setMp(res.data.materiasPrimas))
        .catch((error) => console.log(error))
        .finally(() => setLoading(false));
  }, [category])

  return { mp, loading };
}
