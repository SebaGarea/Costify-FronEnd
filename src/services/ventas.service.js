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