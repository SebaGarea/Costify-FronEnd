import {
  AlertDialog,
  AlertDialogBody,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogOverlay,
  Box,
  Button,
  Circle,
  Collapse,
  Flex,
  Heading,
  HStack,
  Icon,
  IconButton,
  Input,
  InputGroup,
  InputLeftElement,
  SimpleGrid,
  Text,
  Textarea,
  VStack,
  useColorModeValue,
} from "@chakra-ui/react";
import { AiOutlineFileSearch } from "react-icons/ai";
import { GiFactory } from "react-icons/gi";
import {
  FiEdit2,
  FiRefreshCw,
  FiCheck,
  FiSearch,
  FiDollarSign,
  FiAlertTriangle,
  FiCheckCircle,
  FiCircle,
} from "react-icons/fi";
import { MdDeleteForever } from "react-icons/md";
import { FaTruck, FaStar } from "react-icons/fa";
import { useEffect, useMemo, useRef, useState } from "react";
import { useDeleteVenta } from "../../hooks/ventas/useDeleteVenta.js";
import { useNavigate } from "react-router-dom";
import { useGetVentasPaginated } from "../../hooks/ventas/useGetVentasPaginated.js";
import { useUpdateVentas } from "../../hooks/ventas/useUpdateVentas.js";
import { Loader } from "../Loader/Loader.jsx";

const normalizeString = (value = "") =>
  value
    .toString()
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

const getProductoLabel = (venta = {}) => {
  if (!venta) return "";
  if (venta.productoNombre) return venta.productoNombre;
  if (venta.producto) {
    const nombre = venta.producto.nombre ?? "";
    const modelo = venta.producto.modelo ?? "";
    return `${nombre} ${modelo}`.trim();
  }
  return "";
};

const ALERT_THRESHOLD_DAYS = 5;
const DESPACHADA_WINDOW_DAYS = 30;

const formatDueDiffText = (diffDays) => {
  if (typeof diffDays !== "number" || Number.isNaN(diffDays)) return "";
  if (diffDays < 0) {
    const abs = Math.abs(diffDays);
    return abs === 1 ? "Vencida hace 1 día" : `Vencida hace ${abs} días`;
  }
  if (diffDays === 0) return "Vence hoy";
  if (diffDays === 1) return "Vence en 1 día";
  return `Vence en ${diffDays} días`;
};

