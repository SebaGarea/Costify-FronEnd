import {
  Badge,
  Box,
  Button,
  ButtonGroup,
  Divider,
  Flex,
  FormControl,
  FormLabel,
  Heading,
  HStack,
  Icon,
  IconButton,
  Input,
  SimpleGrid,
  Stack,
  Stat,
  StatHelpText,
  StatLabel,
  StatNumber,
  Text,
  Tooltip,
  VStack,
  useColorModeValue,
  useDisclosure,
} from "@chakra-ui/react";
import { useMemo, useState } from "react";
import {
  FaBalanceScale,
  FaCashRegister,
  FaChartLine,
  FaClipboardList,
  FaCrown,
  FaCubes,
  FaExclamationTriangle,
  FaHourglassHalf,
  FaShoppingBag,
  FaTruck,
  FaWarehouse,
} from "react-icons/fa";
import { FiChevronLeft, FiChevronRight } from "react-icons/fi";
import { Loader } from "..";
import {
  useGetAllPlantillas,
  useGetAllVentas,
  useItems,
  useItemsMateriasPrimas,
} from "../../hooks";
import { useGetTareasPaginated } from "../../hooks/tareas/useGetTareasPaginated.js";
import { useCalendarEvents } from "../../hooks/calendar/useCalendarEvents.js";
import { DayEventsModal } from "./DayEventsModal.jsx";
import { UnifiedCalendar } from "../Calendar/UnifiedCalendar.jsx";

const getProductLabel = (venta = {}) => {
  if (venta?.productoNombre) return venta.productoNombre;
  if (venta?.producto) {
    const nombre = venta.producto.nombre ?? "";
    const modelo = venta.producto.modelo ?? "";
    const label = `${nombre} ${modelo}`.trim();
    return label || "Producto sin nombre";
  }
  return "Producto sin nombre";
};

const salesChannelLabels = {
  mercado_libre: "Mercado Libre",
  instagram: "Instagram",
  nube: "Nube",
  whatsapp: "WhatsApp",
  otro: "Otro",
};

const weekDayLabels = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

const capitalizeLabel = (value = "") =>
  value ? value.charAt(0).toUpperCase() + value.slice(1) : "";

const StatCard = ({
  label,
  value,
  helpText,
  icon,
  accentColor,
  accentBg,
  cardBg,
  borderColor,
}) => {
  const labelColor = useColorModeValue("gray.600", "gray.400");
  const helpColor = useColorModeValue("gray.600", "gray.400");
  return (
    <Flex
      p={5}
      borderRadius="xl"
      bg={cardBg}
      borderWidth="1px"
      borderColor={borderColor}
      align="center"
      justify="space-between"
      gap={6}
      transition="border-color 0.15s ease, transform 0.15s ease"
      _hover={{ borderColor: accentColor, transform: "translateY(-2px)" }}
    >
      <Stat>
        <StatLabel
          fontSize="sm"
          fontWeight="medium"
          color={labelColor}
        >
          {label}
        </StatLabel>
        <StatNumber fontSize="2xl" color={accentColor} fontFamily="heading">
          {value}
        </StatNumber>
        {helpText && <StatHelpText color={helpColor}>{helpText}</StatHelpText>}
      </Stat>
      {icon && (
        <Flex
          w={14}
          h={14}
          borderRadius="full"
          align="center"
          justify="center"
          bg={accentBg}
        >
          <Icon as={icon} boxSize={6} color={accentColor} />
        </Flex>
      )}
    </Flex>
  );
};

const InsightCard = ({ title, value, caption, icon, cardBg, borderColor }) => {
  const captionColor = useColorModeValue("gray.600", "gray.400");
  const iconBg = useColorModeValue("blackAlpha.100", "whiteAlpha.200");
  return (
    <Flex
      p={4}
      borderRadius="xl"
      bg={cardBg}
      borderWidth="1px"
      borderColor={borderColor}
      align="center"
      gap={4}
      transition="border-color 0.15s ease, transform 0.15s ease"
      _hover={{ borderColor: "teal.300", transform: "translateY(-2px)" }}
    >
      {icon && (
        <Flex
          w={12}
          h={12}
          borderRadius="lg"
          align="center"
          justify="center"
          bg={iconBg}
        >
          <Icon as={icon} boxSize={5} />
        </Flex>
      )}
      <Box>
        <Text fontSize="sm" fontWeight="medium" color={captionColor}>
          {title}
        </Text>
        <Text fontSize="lg" fontWeight="bold" fontFamily="heading" className="tnum">
          {value}
        </Text>
        {caption && (
          <Text fontSize="sm" color={captionColor}>
            {caption}
          </Text>
        )}
      </Box>
    </Flex>
  );
};

