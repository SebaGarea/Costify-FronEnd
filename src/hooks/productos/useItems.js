import { useState, useEffect } from "react";
import { getAllProducts } from "../../services/products.service.js";

export const useItems = () => {
  const [productsData, setProductsData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAllProducts()
      .then((res) => {
        setProductsData(res.data);
      })
      .catch((error) => {
        console.log(error);
      })
      .finally(() => setLoading(false));
  }, []);

  return { productsData, loading };
};
