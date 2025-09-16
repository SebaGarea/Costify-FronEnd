import { useEffect, useState } from "react";
import { getProductById } from "../../services/products.service.js";

export const useItemsById = (id) => {
  const [product, setProduct] = useState({});
  const [loading, setLoading] = useState(true); 

  useEffect(() =>{
    getProductById(id).then((res)=>{
        setProduct(res.data);
        setLoading(false);
    }).catch((error) => {
        console.log(error);
      })
      .finally(() => setLoading(false));
  }, [id]);

  return {product, loading}
};
