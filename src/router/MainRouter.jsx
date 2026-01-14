import { Routes, Route, Navigate } from "react-router-dom";
import {
  DetailProduct,
  Home,
  Products,
  AddProduct,
  RawMaterials,
  CategoriesRawMaterials,
  UpdateProduct,
  AddRawMaterial,
  DetailRawMaterials,
  UpdateRawMaterial,
  Plantillas,
  AddPlantilla,
  Ventas,
  AddVenta,
} from "../pages";
import Login from "../pages/Login.jsx";
import { useAuth } from "../hooks/auth/useAuth.jsx";

const PrivateRoute = ({ children }) => {
  const { user, initializing } = useAuth();
  if (initializing) return null;
  return user ? children : <Navigate to="/login" replace />;
};

export const MainRouter = () => {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/*"
        element={
          <PrivateRoute>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/productos" element={<Products />} />
              <Route path="/productos/:id" element={<DetailProduct />} />
              <Route path="/productos/itemAdd" element={<AddProduct />} />
              <Route path="/productos/update/:id" element={<UpdateProduct />} />
              <Route path="/materias-primas" element={<RawMaterials />} />
              <Route path="/materias-primas/categoria/:nombre" element={<CategoriesRawMaterials />} />
              <Route path="/materias-primas/itemAdd" element={<AddRawMaterial />} />
              <Route path="/materias-primas/:id" element={<DetailRawMaterials />} />
              <Route path="/materias-primas/update/:id" element={<UpdateRawMaterial />} />
              <Route path="/plantillas" element={<Plantillas />} />
              <Route path="/plantillas/plantillaAdd" element={<AddPlantilla />} />
              <Route path="/plantillas/plantillaAdd/:id" element={<AddPlantilla />} />
              <Route path="/ventas" element={<Ventas />} />
              <Route path="/ventas/itemAdd" element={<AddVenta />} />
              <Route path="/ventas/itemAdd/:id" element={<AddVenta />} />
            </Routes>
          </PrivateRoute>
        }
      />
    </Routes>
  );
};
