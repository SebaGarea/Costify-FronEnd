import { useParams } from "react-router";
import { useMpById } from "../hooks/materiasPrimas/useMpById.js";
import { ItemDetailRawMaterials, Loader } from "../components/index.js";

export const DetailRawMaterials = () => {
  const { id } = useParams();
  const { mpById, loading } = useMpById(id);

  return loading ? (
    <Loader />
  ) : (
    <ItemDetailRawMaterials RawMaterials={mpById} />
  );
};
