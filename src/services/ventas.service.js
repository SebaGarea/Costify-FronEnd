import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_URL;


//service
export const getAllVentas = async () => {
  try {
    const response = await axios.get(`${BASE_URL}/api/ventas`);
    return response.data;
  } catch (error) {
    console.error("Error en getAllVentas:", error);
    throw error;
  }
};

export const getUpdateVentas = async (id, ventasData) => {
 try {
   const response = await axios.put(`${BASE_URL}/api/ventas/${id}`, ventasData);
   return response;
 } catch (error) {
   console.error("Error en getUpdateVentas Service:", error);
   throw error;
 }
};
export const createVenta = async (ventaData) => {
  try {
    const response = await axios.post(`${BASE_URL}/api/ventas`, ventaData);
    return response.data;
  } catch (error) {
    console.error("Error en createVenta Service:", error);
    throw error;
  }
}

export const deleteVenta = async (id) => {
  try {
    const response = await axios.delete(`${BASE_URL}/api/ventas/${id}`);
    return response.data;
  } catch (error) {
    console.error("Error en deleteVenta Service:", error);
    throw error;
  }
};