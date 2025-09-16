import { useParams } from "react-router-dom";
import { ItemAddProduct } from "../components/index.js";

export const UpdateProduct = () => {
  const { id } = useParams();
  return <ItemAddProduct productId={id} />;
};