export const ItemListVentas = () => {
  const { items, total, page, totalPages, loading, error, setPage } =
    useGetVentasPaginated(1, 10);
  const [ventas, setVentas] = useState([]);
  const [clienteQuery, setClienteQuery] = useState("");
  const [productoQuery, setProductoQuery] = useState("");
  const [showDueAlerts, setShowDueAlerts] = useState(false);
  const navigate = useNavigate();
  const { removeVenta, loading: deleting } = useDeleteVenta();
  const { updateVenta } = useUpdateVentas();
  const [deletingId, setDeletingId] = useState(null);
  const [markingPaidId, setMarkingPaidId] = useState(null);
  const [isOpen, setIsOpen] = useState(false);
  const cancelRef = useRef();
  const medioLabels = {
    mercado_libre: "Mercado Libre",
    instagram: "Instagram",
    nube: "Nube",
    whatsapp: "WhatsApp",
    otro: "Otro",
  };
  const iconColor = useColorModeValue("blue.500", "blue.300");
  const cardVentas = useColorModeValue("gray.100", "gray.800");
  const bg = useColorModeValue("gray.50", "gray.900");
  const heading = useColorModeValue("blue.600", "blue.300");
  const text = useColorModeValue("gray.700", "gray.200");
  const errorColor = useColorModeValue("red.500", "red.300");
  const border = useColorModeValue("gray.500", "gray.600");
  const filaMonetariaBg = useColorModeValue("gray.50", "gray.700");
  const descBg = useColorModeValue("white", "gray.800");
  const heroBg = useColorModeValue(
    "linear-gradient(135deg, rgba(255,255,255,0.96) 0%, rgba(226,242,255,0.96) 100%)",
    "linear-gradient(135deg, rgba(26,32,44,0.95) 0%, rgba(15,19,28,0.9) 100%)"
  );
  const heroBorder = useColorModeValue("blackAlpha.100", "whiteAlpha.200");

  const fmtDateUTC = (d) => {
    try {
      if (!d) return "";
      return new Date(d).toLocaleDateString(undefined, { timeZone: "UTC" });
    } catch {
      return "";
    }
  };

  useEffect(() => {
    if (Array.isArray(items)) {
      setVentas(items);
    }
  }, [items]);

  const ventasOrdenadas = useMemo(() => {
    if (!Array.isArray(ventas)) return [];

    return [...ventas].sort((a, b) => {
      const fa = new Date(a.fecha || 0).getTime();
      const fb = new Date(b.fecha || 0).getTime();
      if (fb !== fa) return fb - fa;
      return String(b._id).localeCompare(String(a._id));
    });
  }, [ventas]);

  const statusMetrics = useMemo(() => {
    const counters = {
      en_proceso: 0,
      finalizada: 0,
      despachada: 0,
    };

    const now = Date.now();
    const windowStart =
      now - DESPACHADA_WINDOW_DAYS * 24 * 60 * 60 * 1000;

    ventasOrdenadas.forEach((venta) => {
      if (!venta || typeof counters[venta.estado] !== "number") return;

      if (venta.estado === "despachada") {
        const fechaDespacho =
          new Date(
            venta.fechaDespacho ||
              venta.fechaEntrega ||
              venta.updatedAt ||
              venta.fecha ||
              venta.createdAt ||
              0
          ).getTime();

        if (!Number.isNaN(fechaDespacho) && fechaDespacho >= windowStart) {
          counters.despachada += 1;
        }
        return;
      }

      counters[venta.estado] += 1;
    });
    return counters;
  }, [ventasOrdenadas]);

  const currencyFormatter = useMemo(
    () =>
      new Intl.NumberFormat("es-AR", {
        style: "currency",
        currency: "ARS",
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }),
    []
  );

  const { pendingAmount, dueSoonCount, dueSoonList } = useMemo(() => {
    const now = Date.now();
    const thresholdMs = ALERT_THRESHOLD_DAYS * 24 * 60 * 60 * 1000;
    const dayMs = 24 * 60 * 60 * 1000;
    let pending = 0;
    let due = 0;
    const alerts = [];

    ventasOrdenadas.forEach((venta) => {
      const restanValue = Number(venta?.restan ?? 0);
      if (!Number.isNaN(restanValue) && restanValue > 0) {
        pending += restanValue;
      }

      if (venta && ["finalizada", "despachada"].includes(venta.estado)) {
        return;
      }

      if (venta?.fechaLimite) {
        const fechaLimiteMs = new Date(venta.fechaLimite).getTime();
        if (!Number.isNaN(fechaLimiteMs)) {
          const isPast = fechaLimiteMs < now;
          const isSoon =
            fechaLimiteMs >= now && fechaLimiteMs - now <= thresholdMs;
          if (isPast || isSoon) {
            due += 1;
            const diffDays = Math.ceil((fechaLimiteMs - now) / dayMs);
            alerts.push({
              id: venta?._id ?? fechaLimiteMs,
              cliente: venta?.cliente ?? "Sin cliente",
              producto: getProductoLabel(venta),
              fechaLimite: venta?.fechaLimite,
              diffDays,
              estado: isPast ? "vencida" : "proxima",
            });
          }
        }
      }
    });

    return { pendingAmount: pending, dueSoonCount: due, dueSoonList: alerts };
  }, [ventasOrdenadas]);

  useEffect(() => {
    if (showDueAlerts && dueSoonList.length === 0) {
      setShowDueAlerts(false);
    }
  }, [showDueAlerts, dueSoonList.length]);

  const pendingLabel = currencyFormatter.format(pendingAmount);
  const alertsHelperText = dueSoonList.length
    ? showDueAlerts
      ? "Ocultar detalle"
      : "Ver detalle"
    : "Sin alertas activas";

  const metricCards = [
    {
      key: "en_proceso",
      label: "En proceso",
      value: statusMetrics.en_proceso ?? 0,
      helper: "Ventas activas",
      icon: FiRefreshCw,
      accent: "orange.400",
    },
    {
      key: "finalizada",
      label: "Finalizadas",
      value: statusMetrics.finalizada ?? 0,
      helper: "Listas para cobrar",
      icon: FiCheck,
      accent: "green.400",
    },
    {
      key: "despachada",
      label: "Despachadas",
      value: statusMetrics.despachada ?? 0,
      helper: "Entregas últimos 30 días",
      icon: FaTruck,
      accent: "blue.400",
    },
    {
      key: "pending",
      label: "Pendiente de cobro",
      value: pendingLabel,
      helper: "Ventas con saldo",
      icon: FiDollarSign,
      accent: "purple.400",
    },
    {
      key: "alerts",
      label: "Alertas de vencimiento",
      value: dueSoonCount,
      helper: alertsHelperText,
      icon: FiAlertTriangle,
      accent: "red.400",
      onClick: dueSoonList.length ? () => setShowDueAlerts((prev) => !prev) : undefined,
      isDisabled: dueSoonList.length === 0,
      isActive: dueSoonList.length ? showDueAlerts : false,
    },
  ];

  const clienteMatches = useMemo(() => {
    if (!clienteQuery) return 0;
    const needle = normalizeString(clienteQuery);
    if (!needle) return 0;

    return ventasOrdenadas.filter((venta) =>
      normalizeString(venta?.cliente ?? "").includes(needle)
    ).length;
  }, [ventasOrdenadas, clienteQuery]);

  const productoMatches = useMemo(() => {
    if (!productoQuery) return 0;
    const needle = normalizeString(productoQuery);
    if (!needle) return 0;

    return ventasOrdenadas.filter((venta) =>
      normalizeString(getProductoLabel(venta)).includes(needle)
    ).length;
  }, [ventasOrdenadas, productoQuery]);

  const filteredVentas = useMemo(() => {
    const clienteNeedle = normalizeString(clienteQuery);
    const productoNeedle = normalizeString(productoQuery);

    if (!clienteNeedle && !productoNeedle) return ventasOrdenadas;

    return ventasOrdenadas.filter((venta) => {
      const matchesCliente = clienteNeedle
        ? normalizeString(venta?.cliente ?? "").includes(clienteNeedle)
        : true;
      const matchesProducto = productoNeedle
        ? normalizeString(getProductoLabel(venta)).includes(productoNeedle)
        : true;
      return matchesCliente && matchesProducto;
    });
  }, [ventasOrdenadas, clienteQuery, productoQuery]);

  const handleResetFilters = () => {
    setClienteQuery("");
    setProductoQuery("");
  };

  const patchVentaLocal = (idVenta, patch) => {
    if (!patch || typeof patch !== "object") return;
    setVentas((prev) =>
      prev.map((v) => {
        if (v._id !== idVenta) return v;

        const merged = { ...v, ...patch };

        if (Object.prototype.hasOwnProperty.call(patch, "producto")) {
          if (patch.producto && typeof patch.producto === "object") {
            merged.producto = { ...(v.producto || {}), ...patch.producto };
          } else {
            merged.producto = v.producto;
          }
        }

        return merged;
      })
    );
  };

  const handleToggleEstado = async (venta, nextEstado) => {
    const prevEstado = venta.estado;

    patchVentaLocal(venta._id, { estado: nextEstado });
    try {
      const result = await updateVenta(venta._id, { estado: nextEstado });
      const serverPatch =
        result && typeof result === "object"
          ? result.venta && typeof result.venta === "object"
            ? result.venta
            : result
          : null;
      if (serverPatch) {
        patchVentaLocal(venta._id, serverPatch);
      }
    } catch (e) {
      patchVentaLocal(venta._id, { estado: prevEstado });
      console.error("Error actualizando estado de venta:", e);
    }
  };

  const handleTogglePaid = async (venta) => {
    if (!venta) return;
    const restanValue = Number(venta.restan ?? 0);
    const valorTotal = Number(venta.valorTotal ?? 0);
    const sena = Number(venta.seña ?? 0);
    const originalRestan = Math.max(valorTotal - sena, 0);
    const nextRestan = restanValue <= 0 ? originalRestan : 0;

    setMarkingPaidId(venta._id);
    patchVentaLocal(venta._id, { restan: nextRestan });

    try {
      const result = await updateVenta(venta._id, { restan: nextRestan });
      const serverPatch =
        result && typeof result === "object"
          ? result.venta && typeof result.venta === "object"
            ? result.venta
            : result
          : null;
      if (serverPatch) {
        patchVentaLocal(venta._id, serverPatch);
      }
    } catch (error) {
      patchVentaLocal(venta._id, { restan: restanValue });
      console.error("Error alternando el pago de la venta:", error);
    } finally {
      setMarkingPaidId(null);
    }
  };

  if (loading) return <Loader />;
  if (error) return <Text color={errorColor}>Error: {error}</Text>;

  return (
    <Box p={2} bg={bg} minH="100vh">
      <VStack mb={8} spacing={6} align="center" w="full">
        <Box
          w="100%"
          maxW="7xl"
          bg={heroBg}
          borderRadius="3xl"
          p={{ base: 4, md: 8 }}
          borderWidth="1px"
          borderColor={heroBorder}
          boxShadow="2xl"
        >
          <VStack spacing={2} mb={{ base: 4, md: 6 }} textAlign="center">
            <Heading
              color={heading}
              textAlign="center"
              whiteSpace="nowrap"
              fontSize={{ base: "4xl", md: "5xl" }}
              letterSpacing="widest"
            >
              📊 Gestión de Ventas
            </Heading>
          </VStack>
          <SimpleGrid columns={{ base: 1, sm: 2, md: 3, xl: 5 }} spacing={{ base: 3, md: 4 }} w="full">
            {metricCards.map(({ key, ...cardProps }) => (
              <MetricCard key={key} {...cardProps} />
            ))}
          </SimpleGrid>
        </Box>
        {dueSoonList.length > 0 && (
          <Collapse in={showDueAlerts} style={{ width: "100%" }}>
            <Box
              borderWidth="1px"
              borderRadius="2xl"
              borderColor={border}
              bg={cardVentas}
              mt={2}
              p={4}
              maxW="7xl"
              w="100%"
              boxShadow="xl"
            >
              <Text fontWeight="bold" color={heading} mb={3} fontSize="sm">
                Ventas con vencimiento próximo
              </Text>
              <VStack align="stretch" spacing={2}>
                {dueSoonList.map((alert) => (
                  <Box
                    key={alert.id}
                    borderWidth="1px"
                    borderRadius="lg"
                    borderColor={border}
                    p={3}
                  >
                    <Text fontWeight="semibold" color={text} fontSize="sm">
                      {alert.cliente}
                    </Text>
                    <Text color={text} fontSize="sm">
                      {alert.producto || "Sin producto"}
                    </Text>
                    <Text color={text} fontSize="xs">
                      {fmtDateUTC(alert.fechaLimite)} • {formatDueDiffText(alert.diffDays)}
                    </Text>
                  </Box>
                ))}
              </VStack>
            </Box>
          </Collapse>
        )}
      </VStack>
      <VStack spacing={4} mb={4} align="stretch">
        <Flex gap={2} flexWrap={{ base: "wrap", md: "nowrap" }} align="center" w="full">
          <Flex
            gap={2}
            flexWrap={{ base: "wrap", md: "nowrap" }}
            align="center"
            flex="1"
            justify="flex-start"
          >
            <InputGroup
              size="sm"
              maxW={{ base: "100%", md: "180px" }}
              flex={{ base: "1 1 100%", md: "0 0 auto" }}
            >
              <InputLeftElement pointerEvents="none">
                <FiSearch color={iconColor} />
              </InputLeftElement>
              <Input
                size="sm"
                value={clienteQuery}
                onChange={(e) => setClienteQuery(e.target.value)}
                placeholder="Cliente"
                textAlign={"center"}
                bg={cardVentas}
              />
            </InputGroup>
            <InputGroup
              size="sm"
              maxW={{ base: "100%", md: "180px" }}
              flex={{ base: "1 1 100%", md: "0 0 auto" }}
            >
              <InputLeftElement pointerEvents="none">
                <FiSearch color={iconColor} />
              </InputLeftElement>
              <Input
                size="sm"
                value={productoQuery}
                onChange={(e) => setProductoQuery(e.target.value)}
                placeholder="Producto"
                bg={cardVentas}
                textAlign={"center"}
              />
            </InputGroup>
            <Button
              leftIcon={<FiRefreshCw />}
              variant="outline"
              onClick={handleResetFilters}
              isDisabled={!clienteQuery && !productoQuery}
              size="sm"
              flexShrink={0}
            >
              Limpiar filtros
            </Button>
          </Flex>
          <Button
            ml={{ base: 0, md: "auto" }}
            onClick={() => navigate("/ventas/itemAdd")}
            rightIcon={<FaStar size={18} color={iconColor} />}
          >
            Agregar venta
          </Button>
        </Flex>
        <Text fontSize="small" color={"gray.100"}>
          Mostrando {filteredVentas.length} de {ventasOrdenadas.length} ventas.
          {clienteQuery &&
            ` Clientes encontrados: ${clienteMatches}.`}
          {productoQuery &&
            ` Producto vendido ${productoMatches} ${
              productoMatches === 1 ? "vez" : "veces"
            }.`}
        </Text>
      </VStack>
      <VStack spacing={4} align="stretch">
        {filteredVentas.length === 0 ? (
          <Text textAlign="center" color={text}>
            {ventasOrdenadas.length === 0
              ? "No hay ventas registradas"
              : "No se encontraron ventas con los filtros aplicados"}
          </Text>
        ) : (
          filteredVentas.map((venta) => {
            let plantillaId = null;
            if (venta.producto && venta.producto.planillaCosto) {
              plantillaId =
                typeof venta.producto.planillaCosto === "object"
                  ? venta.producto.planillaCosto._id
                  : venta.producto.planillaCosto;
            }
            const restanValue = Number(venta.restan ?? 0);
            const restanLabel = currencyFormatter.format(restanValue);
            const isPaid = restanValue <= 0;
            const togglePaidLabel = isPaid
              ? "Reactivar saldo pendiente"
              : "Marcar venta como pagada";
            return (
              <Box
                key={venta._id}
                p={{ base: 3, md: 5 }}
                borderWidth="1px"
                borderRadius="xl"
                bg={cardVentas}
                borderColor={border}
                shadow="md"
                transition="box-shadow 0.2s"
                _hover={{ shadow: "lg", borderColor: heading }}
                w="full"
                minW={{ base: "280px", md: "640px" }}
                alignSelf="stretch"
              >
                <HStack justifyContent="space-between" mb={2}>
                  <Text fontSize="sm" color={text}>
                    {venta.productoNombre || venta.producto?.nombre || ""}
                  </Text>
                  <HStack spacing={2}>
                    {venta.estado === "finalizada" && (
                      <Text
                        fontSize="xs"
                        color="green.700"
                        bg="green.100"
                        px={2}
                        py={0.5}
                        borderRadius="md"
                      >
                        Finalizada
                      </Text>
                    )}
                    {venta.estado === "en_proceso" && (
                      <Text
                        fontSize="xs"
                        color="orange.800"
                        bg="orange.100"
                        px={2}
                        py={0.5}
                        borderRadius="md"
                      >
                        En proceso
                      </Text>
                    )}
                    {venta.estado === "despachada" && (
                      <Text
                        fontSize="xs"
                        color="blue.700"
                        bg="blue.100"
                        px={2}
                        py={0.5}
                        borderRadius="md"
                      >
                        Despachada
                      </Text>
                    )}
                  </HStack>
                </HStack>

                <HStack
                  spacing={2}
                  alignItems="center"
                  flexWrap="wrap"
                  mb={2}
                  justifyContent={{ base: "flex-start", md: "space-between" }}
                >
                  <Text fontWeight="bold" color={heading} minW="90px">
                    {fmtDateUTC(venta.fecha)}
                  </Text>
                  <Text color={text} minW="120px" fontSize="md">
                    {venta.cliente}
                  </Text>
                  <Text color={text} minW="120px" fontSize="md">
                    {medioLabels[venta.medio] ?? venta.medio}
                  </Text>
                  <HStack spacing={1} minW="160px">
                    <Text color={text} fontSize="md">
                      {getProductoLabel(venta)}
                    </Text>
                    {plantillaId && (
                      <Box ml={1}>
                        <AiOutlineFileSearch
                          style={{ cursor: "pointer" }}
                          onClick={() =>
                            navigate(`/plantillas/plantillaAdd/${plantillaId}`)
                          }
                          title="Ver plantilla de costo"
                          size={20}
                          color={iconColor}
                        />
                      </Box>
                    )}
                    <Text color={text} minW="80px" fontSize="md">
                      x{venta.cantidad}
                    </Text>
                    <Text color={text} minW="140px" fontSize="sm">
                      <b>Fecha límite:</b>{" "}
                      {venta.fechaLimite
                        ? fmtDateUTC(venta.fechaLimite)
                        : "null"}
                    </Text>
                  </HStack>
                </HStack>
                <Box mt={2} w="100%">
                  <Text
                    fontWeight="semibold"
                    color={heading}
                    fontSize="sm"
                    mb={1}
                  >
                    Descripción
                  </Text>
                  <Textarea
                    value={venta.descripcion || venta.descripcionVenta || ""}
                    isReadOnly
                    size="sm"
                    minH="60px"
                    maxH="160px"
                    resize="vertical"
                    bg={descBg}
                    borderColor={border}
                    _readOnly={{ opacity: 1, cursor: "default" }}
                    placeholder="Sin descripción"
                  />
                </Box>

                <Flex
                  gap={4}
                  align="center"
                  flexWrap="wrap"
                  bg={filaMonetariaBg}
                  p={2}
                  borderRadius="md"
                >
                  <Flex gap={2} flexWrap="wrap" align="center">
                    <IconButton
                      aria-label="Editar venta"
                      icon={<FiEdit2 />}
                      colorScheme="green"
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        navigate(`/ventas/itemAdd/${venta._id}`);
                      }}
                    />

                    <IconButton
                      aria-label="Eliminar venta"
                      icon={<MdDeleteForever />}
                      colorScheme="red"
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setDeletingId(venta._id);
                        setIsOpen(true);
                      }}
                    />
                  </Flex>

                  <HStack
                    spacing={4}
                    flexWrap="wrap"
                    flex="1 1 280px"
                    justify="center"
                    textAlign="center"
                  >
                    <Text color={text} fontSize="sm">
                      <b>Envío:</b> {currencyFormatter.format(venta.valorEnvio)}
                    </Text>
                    <Text color={text} fontSize="sm">
                      <b>Seña:</b> {currencyFormatter.format(venta.seña)}
                    </Text>
                    <Text color={text} fontSize="sm">
                      <b>Total:</b> {currencyFormatter.format(venta.valorTotal)}
                    </Text>
                    <Flex align="center" gap={1} justify="center">
                      <Text color={heading} fontWeight="bold" fontSize="md">
                        Restan: {restanLabel}
                      </Text>
                        <IconButton
                          aria-label={togglePaidLabel}
                          icon={isPaid ? <FiCheckCircle /> : <FiCircle />}
                          colorScheme={isPaid ? "green" : "gray"}
                          variant={isPaid ? "solid" : "ghost"}
                          size="sm"
                          isLoading={markingPaidId === venta._id}
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleTogglePaid(venta);
                          }}
                        />
                    </Flex>
                  </HStack>

                  <Flex gap={2} ml={{ base: 0, md: "auto" }} flexWrap="wrap" justify="flex-end">
                    <IconButton
                      type="button"
                      aria-label="Marcar como en proceso"
                      icon={<GiFactory />}
                      colorScheme={
                        venta.estado === "en_proceso" ? "orange" : "gray"
                      }
                      variant={
                        venta.estado === "en_proceso" ? "solid" : "ghost"
                      }
                      size="sm"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        const next =
                          venta.estado === "en_proceso"
                            ? "pendiente"
                            : "en_proceso";
                        handleToggleEstado(venta, next);
                      }}
                    />
                    <IconButton
                      aria-label="Marcar como finalizada"
                      icon={<FiCheck />}
                      colorScheme={
                        venta.estado === "finalizada" ? "green" : "gray"
                      }
                      variant={
                        venta.estado === "finalizada" ? "solid" : "ghost"
                      }
                      size="sm"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        const next =
                          venta.estado === "finalizada"
                            ? "pendiente"
                            : "finalizada";
                        handleToggleEstado(venta, next);
                      }}
                    />
                    <IconButton
                      aria-label="Marcar como despachada"
                      icon={<FaTruck />}
                      colorScheme={
                        venta.estado === "despachada" ? "blue" : "gray"
                      }
                      variant={
                        venta.estado === "despachada" ? "solid" : "ghost"
                      }
                      size="sm"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        const next =
                          venta.estado === "despachada"
                            ? "pendiente"
                            : "despachada";
                        handleToggleEstado(venta, next);
                      }}
                    />
                  </Flex>
                </Flex>
              </Box>
            );
          })
        )}
        <HStack justifyContent="space-between" mt={4}>
          <Text color={text}>
            Página {page} de {totalPages} — Total: {total}
          </Text>
          <HStack>
            <Button
              onClick={() => setPage(Math.max(1, page - 1))}
              isDisabled={page <= 1}
            >
              Anterior
            </Button>
            <Button
              onClick={() => setPage(Math.min(totalPages, page + 1))}
              isDisabled={page >= totalPages}
            >
              Siguiente
            </Button>
          </HStack>
        </HStack>
        <AlertDialog
          isOpen={isOpen}
          leastDestructiveRef={cancelRef}
          onClose={() => {
            setIsOpen(false);
            setDeletingId(null);
          }}
          isCentered
        >
          <AlertDialogOverlay>
            <AlertDialogContent>
              <AlertDialogHeader fontSize="lg" fontWeight="bold">
                Eliminar venta
              </AlertDialogHeader>

              <AlertDialogBody>
                ¿Estás seguro de que quieres eliminar esta venta? Esta acción no
                se puede deshacer.
              </AlertDialogBody>

              <AlertDialogFooter>
                <Button ref={cancelRef} onClick={() => setIsOpen(false)}>
                  Cancelar
                </Button>
                <Button
                  colorScheme="red"
                  onClick={async () => {
                    try {
                      await removeVenta(deletingId);
                      setIsOpen(false);
                      setDeletingId(null);

                      setVentas((prev) =>
                        prev.filter((v) => v._id !== deletingId)
                      );
                    } catch (err) {
                      console.error("Error eliminando:", err);
                    }
                  }}
                  ml={3}
                  isLoading={deleting}
                >
                  Sí, eliminar
                </Button>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialogOverlay>
        </AlertDialog>
      </VStack>
    </Box>
  );
};

