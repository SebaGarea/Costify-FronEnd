import { Routes, Route } from "react-router-dom";
import {DetailProduct, Home, Products,AddProduct,RawMaterials,CategoriesRawMaterials, UpdateProduct, AddRawMaterial,DetailRawMaterials, UpdateRawMaterial, Plantillas, AddPlantilla, Ventas, AddVenta} from "../pages";








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
      <Route path="/materias-primas/:id" element={<DetailRawMaterials/>} />
      <Route path="/materias-primas/update/:id" element={<UpdateRawMaterial/>} />
      <Route path="/plantillas/plantillaAdd" element={<AddPlantilla/>} />
      <Route path="/plantillas/plantillaAdd/:id" element={<AddPlantilla/>} />
      <Route path="/plantillas" element={<Plantillas/>} />
      <Route path="/ventas" element={<Ventas/>} />
      <Route path="/ventas/itemAdd" element={<AddVenta/>} />
    </Routes>
  );
};


