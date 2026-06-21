import {
  FormControl,
  FormLabel,
  Input,
  Stack,
  Button,
  Textarea,
  Flex,
  useToast,
  Select,
  Box,
  Heading,
  Text,
  Badge,
  VStack,
  HStack,
  Divider,
  useColorModeValue,
} from "@chakra-ui/react";
import { useEffect, useState, useRef } from "react";
import {
  getProductById,
  updateProduct,
} from "../../services/products.service.js";
import { useAddProduct } from "../../hooks/productos/useAddProduct.js";
import { useGetAllPlantillas } from "../../hooks/index.js";
import { useNavigate } from "react-router-dom";

const BASE_URL = import.meta.env.VITE_API_URL;
const resolveImageUrl = (imgPath) => {
  if (!imgPath) return "";
  return imgPath.startsWith("http") ? imgPath : `${BASE_URL}${imgPath}`;
};

export const ItemAddProduct = ({ productId }) => {
  const [form, setForm] = useState({
    nombre: "",
    catalogo: "",
    modelo: "",
    precio: "",
    stock:"",
    descripcion: "",
    planillaCosto: "", // Nueva relación con plantilla
  });
  
  // Hook para obtener todas las plantillas
  const { plantillasData, loading: loadingPlantillas } = useGetAllPlantillas();
  
  // Estado para almacenar la plantilla seleccionada completa
  const [plantillaSeleccionada, setPlantillaSeleccionada] = useState(null);
  const toast = useToast();
  const navigate = useNavigate();
  const { addProduct, loading, error } = useAddProduct();
  const [imagenes, setImagenes] = useState([]);
  const [imagenesActuales, setImagenesActuales] = useState([]);
  const isDraftLoaded = useRef(!productId);
  const draftKey = `product_draft_${productId || "new"}`;

  // Guardar borrador en sessionStorage (seguridad ante recargas)
  useEffect(() => {
    if (!isDraftLoaded.current) return;
    const timer = setTimeout(() => {
      try {
        sessionStorage.setItem(draftKey, JSON.stringify({ form }));
      } catch { /* sessionStorage lleno o deshabilitado */ }
    }, 800);
    return () => clearTimeout(timer);
  }, [form, draftKey]);

  // Restaurar borrador al montar (solo para productos nuevos)
  useEffect(() => {
    if (productId) return;
    try {
      const raw = sessionStorage.getItem(draftKey);
      if (!raw) return;
      const draft = JSON.parse(raw);
      if (draft.form) setForm(draft.form);
    } catch { /* borrador corrupto, ignorar */ }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  // Cargar datos si es edición
  useEffect(() => {
    if (productId) {
      getProductById(productId).then((res) => {
        const precioDesdePlanilla = res.data?.planillaCosto?.precioFinal;
        const precioCalculado =
          precioDesdePlanilla ?? res.data?.precioActual ?? res.data?.precio ?? "";
        setForm({
          nombre: res.data.nombre,
          catalogo: res.data.catalogo,
          modelo: res.data.modelo,
          precio: precioCalculado?.toString() || "",
          stock: res.data.stock,
          descripcion: res.data.descripcion,
          planillaCosto: res.data.planillaCosto?._id || "", // Cargar ID de plantilla si existe
        });
        setImagenesActuales(res.data.imagenes || []);
        setImagenes([]);
        
        // Si tiene plantilla asociada, cargarla para mostrar información
        if (res.data.planillaCosto) {
          setPlantillaSeleccionada(res.data.planillaCosto);
        }

        // Restaurar borrador con cambios no guardados (seguridad ante recargas)
        isDraftLoaded.current = true;
        try {
          const raw = sessionStorage.getItem(draftKey);
          if (raw) {
            const draft = JSON.parse(raw);
            if (draft.form) setForm(draft.form);
          }
        } catch { /* borrador corrupto, ignorar */ }
      });
    }
  }, [productId]);

  // Función para manejar el cambio de plantilla
  const handlePlantillaChange = (plantillaId) => {
    setForm(prev => ({ ...prev, planillaCosto: plantillaId }));
    
    // Encontrar la plantilla seleccionada para mostrar información
    const plantilla = plantillasData.find(p => p._id === plantillaId);
    setPlantillaSeleccionada(plantilla || null);
    
    // Opcional: Auto-llenar el precio basado en la plantilla
    if (plantilla && plantilla.precioFinal) {
      setForm(prev => ({ ...prev, precio: plantilla.precioFinal.toString() }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    Object.entries(form).forEach(([key, value]) => {
      formData.append(key, value);
    });
    imagenes.forEach((img) => {
      formData.append("imagenes", img);
    });

    let result;
    if (productId) {
      // Modo edición
      result = await updateProduct(productId, formData, true);
    } else {
      // Modo creación
      result = await addProduct(formData, true);
    }
    
    if (result) {
      sessionStorage.removeItem(draftKey);
      // Actualizar las imágenes actuales con las devueltas por el servidor
      if (result.imagenes) {
        setImagenesActuales(result.imagenes);
      }
      setImagenes([]);
      
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

  const surface = useColorModeValue("white", "gray.800");
  const surfaceBorder = useColorModeValue("gray.200", "gray.700");
  const infoBg = useColorModeValue("teal.50", "gray.900");
  const infoBorder = useColorModeValue("teal.200", "teal.600");
  const infoTitle = useColorModeValue("teal.700", "teal.200");
  const infoMuted = useColorModeValue("gray.600", "gray.400");

  return (
    <Flex minH="auto" align="center" justify="center">
      <form onSubmit={handleSubmit}>
        <Stack
          w="100%"
          maxW="2xl"
          minW={{ base: '90vw', md: '700px' }}
          p={8}
          bg={surface}
          borderWidth="1px"
          borderColor={surfaceBorder}
          borderRadius="xl"
          spacing={4}
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
          
          {/* Selector de Plantilla */}
          <FormControl>
            <FormLabel>Plantilla de Costos</FormLabel>
            <Select
              name="planillaCosto"
              placeholder="Seleccionar plantilla (opcional)"
              value={form.planillaCosto}
              onChange={(e) => handlePlantillaChange(e.target.value)}
              isLoading={loadingPlantillas}
            >
              {plantillasData.map((plantilla) => (
                <option key={plantilla._id} value={plantilla._id}>
                  {plantilla.nombre} - ${plantilla.precioFinal || plantilla.costoTotal || 'N/A'}
                </option>
              ))}
            </Select>
          </FormControl>

          {/* Información de la plantilla seleccionada */}
          {plantillaSeleccionada && (
            <Box p={4} borderWidth="1px" borderColor={infoBorder} borderRadius="xl" bg={infoBg} >
              <VStack align="stretch" spacing={3}  >
                <Heading size="sm" color={infoTitle} textAlign={"center"} >
                  Información de la plantilla: {plantillaSeleccionada.nombre}
                </Heading>

                <HStack justify="space-between">
                  <Text fontSize="sm" color={infoMuted}>Tipo de proyecto:</Text>
                  <Badge colorScheme="gray" textTransform="none">{plantillaSeleccionada.tipoProyecto || 'N/A'}</Badge>
                </HStack>

                <HStack justify="space-between">
                  <Text fontSize="sm" color={infoMuted}>Costo total:</Text>
                  <Badge colorScheme="gray" className="tnum">${(plantillaSeleccionada.costoTotal || 0).toLocaleString()}</Badge>
                </HStack>

                <HStack justify="space-between">
                  <Text fontSize="sm" color={infoMuted}>Precio final:</Text>
                  <Badge colorScheme="teal" className="tnum">${(plantillaSeleccionada.precioFinal || 0).toLocaleString()}</Badge>
                </HStack>

                <HStack justify="space-between">
                  <Text fontSize="sm" color={infoMuted}>Ganancia:</Text>
                  <Badge colorScheme="orange" className="tnum">
                    ${((plantillaSeleccionada.precioFinal || 0) - (plantillaSeleccionada.costoTotal || 0)).toLocaleString()}
                  </Badge>
                </HStack>

                <Divider />
                <Text fontSize="xs" color={infoMuted} textAlign={"center"}>
                  Esta plantilla se aplicará automáticamente al producto
                </Text>
              </VStack>
            </Box>
          )}
          
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
            <FormLabel>Stock</FormLabel>
            <Input
              type="number"
              name="stock"
              placeholder="Stock"
              value={form.stock}
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
              colorScheme="teal"
              variant="outline"
              mb={1}
              cursor="pointer"
            >
              Elegir imágenes
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
                      src={resolveImageUrl(img)}
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
