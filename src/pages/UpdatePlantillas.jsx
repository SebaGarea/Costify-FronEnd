
import { useParams } from "react-router";
import { ItemAddPlantillas } from "../components/ItemAddPlantillas/ItemAddPlantillas.jsx";

export const UpdatePlantillas = () => {
  const { id } = useParams();
  return <ItemAddPlantillas PlantillasId={id} />;
};