export const HomeView = () => {
  const {
    ventasData,
    loading: ventasLoading,
    error: ventasError,
  } = useGetAllVentas();

  const {
    items: tareasItems,
    loading: tareasLoading,
    error: tareasError,
  } = useGetTareasPaginated(1, 50);
  const { productsData = [], loading: productsLoading } = useItems();
  const {
    plantillasData = [],
    loading: plantillasLoading,
    error: plantillasError,
  } = useGetAllPlantillas();
  const {
    rawsMaterialData = [],
    pagination: rawMaterialsPagination,
    loading: materiasLoading,
  } = useItemsMateriasPrimas();

  const isLoading = ventasLoading || productsLoading || plantillasLoading || materiasLoading;
  const errorMessage = ventasError || plantillasError;

  const [dateFilterMode, setDateFilterMode] = useState("last30");
  const [customRange, setCustomRange] = useState({ start: "", end: "" });

  const dayModal = useDisclosure();
  const [selectedDay, setSelectedDay] = useState(null);

  const today = useMemo(() => {
    const now = new Date();
    return {
      day: now.getDate(),
      month: now.getMonth(),
      year: now.getFullYear(),
    };
  }, []);

  const todayLabel = useMemo(() => {
    const label = new Date().toLocaleDateString("es-AR", {
      weekday: "long",
      day: "numeric",
      month: "long",
    });
    return capitalizeLabel(label);
  }, []);

  const gradientBg = useColorModeValue(
    "linear-gradient(180deg, #f5f7fb 0%, #eef2f9 100%)",
    "linear-gradient(180deg, #050b13 0%, #0b1422 100%)"
  );
  const cardBg = useColorModeValue("rgba(255,255,255,0.95)", "rgba(15,23,42,0.85)");
  const borderColor = useColorModeValue("gray.200", "gray.700");
  // Cockpit discipline: teal is the default voice; semantic color only where it
  // carries meaning (green = margin, amber = pending balance, red = overdue).
  const accentTeal = useColorModeValue("teal.600", "teal.300");
  const accentTealBg = useColorModeValue("teal.50", "whiteAlpha.200");
  const accentAmber = useColorModeValue("orange.600", "orange.300");
  const accentAmberBg = useColorModeValue("orange.50", "whiteAlpha.200");
  const accentGreen = useColorModeValue("green.600", "green.300");
  const accentGreenBg = useColorModeValue("green.50", "whiteAlpha.200");
  const accentRed = useColorModeValue("red.600", "red.300");
  const accentRedBg = useColorModeValue("red.50", "whiteAlpha.200");
  const primaryText = useColorModeValue("gray.800", "gray.100");
  const channelRankBg = useColorModeValue("gray.100", "gray.700");
  const mutedText = useColorModeValue("gray.600", "gray.400");
  const innerCardBg = useColorModeValue("white", "gray.900");
  const deliveryAccentBg = useColorModeValue("red.50", "rgba(185, 28, 28, 0.3)");
  const deliveryAccentBorder = useColorModeValue("red.200", "red.400");
  const deliveryText = useColorModeValue("red.600", "red.200");

  const ventas = useMemo(() => (Array.isArray(ventasData) ? ventasData : []), [ventasData]);

  // Calendario unificado: misma fuente de verdad que /tareas para evitar inconsistencias
  const {
    events: fcEvents,
    itemsByDay: calendarItemsByDay,
    buildDayKey,
    refetchAll: refetchCalendar,
  } = useCalendarEvents({ ventasDataExt: ventas });

  const pendingHistoric = useMemo(() => {
    if (!ventas.length) return { pendingCount: 0, pendingAmount: 0 };

    let pendingCount = 0;
    let pendingAmount = 0;

    ventas.forEach((venta) => {
      const restan = Number(venta?.restan ?? 0);
      if (Number.isFinite(restan) && restan > 0) {
        pendingCount += 1;
        pendingAmount += restan;
      }
    });

    return { pendingCount, pendingAmount };
  }, [ventas]);

  const deliveriesStatus = useMemo(() => {
    if (!ventas.length) {
      return { upcomingCount: 0, overdueCount: 0, overdueList: [] };
    }

    const now = new Date();
    const startOfToday = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate()
    );
    const endOfWindow = new Date(startOfToday);
    endOfWindow.setDate(endOfWindow.getDate() + 7);
    endOfWindow.setHours(23, 59, 59, 999);

    let upcomingCount = 0;
    const overdueList = [];

    ventas.forEach((venta) => {
      if (venta?.estado === "despachada") return;
      const entregaRaw = venta?.fechaEntrega || venta?.fechaLimite;
      if (!entregaRaw) return;
      const entrega = new Date(entregaRaw);
      if (Number.isNaN(entrega.getTime())) return;

      if (entrega.getTime() < startOfToday.getTime()) {
        const diasAtraso = Math.floor(
          (startOfToday.getTime() - entrega.getTime()) / (1000 * 60 * 60 * 24)
        );
        overdueList.push({
          id: venta?._id || `${entregaRaw}-${overdueList.length}`,
          producto: getProductLabel(venta),
          cliente:
            venta?.cliente?.nombre ||
            venta?.clienteNombre ||
            (typeof venta?.cliente === "string" ? venta.cliente : ""),
          fechaEntrega: entrega,
          diasAtraso,
        });
      } else if (entrega.getTime() <= endOfWindow.getTime()) {
        upcomingCount += 1;
      }
    });

    overdueList.sort((a, b) => b.diasAtraso - a.diasAtraso);

    return {
      upcomingCount,
      overdueCount: overdueList.length,
      overdueList,
    };
  }, [ventas]);

  const pendingTasksPreview = useMemo(() => {
    const tareas = Array.isArray(tareasItems) ? tareasItems : [];
    const pendientes = tareas.filter((t) => t?.status === "pendiente" && t?.title);

    pendientes.sort((a, b) => {
      const ad = a?.dueDate ? new Date(a.dueDate).getTime() : Number.POSITIVE_INFINITY;
      const bd = b?.dueDate ? new Date(b.dueDate).getTime() : Number.POSITIVE_INFINITY;
      if (ad !== bd) return ad - bd;

      const au = new Date(a?.updatedAt || a?.createdAt || 0).getTime();
      const bu = new Date(b?.updatedAt || b?.createdAt || 0).getTime();
      return bu - au;
    });

    return pendientes.slice(0, 4);
  }, [tareasItems]);

  const getPriorityBadge = (priority) => {
    if (priority === "alta") return { scheme: "red", label: "Alta" };
    if (priority === "baja") return { scheme: "gray", label: "Baja" };
    return { scheme: "orange", label: "Media" };
  };

  const fmtDateShort = (d) => {
    try {
      if (!d) return "";
      const date = new Date(d);
      if (Number.isNaN(date.getTime())) return "";
      return date.toLocaleDateString("es-AR", { day: "2-digit", month: "short" });
    } catch {
      return "";
    }
  };

  const openDayModal = (cellOrDate) => {
    const date = cellOrDate instanceof Date ? cellOrDate : cellOrDate?.date;
    if (!date) return;
    setSelectedDay(date);
    dayModal.onOpen();
  };

  const selectedDayItems = useMemo(() => {
    if (!selectedDay) return [];
    return calendarItemsByDay.get(buildDayKey(selectedDay)) || [];
  }, [selectedDay, calendarItemsByDay, buildDayKey]);

  const handleCalendarEventClick = (info) => {
    const dayKey = info.event.extendedProps?.dayKey;
    if (dayKey) {
      const [y, m, d] = dayKey.split("-").map(Number);
      openDayModal(new Date(y, m, d));
      return;
    }
    if (info.event.start) {
      openDayModal(new Date(info.event.start));
    }
  };

  const currencyFormatter = useMemo(
    () =>
      new Intl.NumberFormat("es-AR", {
        style: "currency",
        currency: "ARS",
        maximumFractionDigits: 0,
      }),
    []
  );

  const numberFormatter = useMemo(
    () =>
      new Intl.NumberFormat("es-AR", {
        maximumFractionDigits: 0,
      }),
    []
  );

    const selectedRange = useMemo(() => {
      if (dateFilterMode === "custom") {
        const hasStart = Boolean(customRange.start);
        const hasEnd = Boolean(customRange.end);
        if (hasStart && hasEnd) {
          const start = new Date(customRange.start);
          const end = new Date(customRange.end);
          if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
            return { start: null, end: null, isCustom: true };
          }
          start.setHours(0, 0, 0, 0);
          end.setHours(23, 59, 59, 999);

          if (start.getTime() > end.getTime()) {
            return { start: end, end: start, isCustom: true };
          }

          return { start, end, isCustom: true };
        }
        return { start: null, end: null, isCustom: true };
      }

      const end = new Date();
      end.setHours(23, 59, 59, 999);
      const start = new Date(end);
      start.setMonth(start.getMonth() - 1);
      start.setHours(0, 0, 0, 0);
      return { start, end, isCustom: false };
    }, [dateFilterMode, customRange]);

    const filteredVentas = useMemo(() => {
      if (!ventas.length) return [];
      if (!selectedRange.start || !selectedRange.end) return ventas;

      const startMs = selectedRange.start.getTime();
      const endMs = selectedRange.end.getTime();

      return ventas.filter((venta) => {
        const baseDate = venta?.fecha || venta?.createdAt || venta?.updatedAt;
        if (!baseDate) return false;
        const date = new Date(baseDate);
        if (Number.isNaN(date.getTime())) return false;
        const time = date.getTime();
        return time >= startMs && time <= endMs;
      });
    }, [ventas, selectedRange]);

    const formatDateLabel = (date) =>
      date?.toLocaleDateString("es-AR", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });

    const salesMetrics = useMemo(() => {
      if (!filteredVentas.length) {
        return {
          totalRevenue: 0,
          conversionRate: 0,
          pendingCount: 0,
          pendingAmount: 0,
          estimatedMargin: 0,
          finalizadas: 0,
          totalVentas: 0,
          topProduct: { label: "Sin datos", salesCount: 0, units: 0, revenue: 0 },
          topProducts: [],
          totalUnits: 0,
          lastUpdate: null,
        };
      }

    let totalRevenue = 0;
    let totalCost = 0;
    let pendingCount = 0;
    let pendingAmount = 0;
    let finalizadas = 0;
    const productMap = new Map();
    let totalUnits = 0;
    let lastUpdate = 0;

    filteredVentas.forEach((venta) => {
      const total = Number(venta?.valorTotal ?? 0);
      totalRevenue += Number.isFinite(total) ? total : 0;

      const restan = Number(venta?.restan ?? 0);
      if (Number.isFinite(restan) && restan > 0) {
        pendingCount += 1;
        pendingAmount += restan;
      }

      if (venta?.estado === "finalizada") {
        finalizadas += 1;
      }

      const unitCost = Number(
        venta?.producto?.planillaCosto?.costoTotal ?? venta?.plantilla?.costoTotal ?? 0
      );
      const quantityRaw = Number(venta?.cantidad ?? 1);
      const quantity = Number.isFinite(quantityRaw) && quantityRaw > 0 ? quantityRaw : 1;
      totalUnits += quantity;
      if (Number.isFinite(unitCost) && unitCost > 0) {
        totalCost += unitCost * quantity;
      }

      const label = getProductLabel(venta);
      const key = venta?.producto?._id ?? label ?? venta?._id;
      if (label) {
        const current = productMap.get(key) || {
          label,
          salesCount: 0,
          units: 0,
          revenue: 0,
        };
        current.salesCount += 1;
        current.units += quantity;
        current.revenue += Number.isFinite(total) ? total : 0;
        productMap.set(key, current);
      }

      const updatedAt = new Date(
        venta?.updatedAt || venta?.createdAt || venta?.fecha || Date.now()
      ).getTime();
      if (!Number.isNaN(updatedAt)) {
        lastUpdate = Math.max(lastUpdate, updatedAt);
      }
    });

    const productsArray = Array.from(productMap.values());

    const topProduct =
      productsArray
        .slice()
        .sort((a, b) => {
          if (b.salesCount !== a.salesCount) return b.salesCount - a.salesCount;
          if (b.units !== a.units) return b.units - a.units;
          return b.revenue - a.revenue;
        })[0] ?? { label: "Sin datos", salesCount: 0, units: 0, revenue: 0 };

    const topProducts = productsArray
      .slice()
      .sort((a, b) => {
        if (b.units !== a.units) return b.units - a.units;
        if (b.salesCount !== a.salesCount) return b.salesCount - a.salesCount;
        return b.revenue - a.revenue;
      })
      .slice(0, 3);

    const totalVentas = filteredVentas.length;
    const conversionRate = totalVentas ? finalizadas / totalVentas : 0;
    const estimatedMargin = totalRevenue - totalCost;

    return {
      totalRevenue,
      conversionRate,
      pendingCount,
      pendingAmount,
      estimatedMargin,
      finalizadas,
      totalVentas,
      topProduct,
      topProducts,
      totalUnits,
      lastUpdate: lastUpdate ? new Date(lastUpdate) : null,
    };
  }, [filteredVentas]);

  const mediumPerformance = useMemo(() => {
    if (!filteredVentas.length) {
      return { totalRevenue: 0, topMediums: [] };
    }

    const aggregator = new Map();
    let totalRevenue = 0;

    filteredVentas.forEach((venta) => {
      const medioKey = venta?.medio || "otro";
      const label = salesChannelLabels[medioKey] || medioKey;
      const total = Number(venta?.valorTotal ?? 0) || 0;
      if (Number.isFinite(total)) {
        totalRevenue += total;
      }
      const current = aggregator.get(medioKey) || {
        key: medioKey,
        label,
        count: 0,
        revenue: 0,
      };
      current.count += 1;
      current.revenue += Number.isFinite(total) ? total : 0;
      aggregator.set(medioKey, current);
    });

    const topMediums = Array.from(aggregator.values())
      .sort((a, b) => {
        if (b.revenue !== a.revenue) return b.revenue - a.revenue;
        return b.count - a.count;
      })
      .slice(0, 3);

    return { totalRevenue, topMediums };
  }, [filteredVentas]);

  const inventoryMetrics = useMemo(() => {
    const productsCount = Array.isArray(productsData) ? productsData.length : 0;
    const plantillasCount = Array.isArray(plantillasData) ? plantillasData.length : 0;
    const rawMaterialsTotal = Number(rawMaterialsPagination?.total);
    const rawMaterialsCount = Number.isFinite(rawMaterialsTotal)
      ? rawMaterialsTotal
      : Array.isArray(rawsMaterialData)
        ? rawsMaterialData.length
        : 0;
    const stockUnits = (productsData || []).reduce(
      (acc, product) => acc + Number(product?.stock ?? 0),
      0
    );
    const productsWithPlanilla = (productsData || []).filter(
      (product) => Boolean(product?.planillaCosto)
    ).length;
    const planillaCoverage = productsCount
      ? Math.round((productsWithPlanilla / productsCount) * 100)
      : 0;

    return {
      productsCount,
      plantillasCount,
      rawMaterialsCount,
      stockUnits,
      productsWithPlanilla,
      planillaCoverage,
    };
  }, [productsData, plantillasData, rawsMaterialData, rawMaterialsPagination]);

  const rangeDescription = selectedRange.start && selectedRange.end
    ? `${formatDateLabel(selectedRange.start)} — ${formatDateLabel(selectedRange.end)}`
    : dateFilterMode === "custom"
      ? "Seleccioná fecha inicial y final para aplicar el filtro"
      : "Últimos 30 días";

  const lastUpdateText = salesMetrics.lastUpdate
    ? salesMetrics.lastUpdate.toLocaleString("es-AR", {
        dateStyle: "medium",
        timeStyle: "short",
      })
    : "Sin registros";

  if (isLoading) {
    return <Loader />;
  }

  if (errorMessage) {
    return (
      <Box p={8}>
        <Text color="red.400">No pudimos cargar el tablero: {errorMessage}</Text>
      </Box>
    );
  }

  const statCards = [
    {
      label: "Total facturado",
      value: currencyFormatter.format(salesMetrics.totalRevenue),
      helpText: salesMetrics.totalVentas
        ? `${salesMetrics.totalVentas} ventas en el período`
        : "Sin ventas en el período",
      icon: FaCashRegister,
      accentColor: accentTeal,
      accentBg: accentTealBg,
    },
    {
      label: "Ticket promedio",
      value: currencyFormatter.format(
        salesMetrics.totalVentas
          ? salesMetrics.totalRevenue / salesMetrics.totalVentas
          : 0
      ),
      helpText: salesMetrics.totalVentas
        ? `Promedio por venta en el período`
        : "Sin ventas en el período",
      icon: FaShoppingBag,
      accentColor: accentTeal,
      accentBg: accentTealBg,
    },
    {
      label: "Saldo pendiente",
      value: currencyFormatter.format(pendingHistoric.pendingAmount),
      helpText: pendingHistoric.pendingCount
        ? `${numberFormatter.format(pendingHistoric.pendingCount)} ventas con cobro parcial (histórico total)`
        : "Sin saldo pendiente",
      icon: FaHourglassHalf,
      accentColor: accentAmber,
      accentBg: accentAmberBg,
    },
    {
      label: "Margen estimado de Ganancias",
      value: currencyFormatter.format(salesMetrics.estimatedMargin),
      helpText: `Costos estimados ${currencyFormatter.format(
        salesMetrics.totalRevenue - salesMetrics.estimatedMargin
      )}`,
      icon: FaBalanceScale,
      accentColor: accentGreen,
      accentBg: accentGreenBg,
    },
    {
      label: "Producto estrella",
      value: salesMetrics.topProduct.label || "Sin datos",
      helpText: salesMetrics.topProduct.salesCount
        ? `${numberFormatter.format(salesMetrics.topProduct.salesCount)} ventas | ${numberFormatter.format(
            salesMetrics.topProduct.units
          )} unidades en el período`
        : "Sin ventas en el período",
      icon: FaCrown,
      accentColor: accentTeal,
      accentBg: accentTealBg,
    },
    {
      label: "Conversión finalizadas",
      value: `${(salesMetrics.conversionRate * 100 || 0).toFixed(1)}%`,
      helpText: `${salesMetrics.finalizadas} finalizadas en el período`,
      icon: FaChartLine,
      accentColor: accentTeal,
      accentBg: accentTealBg,
    },
    {
      label: "Entregas próximas (7 días)",
      value: numberFormatter.format(deliveriesStatus.upcomingCount),
      helpText: deliveriesStatus.upcomingCount
        ? "Ventas no despachadas con entrega esta semana"
        : "Sin entregas en los próximos 7 días",
      icon: FaTruck,
      accentColor: accentTeal,
      accentBg: accentTealBg,
    },
    {
      label: "Ventas atrasadas",
      value: numberFormatter.format(deliveriesStatus.overdueCount),
      helpText: deliveriesStatus.overdueCount
        ? "Vencidas sin despachar"
        : "Sin entregas vencidas",
      icon: FaExclamationTriangle,
      accentColor: accentRed,
      accentBg: accentRedBg,
      tooltip: deliveriesStatus.overdueCount
        ? (
          <Box color="gray.900" maxW="280px">
            <Text fontWeight="bold" fontSize="sm" mb={2}>
              {deliveriesStatus.overdueCount} venta{deliveriesStatus.overdueCount > 1 ? "s" : ""} atrasada{deliveriesStatus.overdueCount > 1 ? "s" : ""}
            </Text>
            <Stack spacing={2}>
              {deliveriesStatus.overdueList.slice(0, 8).map((item) => (
                <Box
                  key={item.id}
                  borderBottom="1px"
                  borderColor="gray.200"
                  pb={1}
                >
                  <Text fontWeight="semibold" fontSize="sm">
                    {item.producto}
                  </Text>
                  {item.cliente && (
                    <Text fontSize="xs" color="gray.600">
                      Cliente: {item.cliente}
                    </Text>
                  )}
                  <Text fontSize="xs" color="red.600">
                    Vencida hace {item.diasAtraso} día{item.diasAtraso === 1 ? "" : "s"}
                    {" · "}
                    {item.fechaEntrega.toLocaleDateString("es-AR", {
                      day: "2-digit",
                      month: "short",
                    })}
                  </Text>
                </Box>
              ))}
              {deliveriesStatus.overdueList.length > 8 && (
                <Text fontSize="xs" color="gray.600" fontStyle="italic">
                  + {deliveriesStatus.overdueList.length - 8} más…
                </Text>
              )}
            </Stack>
          </Box>
        )
        : null,
    },
  ];

  return (
    <Box
      minH="100vh"
      px={{ base: 4, md: 10 }}
      py={{ base: 6, md: 10 }}
      bgGradient={gradientBg}
    >
      <Stack spacing={8} maxW="1200px" mx="auto">
        <Flex
          direction={{ base: "column", xl: "row" }}
          gap={6}
          align={{ base: "stretch", xl: "flex-start" }}
        >
          <Stack spacing={3} flex="1">
            {/* <Badge
              alignSelf="flex-start"
              colorScheme="teal"
              px={3}
              py={1}
              borderRadius="full"
              fontSize="0.7rem"
            >
              Tablero operativo
            </Badge> */}
            <Heading
              fontSize={{ base: "2xl", md: "4xl" }}
              fontFamily="heading"
            >
              Dashboard Operativo
            </Heading>
            <Text fontSize="md" color={mutedText} maxW="720px">
              Monitoreá ventas, márgenes y capacidad en un solo lugar, con métricas que se
              actualizan al instante.
            </Text>
            
            <Flex
              mt={2}
              m={2}
              p={2}
              borderRadius="xl"
              borderWidth="1px"
              borderColor={borderColor}
              bg={cardBg}
              direction={{ base: "column", md: "row" }}
              align={{ base: "flex-start", md: "center" }}
              justify="space-between"
              gap={4}
            >
              <Box>
                <Text fontSize="sm" color={mutedText}>
                  Última sincronización: <strong>{lastUpdateText}</strong>
                </Text>
                <Text fontSize="sm" color={mutedText}>
                  Período analizado: <strong>{rangeDescription}</strong>
                </Text>
              </Box>
              <ButtonGroup size="sm" variant="solid" colorScheme="teal">
                <Button
                  variant={dateFilterMode === "last30" ? "solid" : "outline"}
                  onClick={() => setDateFilterMode("last30")}
                >
                  Últimos 30 días
                </Button>
                <Button
                  variant={dateFilterMode === "custom" ? "solid" : "outline"}
                  onClick={() => setDateFilterMode("custom")}
                >
                  Rango personalizado
                </Button>
              </ButtonGroup>
            </Flex>

            <Box
              p={4}
              borderRadius="xl"
              borderWidth="1px"
              borderColor={borderColor}
              bg={cardBg}
            >
              <Flex align="center" justify="space-between" mb={3} gap={3} flexWrap="wrap">
                <HStack spacing={2}>
                  <Icon as={FaClipboardList} color={accentTeal} />
                  <Heading size="sm" fontFamily="heading">
                    Tareas pendientes
                  </Heading>
                </HStack>
                <Text fontSize="xs" color={mutedText}>
                  {tareasLoading
                    ? "Cargando…"
                    : tareasError
                      ? "No se pudieron cargar"
                      : pendingTasksPreview.length
                        ? `${pendingTasksPreview.length} mostradas`
                        : "Sin pendientes"}
                </Text>
              </Flex>

              {tareasLoading && pendingTasksPreview.length === 0 ? (
                <Text fontSize="sm" color={mutedText}>
                  Buscando tareas…
                </Text>
              ) : pendingTasksPreview.length === 0 ? (
                <Text fontSize="sm" color={mutedText}>
                  No tenés tareas pendientes.
                </Text>
              ) : (
                <VStack align="stretch" spacing={2}>
                  {pendingTasksPreview.map((t) => {
                    const pb = getPriorityBadge(t?.priority);
                    const dueLabel = fmtDateShort(t?.dueDate);
                    return (
                      <Flex
                        key={t._id || t.title}
                        align="center"
                        justify="space-between"
                        gap={3}
                        p={2}
                        borderRadius="lg"
                        borderWidth="1px"
                        borderColor={borderColor}
                        bg={innerCardBg}
                      >
                        <Box minW={0}>
                          <Text fontWeight="semibold" noOfLines={1}>
                            {t.title}
                          </Text>
                          <HStack spacing={2} mt={0.5} flexWrap="wrap">
                            <Badge colorScheme={pb.scheme} borderRadius="full" px={2}>
                              {pb.label}
                            </Badge>
                            {dueLabel ? (
                              <Badge
                                colorScheme="red"
                                variant="subtle"
                                borderRadius="full"
                                px={2}
                              >
                                Vence {dueLabel}
                              </Badge>
                            ) : null}
                          </HStack>
                        </Box>
                      </Flex>
                    );
                  })}
                </VStack>
              )}
            </Box>
          </Stack>

          <Box
            w="100%"
            maxW={{ base: "100%", xl: "620px" }}
            flexShrink={0}
          >
            <UnifiedCalendar
              events={fcEvents}
              onDateClick={openDayModal}
              onEventClick={handleCalendarEventClick}
              height={400}
            />
          </Box>
        </Flex>

        {dateFilterMode === "custom" && (
          <Box
            p={4}
            borderRadius="xl"
            bg={cardBg}
            borderWidth="1px"
            borderColor={borderColor}
          >
            <HStack spacing={4} flexWrap="wrap">
              <FormControl maxW="220px">
                <FormLabel fontSize="sm">Desde</FormLabel>
                <Input
                  type="date"
                  value={customRange.start}
                  onChange={(e) =>
                    setCustomRange((prev) => ({ ...prev, start: e.target.value }))
                  }
                />
              </FormControl>
              <FormControl maxW="220px">
                <FormLabel fontSize="sm">Hasta</FormLabel>
                <Input
                  type="date"
                  value={customRange.end}
                  onChange={(e) =>
                    setCustomRange((prev) => ({ ...prev, end: e.target.value }))
                  }
                />
              </FormControl>
              <Box fontSize="sm" color={mutedText}>
                {customRange.start && customRange.end
                  ? "Usando las fechas seleccionadas"
                  : "Seleccioná fecha inicial y final para aplicar el filtro"}
              </Box>
            </HStack>
          </Box>
        )}

        <SimpleGrid columns={{ base: 1, md: 2, xl: 3 }} gap={6}>
          {statCards.map(({ tooltip, ...card }) => {
            const statCard = (
              <StatCard
                {...card}
                cardBg={cardBg}
                borderColor={borderColor}
              />
            );
            if (!tooltip) return <Box key={card.label}>{statCard}</Box>;
            return (
              <Tooltip
                key={card.label}
                label={tooltip}
                hasArrow
                placement="top"
                openDelay={150}
                closeOnClick={false}
              >
                <Box cursor="help" tabIndex={0}>
                  {statCard}
                </Box>
              </Tooltip>
            );
          })}
        </SimpleGrid>

        <Flex direction={{ base: "column", lg: "row" }} gap={6}>
         

<Box p={6} borderRadius="2xl" bg={cardBg} borderWidth="1px" borderColor={borderColor}>
          <Flex
            justify="space-between"
            align={{ base: "flex-start", md: "center" }}
            direction={{ base: "column", md: "row" }}
            gap={3}
            mb={6}
          >
            <Heading size="md" fontFamily="heading">
              Top 3 medios de venta
            </Heading>
            <Text fontSize="sm" color={mutedText}>
              Participación por ingresos en el período seleccionado
            </Text>
          </Flex>
          {mediumPerformance.topMediums.length ? (
            <Stack spacing={4}>
              {mediumPerformance.topMediums.map((medio, index) => {
                const share = mediumPerformance.totalRevenue
                  ? (medio.revenue / mediumPerformance.totalRevenue) * 100
                  : 0;
                return (
                  <Flex
                    key={`${medio.key}-${index}`}
                    p={4}
                    borderWidth="1px"
                    borderColor={borderColor}
                    borderRadius="lg"
                    bg={innerCardBg}
                    align="center"
                    justify="space-between"
                    gap={4}
                    flexWrap="wrap"
                  >
                    <HStack spacing={4} align="center">
                      <Box
                        w={10}
                        h={10}
                        borderRadius="full"
                        bg={channelRankBg}
                        display="flex"
                        alignItems="center"
                        justifyContent="center"
                        fontWeight="bold"
                        color={primaryText}
                      >
                        {index + 1}
                      </Box>
                      <Box>
                        <Text fontWeight="bold" fontSize="lg" color={primaryText}>
                          {medio.label}
                        </Text>
                        <Text fontSize="sm" color={mutedText}>
                          {medio.count} {medio.count === 1 ? "venta" : "ventas"}
                        </Text>
                      </Box>
                    </HStack>
                    <VStack spacing={0} align="flex-end">
                      <Text fontWeight="bold" color={primaryText} className="tnum">
                        {currencyFormatter.format(medio.revenue)}
                      </Text>
                      <Text fontSize="sm" color={mutedText}>
                        {share.toFixed(1)}% del total
                      </Text>
                    </VStack>
                  </Flex>
                );
              })}
            </Stack>
          ) : (
            <Text color={mutedText}>Aún no hay ventas registradas para calcular este ranking.</Text>
          )}
        </Box>

          <Box flex="1" p={6} borderRadius="2xl" bg={cardBg} borderWidth="1px" borderColor={borderColor}>
            <Heading size="md" mb={4} fontFamily="heading">
              Top 3 productos
            </Heading>
            {salesMetrics.topProducts?.length ? (
              <Stack spacing={4}>
                {salesMetrics.topProducts.map((product, index) => {
                  const share = salesMetrics.totalUnits
                    ? (product.units / salesMetrics.totalUnits) * 100
                    : 0;
                  return (
                    <Flex
                      key={`${product.label}-${index}`}
                      p={3}
                      borderWidth="1px"
                      borderColor={borderColor}
                      borderRadius="lg"
                      align="center"
                      justify="space-between"
                      bg={innerCardBg}
                    >
                      <Box>
                        <Text fontWeight="bold" fontSize="lg">
                          {index + 1}. {product.label}
                        </Text>
                        <Text fontSize="sm" color={mutedText}>
                          {numberFormatter.format(product.units)} unidades · {numberFormatter.format(product.salesCount)} ventas
                        </Text>
                      </Box>
                      <Badge colorScheme="teal" borderRadius="full" px={3} py={1}>
                        {share.toFixed(1)}% unidades
                      </Badge>
                    </Flex>
                  );
                })}
              </Stack>
            ) : (
              <Text color={mutedText}>Aún no hay suficiente información para este ranking.</Text>
            )}
          </Box>


        </Flex>

        

        <Box p={6} borderRadius="2xl" bg={cardBg} borderWidth="1px" borderColor={borderColor}>
          <Heading size="md" mb={6} fontFamily="heading">
            Capacidad e insumos
          </Heading>
          <SimpleGrid columns={{ base: 1, md: 3 }} gap={4}>
            <InsightCard
              title="Productos activos"
              value={numberFormatter.format(inventoryMetrics.productsCount)}
              caption={`${numberFormatter.format(inventoryMetrics.stockUnits)} unidades en stock`}
              icon={FaCubes}
              cardBg={innerCardBg}
              borderColor={borderColor}
            />
            <InsightCard
              title="Plantillas de costo"
              value={numberFormatter.format(inventoryMetrics.plantillasCount)}
              caption={`${inventoryMetrics.planillaCoverage}% de cobertura del catálogo`}
              icon={FaClipboardList}
              cardBg={innerCardBg}
              borderColor={borderColor}
            />
            <InsightCard
              title="Materias primas"
              value={numberFormatter.format(inventoryMetrics.rawMaterialsCount)}
              caption="Disponibles para producción"
              icon={FaWarehouse}
              cardBg={innerCardBg}
              borderColor={borderColor}
            />
          </SimpleGrid>
        </Box>
      </Stack>

      <DayEventsModal
        isOpen={dayModal.isOpen}
        onClose={dayModal.onClose}
        date={selectedDay}
        items={selectedDayItems}
        onChanged={refetchCalendar}
      />
    </Box>
  );
};
