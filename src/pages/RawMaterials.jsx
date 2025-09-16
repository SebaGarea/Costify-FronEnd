import { Loader, ItemListContainerRawMaterials } from "../components";
import { useItemsMateriasPrimas } from "../hooks/materiasPrimas";


export const RawMaterials = () => {

const { rawsMaterialData, loading } = useItemsMateriasPrimas();//reutilizando el Custom hook  "useItemsMateriasPrimas()"  de traer todos las Materias Primas.

    return loading ? <Loader /> : <ItemListContainerRawMaterials rawMaterials={rawsMaterialData} />;
}

