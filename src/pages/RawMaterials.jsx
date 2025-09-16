import { Loader, ItemListContainerRawMaterials } from "../components";
import { useItemsMateriasPrimas } from "../hooks/materiasPrimas";


export const RawMaterials = () => {

const { rawsMaterialData, loading } = useItemsMateriasPrimas();

    return loading ? <Loader /> : <ItemListContainerRawMaterials rawMaterials={rawsMaterialData} />;
}

