import { ItemListContainer, Loader } from "../components";
import { useItems } from "../hooks/productos";
import { useLocation } from "react-router-dom";

export const Products = () => {
    const { productsData, loading } = useItems();
    const location = useLocation();
    return loading ? <Loader /> : <ItemListContainer key={location.key} products={productsData} />;
}
