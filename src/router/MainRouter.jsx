import { Routes, Route } from "react-router-dom";
import {DetailProduct, Home, Products,AddProduct,RawMaterials,CategoriesRawMaterials, UpdateProduct, AddRawMaterial,} from "../pages";






export const MainRouter = () => {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/productos/:id" element={<DetailProduct />} />
      <Route path="/productos" element={<Products />} />
      <Route path="/materias-primas" element={<RawMaterials />} />
      <Route path="/materias-primas/categoria/:nombre" element={<CategoriesRawMaterials />} />
      <Route path="/productos/itemAdd" element={<AddProduct/>} />
      <Route path="/productos/update/:id" element={<UpdateProduct/>} />
      <Route path="/materias-primas/itemAdd" element={<AddRawMaterial/>} />
    </Routes>
  );
};


