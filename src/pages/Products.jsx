import { ItemListContainer, Loader } from "../components";
import { useItems } from "../hooks/productos";

export const Products = () => {
    const { productsData, loading } = useItems();
    return loading ? <Loader /> : <ItemListContainer products={productsData} />;
}
