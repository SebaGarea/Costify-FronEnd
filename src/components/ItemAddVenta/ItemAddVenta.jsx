import {
  Box, Heading, VStack, HStack, FormControl, FormLabel, Input,
  Textarea, Button, InputGroup, InputLeftAddon, useToast,
  useColorModeValue, Text,
  Select
} from "@chakra-ui/react";
import { useState, useEffect, useRef, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useItems, useGetAllPlantillas } from "../../hooks/index.js";
import { useAddVenta } from "../../hooks/ventas/useAddVenta.js";
import { useUpdateVentas } from "../../hooks/ventas/useUpdateVentas.js";
import api from "../../services/auth.service.js";

const mediosVenta = [
  { value: "mercado_libre", label: "Mercado Libre" },
  { value: "instagram", label: "Instagram" },
  { value: "nube", label: "Nube" },
  { value: "whatsapp", label: "WhatsApp" },
  { value: "otro", label: "Otro" },
];

const getProductoPrecioCatalogo = (producto) => {
  if (!producto) return 0;
  const raw = producto.precioActual ?? producto.precio ?? 0;
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : 0;
};

export const ItemAddVenta = () => {
  const { productsData = [] } = useItems();
  const { plantillasData = [], loading: plantillasLoading } = useGetAllPlantillas();
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
    plantillaId: "",
    plantillaNombre: "",
    cantidad: 1,
    precioManual: "",
    precioUnitario: "",
    descripcion: "",
    valorEnvio: "",
    seña: "",
    fechaLimite: "",
  });

  // Sugerencias de producto
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searchProducto, setSearchProducto] = useState("");
  // Sugerencias de plantillas
  const [showPlantillaSuggestions, setShowPlantillaSuggestions] = useState(false);
  const [searchPlantilla, setSearchPlantilla] = useState("");

  const priceFormatter = useMemo(
    () =>
      new Intl.NumberFormat("es-AR", {
        style: "currency",
        currency: "ARS",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }),
    []
  );
  const formatCurrency = (value) => priceFormatter.format(Number(value || 0));

  const productOptions = Array.isArray(productsData) ? productsData : [];
  const selectedProduct = productOptions.find((p) => p._id === form.productoId);
  const plantillasOptions = Array.isArray(plantillasData) ? plantillasData : [];
  const selectedPlantilla = plantillasOptions.find((p) => p._id === form.plantillaId);
  const plantillaCostoBase = selectedPlantilla
    ? Number(selectedPlantilla.precioFinal ?? selectedPlantilla.costoTotal ?? 0)
    : null;
  const precioCatalogoActual = selectedProduct
    ? getProductoPrecioCatalogo(selectedProduct)
    : null;
  const precioUnit = Number(form.precioUnitario || 0);
  const subtotal = Number(form.cantidad || 0) * precioUnit;
  const valorTotal = subtotal + Number(form.valorEnvio || 0);
  const restanPreview = valorTotal - Number(form.seña || 0);

  // Handlers
  const onChange = (key, number = false) => (e) => {
    const rawValue = e.target.value;
    const value = number ? (rawValue === "" ? "" : Number(rawValue)) : rawValue;
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
      precioManual: prev.productoId ? prev.precioUnitario : prev.precioManual,
    }));
    setShowSuggestions(true);
  };

  const onBlurProducto = () => {
    setTimeout(() => setShowSuggestions(false), 150);
    // Si coincide con un producto, setea el id
    const productoCoincide = productOptions.find(
      (p) => `${p.nombre ?? ""} ${p.modelo ?? ""}`.trim().toLowerCase() === form.productoNombre.trim().toLowerCase()
    );
    setForm(prev => {
      const productoId = productoCoincide ? productoCoincide._id : "";
      const next = {
        ...prev,
        productoId,
        precioManual: productoCoincide ? "" : prev.precioManual,
      };
      if (productoCoincide && productoId !== prev.productoId) {
        next.precioUnitario = getProductoPrecioCatalogo(productoCoincide);
      }
      return next;
    });
  };

  const onSelectSuggestion = (producto) => {
    const nombreModelo = `${producto.nombre ?? ""} ${producto.modelo ?? ""}`.trim();
    setForm(prev => ({
      ...prev,
      productoNombre: nombreModelo,
      productoId: producto._id,
      precioManual: "",
      precioUnitario:
        prev.productoId === producto._id
          ? prev.precioUnitario
          : getProductoPrecioCatalogo(producto),
    }));
    setShowSuggestions(false);
  };

  const applyPlantillaSelection = (plantilla) => {
    setForm((prev) => {
      if (!plantilla) {
        return { ...prev, plantillaId: "", plantillaNombre: prev.plantillaNombre };
      }

      const next = {
        ...prev,
        plantillaId: plantilla._id ?? "",
        plantillaNombre: plantilla.nombre ?? prev.plantillaNombre,
      };

      if (!prev.productoId) {
        const precioSugerido = Number(plantilla.precioFinal ?? plantilla.costoTotal ?? 0);
        if (Number.isFinite(precioSugerido) && precioSugerido > 0) {
          next.precioManual = precioSugerido;
          next.precioUnitario = precioSugerido;
        }
      }

      return next;
    });
  };

  const onChangePlantilla = (e) => {
    const texto = e.target.value;
    setSearchPlantilla(texto);
    setForm((prev) => ({
      ...prev,
      plantillaNombre: texto,
      plantillaId: "",
    }));
    setShowPlantillaSuggestions(true);
  };

  const onBlurPlantilla = () => {
    setTimeout(() => setShowPlantillaSuggestions(false), 150);
    const plantillaCoincide = plantillasOptions.find(
      (p) => (p.nombre ?? "").trim().toLowerCase() === form.plantillaNombre.trim().toLowerCase()
    );
    if (plantillaCoincide) {
      applyPlantillaSelection(plantillaCoincide);
      setSearchPlantilla(plantillaCoincide.nombre ?? "");
    }
  };

  const onSelectPlantillaSuggestion = (plantilla) => {
    applyPlantillaSelection(plantilla);
    setSearchPlantilla(plantilla.nombre ?? "");
    setShowPlantillaSuggestions(false);
  };

  const handlePrecioUnitarioChange = (e) => {
    const rawValue = e.target.value;
    const numericValue = rawValue === "" ? "" : Number(rawValue);
    setForm((prev) => {
      const next = { ...prev, precioUnitario: numericValue };
      if (!prev.productoId) {
        next.precioManual = numericValue;
      }
      return next;
    });
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
    if (!selectedProduct && Number(form.precioUnitario) <= 0) {
      toast({ status: "warning", title: "Falta precio unitario" });
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

    const isManualProduct = !selectedProduct;

    const payload = {
      fecha: new Date(form.fecha),
      cliente: form.cliente.trim(),
      medio: form.medio,
      productoId: isManualProduct ? undefined : form.productoId,
      productoNombre: form.productoNombre.trim(),
      cantidad: Number(form.cantidad || 0),
      descripcion: form.descripcion.trim(),
      valorEnvio: Number(form.valorEnvio || 0),
      seña: Number(form.seña || 0),
      valorTotal: Number(valorTotal),
      precioManual: isManualProduct ? Number(form.precioUnitario || 0) : null,
      fechaLimite: form.fechaLimite ? form.fechaLimite : null,
    };

    if (form.plantillaId) {
      payload.plantillaId = form.plantillaId;
    }

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
        const res = await api.get(`/api/ventas/${ventaId}`);
        const v = res.data;
        const fmt = (d) => (d ? new Date(d).toISOString().split("T")[0] : "");
        const cantidadVenta = Number(v.cantidad || 0) || 1;
        const netoVenta = Number(v.valorTotal ?? 0) - Number(v.valorEnvio ?? 0);
        const precioUnitarioVenta = Number.isFinite(netoVenta / cantidadVenta)
          ? netoVenta / cantidadVenta
          : 0;
        setForm((prev) => ({
          ...prev,
          fecha: fmt(v.fecha),
          cliente: v.cliente || "",
          medio: v.medio || mediosVenta[0].value,
          productoId: v.producto?._id || v.producto || "",
          productoNombre: v.productoNombre || (v.producto ? `${v.producto.nombre ?? ""} ${v.producto.modelo ?? ""}`.trim() : ""),
          plantillaId: v.plantilla?._id || v.plantilla || "",
          plantillaNombre: v.plantilla?.nombre || prev.plantillaNombre,
          cantidad: v.cantidad || 1,
          descripcion: v.descripcion || v.descripcionVenta || "",
          valorEnvio: v.valorEnvio ?? "",
          seña: v.seña ?? "",
          precioManual:
            v.producto?._id || v.producto ? "" : precioUnitarioVenta,
          precioUnitario: precioUnitarioVenta,
          fechaLimite: fmt(v.fechaLimite),
        }));
        if (v.plantilla?.nombre) {
          setSearchPlantilla(v.plantilla.nombre);
        }
        loadedRef.current = true;
      } catch (err) {
        console.error("Error cargando venta:", err);
      }
    };
    load();
  }, [ventaId]);

  return (
    <Box p={{ base: 3, md: 5 }} maxW="1200px" mx="auto">
      <Heading size="md" mb={3}>Agregar venta</Heading>
      <VStack
        bg={card}
        borderWidth="1px"
        borderColor={border}
        borderRadius="md"
        p={{ base: 3, md: 5 }}
        spacing={{ base: 3, md: 4 }}
        align="stretch"
      >
        <HStack spacing={{ base: 3, md: 4 }} align="flex-end" flexWrap={{ base: "wrap", "2xl": "nowrap" }}>
          <FormControl minW="200px" flex="1">
            <FormLabel>Fecha</FormLabel>
            <Input type="date" value={form.fecha} onChange={onChange("fecha")} />
          </FormControl>
          <FormControl minW="220px" flex="1">
            <FormLabel>Cliente</FormLabel>
            <Input value={form.cliente} onChange={onChange("cliente")} />
          </FormControl>
          <FormControl minW="200px" flex="1">
            <FormLabel>Medio</FormLabel>
            <Select value={form.medio} onChange={onChange("medio")}>
              {mediosVenta.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
            </Select>
          </FormControl>
        </HStack>
        <HStack spacing={{ base: 3, md: 4 }} align="stretch" flexWrap={{ base: "wrap", "2xl": "nowrap" }}>
          <FormControl position="relative" flex="2" minW={{ base: "100%", md: "320px" }}>
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
                {productOptions
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
                {productOptions.filter((producto) =>
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
            {selectedProduct && (
              <Text fontSize="sm" color="gray.400" mt={2}>
                Precio catálogo actualizado: {formatCurrency(precioCatalogoActual ?? 0)} · Precio fijado para esta venta: {formatCurrency(precioUnit)}
                {selectedProduct.planillaCosto ? " · Tiene planilla asociada" : ""}
              </Text>
            )}
          </FormControl>
          <FormControl flex="1" minW={{ base: "100%", md: "260px" }} position="relative">
            <FormLabel>Plantilla guardada</FormLabel>
            <Textarea
              value={form.plantillaNombre}
              onChange={onChangePlantilla}
              onFocus={() => setShowPlantillaSuggestions(true)}
              onBlur={onBlurPlantilla}
              placeholder={plantillasLoading ? "Cargando plantillas..." : "Buscar o escribir plantilla"}
              isDisabled={plantillasLoading}
              autoComplete="off"
              minH="40px"
            />
            {showPlantillaSuggestions && !plantillasLoading && (
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
                {plantillasOptions
                  .filter((plantilla) =>
                    (plantilla.nombre ?? "")
                      .toLowerCase()
                      .includes(searchPlantilla.toLowerCase())
                  )
                  .map((plantilla) => (
                    <Box
                      key={plantilla._id}
                      onClick={() => onSelectPlantillaSuggestion(plantilla)}
                      cursor="pointer"
                      px={2}
                      py={1}
                      _hover={{ bg: border }}
                    >
                      {plantilla.nombre}
                      {plantilla.tipoProyecto ? ` · ${plantilla.tipoProyecto}` : ""}
                    </Box>
                  ))}
                {plantillasOptions.filter((plantilla) =>
                  (plantilla.nombre ?? "")
                    .toLowerCase()
                    .includes(searchPlantilla.toLowerCase())
                ).length === 0 && (
                  <Text px={2} py={1} color="gray.500">
                    No hay plantillas coincidentes.
                  </Text>
                )}
              </Box>
            )}
            {selectedPlantilla && (
              <Text fontSize="sm" color="gray.500" mt={2}>
                {selectedPlantilla.tipoProyecto || "Proyecto general"}
                {selectedPlantilla.categoria ? ` · ${selectedPlantilla.categoria}` : ""}
                {Number.isFinite(plantillaCostoBase) && plantillaCostoBase > 0
                  ? ` · Costo base: $${plantillaCostoBase.toLocaleString("es-AR")}`
                  : ""}
              </Text>
            )}
          </FormControl>
          <FormControl
            minW={{ base: "48%", md: "110px" }}
            flex={{ base: "1 1 45%", xl: "0 0 110px" }}
            maxW="120px"
          >
            <FormLabel>Cantidad</FormLabel>
            <Input type="number" value={form.cantidad} onChange={onChange("cantidad", true)}  />
          </FormControl>
          <FormControl minW={{ base: "48%", md: "180px" }} flex="1">
            <FormLabel>Precio unitario</FormLabel>
            <Input
              type="number"
              value={form.precioUnitario}
              onChange={handlePrecioUnitarioChange}
              isDisabled={Boolean(selectedProduct)}
              placeholder={selectedProduct ? "Precio del catálogo" : "Ingresá el precio"}
            />
          </FormControl>
          <FormControl
            minW={{ base: "48%", md: "180px" }}
            flex={{ base: "1 1 45%", xl: "0 0 180px" }}
            maxW="230px"
          >
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
        <HStack spacing={{ base: 3, md: 4 }} flexWrap={{ base: "wrap", "2xl": "nowrap" }}>
          <FormControl minW={{ base: "48%", md: "200px" }} flex="1">
            <FormLabel>Envío</FormLabel>
            <InputGroup size="sm">
              <InputLeftAddon children="$" />
              <Input type="number" value={form.valorEnvio} onChange={onChange("valorEnvio", true)} />
            </InputGroup>
          </FormControl>
          <FormControl minW={{ base: "48%", md: "200px" }} flex="1">
            <FormLabel>Seña</FormLabel>
            <InputGroup size="sm">
              <InputLeftAddon children="$" />
              <Input type="number" value={form.seña} onChange={onChange("seña", true)} />
            </InputGroup>
          </FormControl>
          <FormControl minW={{ base: "48%", md: "200px" }} flex="1" isReadOnly>
            <FormLabel>Total</FormLabel>
            <InputGroup size="sm">
              <InputLeftAddon children="$" />
              <Input value={valorTotal} readOnly />
            </InputGroup>
          </FormControl>
          <FormControl minW={{ base: "48%", md: "200px" }} flex="1" isReadOnly>
            <FormLabel>Restan</FormLabel>
            <InputGroup size="sm">
              <InputLeftAddon children="$" />
              <Input value={restanPreview} readOnly />
            </InputGroup>
          </FormControl>
        </HStack>
        <HStack justify="flex-end" flexWrap="wrap" spacing={2}>
          <Button variant="ghost" onClick={() => navigate("/ventas")} w={{ base: "100%", sm: "auto" }}>
            Cancelar
          </Button>
          <Button colorScheme="blue" onClick={onSubmit} isLoading={loading} w={{ base: "100%", sm: "auto" }}>
            Guardar
          </Button>
        </HStack>
      </VStack>
    </Box>
  );
};