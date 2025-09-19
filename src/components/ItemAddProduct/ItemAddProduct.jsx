import {
  FormControl,
  FormLabel,
  Input,
  Stack,
  Button,
  Textarea,
  Flex,
  useToast,
} from "@chakra-ui/react";
import { useEffect, useState } from "react";
import {
  getProductById,
  updateProduct,
} from "../../services/products.service.js";
import { useAddProduct } from "../../hooks/productos/useAddProduct.js";
import { useNavigate } from "react-router-dom";

const BASE_URL = import.meta.env.VITE_API_URL;

export const ItemAddProduct = ({ productId }) => {
  const [form, setForm] = useState({
    nombre: "",
    catalogo: "",
    modelo: "",
    precio: "",
    descripcion: "",
  });
  const toast = useToast();
  const navigate = useNavigate();
  const { addProduct, loading, error } = useAddProduct();
  const [imagenes, setImagenes] = useState([]);
  const [imagenesActuales, setImagenesActuales] = useState([]);
  // Cargar datos si es edición
  useEffect(() => {
    if (productId) {
      getProductById(productId).then((res) => {
        setForm({
          nombre: res.data.nombre,
          catalogo: res.data.catalogo,
          modelo: res.data.modelo,
          precio: res.data.precio,
          descripcion: res.data.descripcion,
        });
        setImagenesActuales(res.data.imagenes || []);
        setImagenes([]); 
      });
    }
  }, [productId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    Object.entries(form).forEach(([key, value]) => {
      formData.append(key, value);
    });
    imagenes.forEach((img) => {
      formData.append("imagenes", img);
    });

    let ok;
    if (productId) {
      // Modo edición
      ok = await updateProduct(productId, formData, true);
    } else {
      // Modo creación
      ok = await addProduct(formData, true);
    }
    if (ok) {
      toast({
        title: productId ? "Producto actualizado." : "Producto agregado.",
        description: productId
          ? "El producto fue actualizado correctamente."
          : "El producto fue cargado correctamente.",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
      setTimeout(() => {
        navigate("/productos");
      }, 1000);
      setForm({
        nombre: "",
        catalogo: "",
        modelo: "",
        precio: "",
        descripcion: "",
      });
      setImagenes([]);
    } else {
      toast({
        title: "Error",
        description: error,
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleFileChange = (e) => {
    setImagenes(Array.from(e.target.files));
  };

  const handleRemoveImage = (idx) => {
    setImagenes((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <Flex minH="auto" align="center" justify="center">
      <form onSubmit={handleSubmit}>
        <Stack
          w="100%"
          maxW="2xl"
          minW={{ base: '90vw', md: '700px' }}
          p={8}
          border="1px"
          borderRadius={20}
          spacing={4}
          boxShadow="md"
        >
          <FormControl>
            <FormLabel>Nombre del producto</FormLabel>
            <Input
              type="text"
              name="nombre"
              placeholder="Nombre del producto"
              value={form.nombre}
              onChange={handleChange}
              required
            />
          </FormControl>
          <FormControl>
            <FormLabel>Catalogo</FormLabel>
            <Input
              type="text"
              name="catalogo"
              placeholder="Catalogo del producto"
              value={form.catalogo}
              onChange={handleChange}
              required
            />
          </FormControl>
          <FormControl>
            <FormLabel>Modelo</FormLabel>
            <Input
              type="text"
              name="modelo"
              placeholder="Modelo"
              value={form.modelo}
              onChange={handleChange}
              required
            />
          </FormControl>
          <FormControl>
            <FormLabel>Precio</FormLabel>
            <Input
              type="number"
              name="precio"
              placeholder="Precio"
              value={form.precio}
              onChange={handleChange}
              required
            />
          </FormControl>
          <FormControl>
            <FormLabel>Descripción</FormLabel>
            <Textarea
              name="descripcion"
              placeholder="Descripción"
              value={form.descripcion}
              onChange={handleChange}
            />
          </FormControl>
          <FormControl>
            <FormLabel>Imágenes</FormLabel>
            <input
              id="file-upload"
              type="file"
              name="imagenes"
              multiple
              style={{ display: "none" }}
              onChange={handleFileChange}
            />
            <Button
              as="label"
              htmlFor="file-upload"
              colorScheme="green"
              mb={1}
              cursor="pointer"
            >
              Elegir Imágenes
            </Button>
            {/* Previsualización de imágenes actuales */}
            {imagenesActuales.length > 0 && (
              <Stack direction="row" spacing={2} mt={2}>
                {imagenesActuales.map((img, idx) => (
                  <div
                    key={idx}
                    style={{ position: "relative", display: "inline-block" }}
                  >
                    <img
                      src={`${BASE_URL}${img}`}
                      alt={`actual-${idx}`}
                      style={{
                        width: 120,
                        height: 120,
                        objectFit: "cover",
                        borderRadius: 8,
                        border: "1px solid #ccc",
                      }}
                    />
                  </div>
                ))}
              </Stack>
            )}
            {/* Previsualización de imágenes nuevas */}
            {imagenes.length > 0 && (
              <Stack direction="row" spacing={2} mt={2}>
                {imagenes.map((img, idx) => (
                  <div
                    key={idx}
                    style={{ position: "relative", display: "inline-block" }}
                  >
                    <img
                      src={URL.createObjectURL(img)}
                      alt={`preview-${idx}`}
                      style={{
                        width: 120,
                        height: 120,
                        objectFit: "cover",
                        borderRadius: 8,
                        border: "1px solid #ccc",
                      }}
                    />
                    <Button
                      size="xs"
                      colorScheme="red"
                      position="absolute"
                      top={-2}
                      right={-2}
                      borderRadius="full"
                      onClick={() => handleRemoveImage(idx)}
                      style={{
                        position: "absolute",
                        top: -8,
                        right: -8,
                        padding: 0,
                        minWidth: 0,
                        width: 20,
                        height: 20,
                      }}
                    >
                      ×
                    </Button>
                  </div>
                ))}
              </Stack>
            )}
          </FormControl>
          <Button type="submit" colorScheme="teal" isLoading={loading}>
            {productId ? "Actualizar Producto" : "Agregar Producto"}
          </Button>
        </Stack>
      </form>
    </Flex>
  );
};