const MetricCard = ({
  label,
  value,
  helper,
  icon,
  accent = "blue.400",
  onClick,
  isDisabled,
  isActive,
}) => {
  const cardBg = useColorModeValue("whiteAlpha.900", "gray.800");
  const muted = useColorModeValue("gray.600", "gray.300");
  const borderColor = useColorModeValue("blackAlpha.100", "whiteAlpha.200");
  const iconBg = useColorModeValue("blackAlpha.50", "whiteAlpha.200");

  const handleClick = () => {
    if (onClick && !isDisabled) {
      onClick();
    }
  };

  return (
    <Box
      position="relative"
      p={{ base: 4, md: 5 }}
      borderRadius="xl"
      borderWidth="1px"
      borderColor={borderColor}
      bg={cardBg}
      boxShadow={isActive ? "2xl" : "xl"}
      cursor={onClick && !isDisabled ? "pointer" : "default"}
      onClick={handleClick}
      transition="all 0.2s ease"
      _hover={{
        transform: !isDisabled ? "translateY(-4px)" : undefined,
        boxShadow: !isDisabled ? "3xl" : undefined,
      }}
      opacity={isDisabled ? 0.55 : 1}
    >
      <Box
        position="absolute"
        top={0}
        left={0}
        right={0}
        h="3px"
        borderTopLeftRadius="2xl"
        borderTopRightRadius="2xl"
        bg={accent}
      />
      <Flex justify="space-between" align="center" mb={3}>
        <Text fontSize="xs" letterSpacing="0.2em" textTransform="uppercase" color={muted}>
          {label}
        </Text>
        {icon && (
          <Circle size={9} bg={iconBg} color={accent}>
            <Icon as={icon} />
          </Circle>
        )}
      </Flex>
      <Text fontSize={{ base: "2xl", md: "3xl" }} fontWeight="extrabold" color={accent}>
        {value}
      </Text>
      {helper && (
        <Text mt={1} fontSize="xs" color={muted}>
          {helper}
        </Text>
      )}
      {isActive && (
        <Box position="absolute" top={3} right={3} fontSize="xs" fontWeight="semibold" color={accent}>
          activo
        </Box>
      )}
    </Box>
  );
};
