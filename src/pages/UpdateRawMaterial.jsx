import { useParams } from "react-router-dom";
import { ItemAddRawMaterials } from "../components/index.js";

export const UpdateRawMaterial = () => {
  const { id } = useParams();
  return <ItemAddRawMaterials RawMaterialId={id} />;
};