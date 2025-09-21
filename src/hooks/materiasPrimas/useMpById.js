import { useEffect, useState } from "react";
import { getRawMaterialById } from "../../services/products.service.js";

export const useMpById = (id) => {
  const [mpById, setMpById] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) {
      setLoading(false);
      return;
    }

    getRawMaterialById(id)
      .then((res) => {
        setMpById(res.data.materiaPrima || res.data);
        setLoading(false);
      })
      .catch((error) => {
        console.log("Error al obtener MP:", error);
        setLoading(false);
        setMpById(null);
      });
  }, [id]);

  return { mpById, loading };
};
