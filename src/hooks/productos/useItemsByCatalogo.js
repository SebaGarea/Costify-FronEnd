import React, { useEffect, useState } from "react";
import { getProductsByCatalogo } from "../../services/products.service.js";

export const useItemsByCatalogo = (catalogo) => {
  const [product, setProduct] = useState([]);

  useEffect(() => {
    getProductsByCatalogo(catalogo)
      .then((res) => setProduct(res.data.catalogo))
      .catch((error) => console.log(error));
  }, [catalogo]);

  return {product};
};
