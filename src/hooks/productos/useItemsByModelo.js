import React from "react";
import { useState, useEffect } from "react";
import { getProductsByModelo } from "../../services/products.service.js";

export const useItemsByModelo = (modelo) => {
  const [items, setItems] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getProductsByModelo(modelo)
      .then((res) => {
        setItems(res.data);
        setLoading(false);
      })
      .catch((error) => {
        console.log(error);
      })
      .finally(() => setLoading(false));
  }, [modelo]);

  return { items, loading };
};
