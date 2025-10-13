import {
  Box, Heading, VStack, HStack, FormControl, FormLabel, Input,
  Textarea, Button, InputGroup, InputLeftAddon, useToast,
  useColorModeValue, Text,
  Select
} from "@chakra-ui/react";
import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useItems } from "../../hooks/index.js";
import { useAddVenta } from "../../hooks/ventas/useAddVenta.js";
import { useUpdateVentas } from "../../hooks/ventas/useUpdateVentas.js";
import axios from "axios";

const mediosVenta = [
  { value: "mercado_libre", label: "Mercado Libre" },
  { value: "instagram", label: "Instagram" },
  { value: "nube", label: "Nube" },
  { value: "whatsapp", label: "WhatsApp" },
  { value: "otro", label: "Otro" },
];

export const ItemAddVenta = () => {
  const { productsData = [] } = useItems();
  const { addVenta, loading } = useAddVenta();
  const { updateVenta } = useUpdateVentas();
  const navigate = useNavigate();
  const toast = useToast();
  const { id: ventaId } = useParams();
  const loadedRef = useRef(false);

  const card = useColorModeValue("gray.100", "gray.800");
  const border = useColorModeValue("gray.500", "gray.600");

  const [form, setForm] = useState({
    fecha: new Date().toISOString().split("T")[0],
    cliente: "",
    medio: mediosVenta[0].value,
    productoNombre: "",
    productoId: "",
    cantidad: 1,
    descripcion: "",
    valorEnvio: 0,
    seña: 0,
    fechaLimite: "",
  });

  // Sugerencias de producto
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searchProducto, setSearchProducto] = useState("");

  // Calcula el producto seleccionado
  const selectedProduct = productsData.find(p => p._id === form.productoId);
  const precioUnit = Number(selectedProduct?.precio || 0);
  const subtotal = Number(form.cantidad || 0) * precioUnit;
  const valorTotal = subtotal + Number(form.valorEnvio || 0);
  const restanPreview = valorTotal - Number(form.seña || 0);

  // Handlers
  const onChange = (key, number = false) => (e) => {
    const value = number ? Number(e.target.value || 0) : e.target.value;
    setForm(prev => ({ ...prev, [key]: value }));
  };

  // Handler para producto (buscador + sugerencias)
  const onChangeProducto = (e) => {
    const texto = e.target.value;
    setSearchProducto(texto);
    setForm(prev => ({
      ...prev,
      productoNombre: texto,
      productoId: "", // resetea el id si escribe manualmente
    }));
    setShowSuggestions(true);
  };

  const onBlurProducto = () => {
    setTimeout(() => setShowSuggestions(false), 150);
    // Si coincide con un producto, setea el id
    const productoCoincide = productsData.find(
      (p) => `${p.nombre ?? ""} ${p.modelo ?? ""}`.trim().toLowerCase() === form.productoNombre.trim().toLowerCase()
    );
    setForm(prev => ({
      ...prev,
      productoId: productoCoincide ? productoCoincide._id : "",
    }));
  };

  const onSelectSuggestion = (producto) => {
    const nombreModelo = `${producto.nombre ?? ""} ${producto.modelo ?? ""}`.trim();
    setForm(prev => ({
      ...prev,
      productoNombre: nombreModelo,
      productoId: producto._id,
    }));
    setShowSuggestions(false);
  };

  const onSubmit = async () => {
    if (!form.cliente.trim()) {
      toast({ status: "warning", title: "Falta cliente" });
      return;
    }
    if (!form.productoNombre.trim()) {
      toast({ status: "warning", title: "Falta producto" });
      return;
    }
    if (Number(form.cantidad) <= 0) {
      toast({ status: "warning", title: "La cantidad debe ser mayor a 0" });
      return;
    }
    if (Number(form.seña) > valorTotal) {
      toast({ status: "warning", title: "La seña no puede superar el total" });
      return;
    }

    const payload = {
      fecha: new Date(form.fecha),
      cliente: form.cliente.trim(),
      medio: form.medio,
      productoId: form.productoId, // puede ir vacío si es producto nuevo
      productoNombre: form.productoNombre.trim(),
      cantidad: Number(form.cantidad || 0),
      descripcion: form.descripcion.trim(),
      valorEnvio: Number(form.valorEnvio || 0),
      seña: Number(form.seña || 0),
      valorTotal,
  // enviar como string 'YYYY-MM-DD' y convertir en backend para evitar shifts de zona
  fechaLimite: form.fechaLimite ? form.fechaLimite : null,
    };

    try {
      if (ventaId) {
        await updateVenta(ventaId, payload);
        toast({ status: "success", title: "Venta actualizada" });
      } else {
        const ok = await addVenta(payload);
        if (!ok) throw new Error("No se pudo crear la venta");
        toast({ status: "success", title: "Venta creada" });
      }
      navigate("/ventas");
    } catch (err) {
      toast({ status: "error", title: err.message || "Error al guardar" });
    }
  };

  useEffect(() => {
    if (!ventaId) return;
    if (loadedRef.current) return;
    const load = async () => {
      try {
        const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/ventas/${ventaId}`);
        const v = res.data;
        const fmt = (d) => (d ? new Date(d).toISOString().split("T")[0] : "");
        setForm((prev) => ({
          ...prev,
          fecha: fmt(v.fecha),
          cliente: v.cliente || "",
          medio: v.medio || mediosVenta[0].value,
          productoId: v.producto?._id || v.producto || "",
          productoNombre: v.productoNombre || (v.producto ? `${v.producto.nombre ?? ""} ${v.producto.modelo ?? ""}`.trim() : ""),
          cantidad: v.cantidad || 1,
          descripcion: v.descripcion || v.descripcionVenta || "",
          valorEnvio: v.valorEnvio || 0,
          seña: v.seña || 0,
          fechaLimite: fmt(v.fechaLimite),
        }));
        loadedRef.current = true;
      } catch (err) {
        console.error("Error cargando venta:", err);
      }
    };
    load();
  }, [ventaId]);

  return (
    <Box p={6}>
      <Heading size="md" mb={4}>Agregar venta</Heading>
      <VStack bg={card} borderWidth="1px" borderColor={border} borderRadius="md" p={4} spacing={4} align="stretch">
        <HStack spacing={4} align="stretch">
          <FormControl>
            <FormLabel>Fecha</FormLabel>
            <Input type="date" value={form.fecha} onChange={onChange("fecha")} />
          </FormControl>
          <FormControl>
            <FormLabel>Cliente</FormLabel>
            <Input value={form.cliente} onChange={onChange("cliente")} />
          </FormControl>
          <FormControl>
            <FormLabel>Medio</FormLabel>
            <Select value={form.medio} onChange={onChange("medio")}>
              {mediosVenta.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
            </Select>
          </FormControl>
        </HStack>
        <HStack spacing={4} align="stretch">
          <FormControl position="relative">
            <FormLabel>Producto</FormLabel>
            <Textarea
              value={form.productoNombre}
              onChange={onChangeProducto}
              onFocus={() => setShowSuggestions(true)}
              onBlur={onBlurProducto}
              placeholder="Buscar o escribir producto"
              autoComplete="off"
              minH="40px"
            />
            {showSuggestions && (
              <Box
                position="absolute"
                top="100%"
                left={0}
                width="250px"
                bg={card}
                borderWidth="2px"
                borderStyle="solid"
                borderColor={border}
                borderRadius="md"
                boxShadow="xl"
                zIndex={10}
                maxH="200px"
                overflowY="auto"
                mt={1}
                p={1}
              >
                {productsData
                  .filter((producto) =>
                    `${producto.nombre ?? ""} ${producto.modelo ?? ""}`
                      .toLowerCase()
                      .includes(searchProducto.toLowerCase())
                  )
                  .map((producto) => (
                    <Box
                      key={producto._id}
                      onClick={() => onSelectSuggestion(producto)}
                      cursor="pointer"
                      px={2}
                      py={1}
                      _hover={{ bg: border }}
                    >
                      {producto.nombre} {producto.modelo}
                    </Box>
                  ))}
                {productsData.filter((producto) =>
                  `${producto.nombre ?? ""} ${producto.modelo ?? ""}`
                    .toLowerCase()
                    .includes(searchProducto.toLowerCase())
                ).length === 0 && (
                  <Text px={2} py={1} color="gray.500">
                    No hay coincidencias. Se agregará como producto nuevo.
                  </Text>
                )}
              </Box>
            )}
          </FormControl>
          <FormControl >
            <FormLabel>Cantidad</FormLabel>
            <Input type="number" value={form.cantidad} onChange={onChange("cantidad", true)} />
          </FormControl>
          <FormControl>
            <FormLabel>Fecha Limite</FormLabel>
            <Input
              type="date"
              value={form.fechaLimite}
              onChange={onChange("fechaLimite")}
            />
          </FormControl>
        </HStack>
        <FormControl>
          <FormLabel>Descripción</FormLabel>
          <Textarea value={form.descripcion} onChange={onChange("descripcion")} />
        </FormControl>
        <HStack spacing={4}>
          <FormControl>
            <FormLabel>Envío</FormLabel>
            <InputGroup>
              <InputLeftAddon children="$" />
              <Input type="number" value={form.valorEnvio} onChange={onChange("valorEnvio", true)} />
            </InputGroup>
          </FormControl>
          <FormControl>
            <FormLabel>Seña</FormLabel>
            <InputGroup>
              <InputLeftAddon children="$" />
              <Input type="number" value={form.seña} onChange={onChange("seña", true)} />
            </InputGroup>
          </FormControl>
          <FormControl isReadOnly>
            <FormLabel>Total</FormLabel>
            <InputGroup>
              <InputLeftAddon children="$" />
              <Input value={valorTotal} readOnly />
            </InputGroup>
          </FormControl>
          <FormControl isReadOnly>
            <FormLabel>Restan</FormLabel>
            <InputGroup>
              <InputLeftAddon children="$" />
              <Input value={restanPreview} readOnly />
            </InputGroup>
          </FormControl>
        </HStack>
        <HStack justify="flex-end">
          <Button variant="ghost" onClick={() => navigate("/ventas")}>Cancelar</Button>
          <Button colorScheme="blue" onClick={onSubmit} isLoading={loading}>Guardar</Button>
        </HStack>
      </VStack>
    </Box>
  );
};