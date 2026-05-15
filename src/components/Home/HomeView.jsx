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
import { useGetEventos } from "../../hooks/eventosCalendario/useGetEventos.js";
import { DayEventsModal } from "./DayEventsModal.jsx";

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
      boxShadow="2xl"
      align="center"
      justify="space-between"
      gap={6}
    >
      <Stat>
        <StatLabel
          fontSize="xs"
          textTransform="uppercase"
          letterSpacing="0.2em"
          color={labelColor}
        >
          {label}
        </StatLabel>
        <StatNumber fontSize="2xl" color={accentColor} fontFamily="'Space Grotesk', 'DM Sans', sans-serif">
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
        <Text fontSize="xs" textTransform="uppercase" letterSpacing="0.2em" color={captionColor}>
          {title}
        </Text>
        <Text fontSize="lg" fontWeight="bold" fontFamily="'Space Grotesk', 'DM Sans', sans-serif">
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
  const [calendarDate, setCalendarDate] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });

  // Rango del calendario visible (6 semanas centradas en el mes mostrado)
  const calendarRange = useMemo(() => {
    const startOfMonth = new Date(
      calendarDate.getFullYear(),
      calendarDate.getMonth(),
      1
    );
    const firstWeekday = (startOfMonth.getDay() + 6) % 7;
    const rangeStart = new Date(startOfMonth);
    rangeStart.setDate(rangeStart.getDate() - firstWeekday);
    rangeStart.setHours(0, 0, 0, 0);
    const rangeEnd = new Date(rangeStart);
    rangeEnd.setDate(rangeEnd.getDate() + 42);
    rangeEnd.setHours(23, 59, 59, 999);
    return { start: rangeStart, end: rangeEnd };
  }, [calendarDate]);

  const {
    items: eventosCalendario = [],
    refetch: refetchEventos,
  } = useGetEventos({
    desde: calendarRange.start.toISOString(),
    hasta: calendarRange.end.toISOString(),
  });

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
    "linear-gradient(135deg, #fbf9f3 0%, #daf5f0 100%)",
    "linear-gradient(135deg, #0f172a 0%, #134e4a 100%)"
  );
  const cardBg = useColorModeValue("rgba(255,255,255,0.95)", "rgba(15,23,42,0.85)");
  const borderColor = useColorModeValue("gray.200", "gray.700");
  const accentTeal = useColorModeValue("teal.600", "teal.300");
  const accentTealBg = useColorModeValue("teal.50", "whiteAlpha.200");
  const accentOrange = useColorModeValue("orange.600", "orange.300");
  const accentOrangeBg = useColorModeValue("orange.50", "whiteAlpha.200");
  const accentBlue = useColorModeValue("cyan.600", "cyan.300");
  const accentBlueBg = useColorModeValue("cyan.50", "whiteAlpha.200");
  const accentIndigo = useColorModeValue("indigo.600", "indigo.300");
  const accentIndigoBg = useColorModeValue("indigo.50", "whiteAlpha.200");
  const accentPurple = useColorModeValue("purple.600", "purple.300");
  const accentPurpleBg = useColorModeValue("purple.50", "whiteAlpha.200");
  const accentSky = useColorModeValue("blue.600", "blue.300");
  const accentSkyBg = useColorModeValue("blue.50", "whiteAlpha.200");
  const accentRed = useColorModeValue("red.600", "red.300");
  const accentRedBg = useColorModeValue("red.50", "whiteAlpha.200");
  const accentLime = useColorModeValue("lime.600", "lime.300");
  const accentLimeBg = useColorModeValue("lime.50", "whiteAlpha.200");
  const primaryText = useColorModeValue("gray.800", "gray.100");
  const channelRankBg = useColorModeValue("gray.100", "gray.700");
  const mutedText = useColorModeValue("gray.600", "gray.400");
  const innerCardBg = useColorModeValue("white", "gray.900");
  const deliveryAccentBg = useColorModeValue("red.50", "rgba(185, 28, 28, 0.3)");
  const deliveryAccentBorder = useColorModeValue("red.200", "red.400");
  const deliveryText = useColorModeValue("red.600", "red.200");

  const calendarMonthLabel = useMemo(
    () =>
      capitalizeLabel(
        calendarDate.toLocaleDateString("es-AR", {
          month: "long",
          year: "numeric",
        })
      ),
    [calendarDate]
  );

  const handlePrevMonth = () =>
    setCalendarDate((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  const handleNextMonth = () =>
    setCalendarDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));

  const ventas = useMemo(() => (Array.isArray(ventasData) ? ventasData : []), [ventasData]);

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

  const calendarItemsByDay = useMemo(() => {
    const map = new Map();
    const push = (key, item) => {
      const arr = map.get(key) || [];
      arr.push(item);
      map.set(key, arr);
    };
    const buildKey = (date) =>
      `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;

    // 1) Entregas de ventas (no despachadas)
    (ventas || []).forEach((venta) => {
      if (venta?.estado === "despachada") return;
      const entregaRaw = venta?.fechaEntrega || venta?.fechaLimite;
      if (!entregaRaw) return;
      const entregaDate = new Date(entregaRaw);
      if (Number.isNaN(entregaDate.getTime())) return;

      const clienteNombre =
        venta?.cliente?.nombre ||
        venta?.clienteNombre ||
        (typeof venta?.cliente === "string" ? venta.cliente : "");
      const estadoLabel =
        typeof venta?.estado === "string"
          ? capitalizeLabel(venta.estado.replace(/_/g, " "))
          : "";

      push(buildKey(entregaDate), {
        id: `venta-${venta?._id || buildKey(entregaDate)}`,
        type: "venta",
        title: getProductLabel(venta),
        subtitle: [clienteNombre && `Cliente: ${clienteNombre}`]
          .filter(Boolean)
          .join(""),
        raw: { ...venta, estado: estadoLabel },
      });
    });

    // 2) Tareas pendientes con dueDate
    (tareasItems || []).forEach((t) => {
      if (t?.status !== "pendiente" || !t?.dueDate) return;
      const fecha = new Date(t.dueDate);
      if (Number.isNaN(fecha.getTime())) return;
      push(buildKey(fecha), {
        id: `tarea-${t?._id}`,
        type: "tarea",
        title: t.title || "Tarea",
        subtitle: t.notes || "",
        raw: t,
      });
    });

    // 3) Eventos manuales
    (eventosCalendario || []).forEach((ev) => {
      if (!ev?.fecha) return;
      const fecha = new Date(ev.fecha);
      if (Number.isNaN(fecha.getTime())) return;
      push(buildKey(fecha), {
        id: `evento-${ev?._id}`,
        type: "evento",
        title: ev.title,
        subtitle: ev.hora ? `Hora: ${ev.hora}` : "",
        raw: ev,
      });
    });

    return map;
  }, [ventas, tareasItems, eventosCalendario]);

  const calendarDays = useMemo(() => {
    const startOfMonth = new Date(
      calendarDate.getFullYear(),
      calendarDate.getMonth(),
      1
    );
    const firstWeekday = (startOfMonth.getDay() + 6) % 7;
    const totalCells = 42;
    const cells = [];

    for (let i = 0; i < totalCells; i += 1) {
      const cellDate = new Date(
        calendarDate.getFullYear(),
        calendarDate.getMonth(),
        i - firstWeekday + 1
      );
      const key = `${cellDate.getFullYear()}-${cellDate.getMonth()}-${cellDate.getDate()}`;
      const items = calendarItemsByDay.get(key) || [];
      const hasVenta = items.some((it) => it.type === "venta");
      const hasTarea = items.some((it) => it.type === "tarea");
      const hasEvento = items.some((it) => it.type === "evento");

      cells.push({
        key,
        date: cellDate,
        day: cellDate.getDate(),
        isCurrentMonth: cellDate.getMonth() === calendarDate.getMonth(),
        isToday:
          cellDate.getFullYear() === today.year &&
          cellDate.getMonth() === today.month &&
          cellDate.getDate() === today.day,
        items,
        hasVenta,
        hasTarea,
        hasEvento,
      });
    }

    return cells;
  }, [calendarDate, today, calendarItemsByDay]);

  const openDayModal = (cellOrDate) => {
    const date = cellOrDate instanceof Date ? cellOrDate : cellOrDate?.date;
    if (!date) return;
    setSelectedDay(date);
    dayModal.onOpen();
  };

  const selectedDayItems = useMemo(() => {
    if (!selectedDay) return [];
    const key = `${selectedDay.getFullYear()}-${selectedDay.getMonth()}-${selectedDay.getDate()}`;
    return calendarItemsByDay.get(key) || [];
  }, [selectedDay, calendarItemsByDay]);

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
      accentColor: accentPurple,
      accentBg: accentPurpleBg,
    },
    {
      label: "Saldo pendiente",
      value: currencyFormatter.format(pendingHistoric.pendingAmount),
      helpText: pendingHistoric.pendingCount
        ? `${numberFormatter.format(pendingHistoric.pendingCount)} ventas con cobro parcial (histórico total)`
        : "Sin saldo pendiente",
      icon: FaHourglassHalf,
      accentColor: accentOrange,
      accentBg: accentOrangeBg,
    },
    {
      label: "Margen estimado de Ganancias",
      value: currencyFormatter.format(salesMetrics.estimatedMargin),
      helpText: `Costos estimados ${currencyFormatter.format(
        salesMetrics.totalRevenue - salesMetrics.estimatedMargin
      )}`,
      icon: FaBalanceScale,
      accentColor: accentLime,
      accentBg: accentLimeBg,
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
      accentColor: accentIndigo,
      accentBg: accentIndigoBg,
    },
    {
      label: "Conversión finalizadas",
      value: `${(salesMetrics.conversionRate * 100 || 0).toFixed(1)}%`,
      helpText: `${salesMetrics.finalizadas} finalizadas en el período`,
      icon: FaChartLine,
      accentColor: accentBlue,
      accentBg: accentBlueBg,
    },
    {
      label: "Entregas próximas (7 días)",
      value: numberFormatter.format(deliveriesStatus.upcomingCount),
      helpText: deliveriesStatus.upcomingCount
        ? "Ventas no despachadas con entrega esta semana"
        : "Sin entregas en los próximos 7 días",
      icon: FaTruck,
      accentColor: accentSky,
      accentBg: accentSkyBg,
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
              fontFamily="'Space Grotesk', 'DM Sans', sans-serif"
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
                  <Heading size="sm" fontFamily="'Space Grotesk', 'DM Sans', sans-serif">
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
            maxW={{ base: "100%", xl: "340px" }}
            p={5}
            borderRadius="xl"
            bg={cardBg}
            borderWidth="1px"
            borderColor={borderColor}
            boxShadow="lg"
          >
            <Flex justify="space-between" align="center" mb={4}>
              <Box>
                <Text
                  fontSize="xs"
                  textTransform="uppercase"
                  letterSpacing="0.2em"
                  color={mutedText}
                >
                  Calendario
                </Text>
                <Heading size="md" fontFamily="'Space Grotesk', 'DM Sans', sans-serif">
                  {calendarMonthLabel}
                </Heading>
              </Box>
              <HStack spacing={1}>
                <IconButton
                  aria-label="Mes anterior"
                  icon={<FiChevronLeft />}
                  size="sm"
                  variant="ghost"
                  colorScheme="teal"
                  onClick={handlePrevMonth}
                />
                <IconButton
                  aria-label="Mes siguiente"
                  icon={<FiChevronRight />}
                  size="sm"
                  variant="ghost"
                  colorScheme="teal"
                  onClick={handleNextMonth}
                />
              </HStack>
            </Flex>
            <SimpleGrid columns={7} spacing={1} mb={2}>
              {weekDayLabels.map((day) => (
                <Text
                  key={day}
                  textAlign="center"
                  fontSize="xs"
                  fontWeight="bold"
                  color={mutedText}
                >
                  {day}
                </Text>
              ))}
            </SimpleGrid>
            <SimpleGrid columns={7} spacing={1}>
              {calendarDays.map((cell) => {
                const hasItems = cell.items.length > 0;
                const isInactive = !cell.isCurrentMonth;
                const bg = cell.isToday
                  ? accentTealBg
                  : hasItems
                    ? deliveryAccentBg
                    : isInactive
                      ? channelRankBg
                      : "transparent";
                const borderColorValue = cell.isToday
                  ? accentTeal
                  : hasItems
                    ? deliveryAccentBorder
                    : "transparent";
                const borderWidthValue = borderColorValue === "transparent" ? "0px" : "1px";
                const colorValue = isInactive
                  ? mutedText
                  : hasItems
                    ? deliveryText
                    : primaryText;

                const dotColors = [];
                if (cell.hasVenta) dotColors.push("red.500");
                if (cell.hasTarea) dotColors.push("orange.400");
                if (cell.hasEvento) dotColors.push("teal.400");

                const renderDayBox = (keyValue, additionalProps = {}) => (
                  <Box
                    key={keyValue}
                    textAlign="center"
                    py={2}
                    borderRadius="md"
                    fontSize="sm"
                    fontWeight={cell.isToday ? "bold" : "medium"}
                    color={colorValue}
                    bg={bg}
                    borderWidth={borderWidthValue}
                    borderColor={borderColorValue}
                    opacity={isInactive ? 0.6 : 1}
                    position="relative"
                    cursor="pointer"
                    tabIndex={0}
                    onClick={() => openDayModal(cell)}
                    _hover={{
                      transform: "translateY(-1px)",
                      boxShadow: "sm",
                    }}
                    transition="all 0.15s"
                    {...additionalProps}
                  >
                    {cell.day}
                    {dotColors.length > 0 && (
                      <HStack
                        spacing={0.5}
                        position="absolute"
                        bottom={1}
                        left="50%"
                        transform="translateX(-50%)"
                      >
                        {dotColors.map((c, idx) => (
                          <Box
                            key={`${cell.key}-dot-${idx}`}
                            w={1.5}
                            h={1.5}
                            borderRadius="full"
                            bg={c}
                          />
                        ))}
                      </HStack>
                    )}
                  </Box>
                );

                if (!hasItems) {
                  return renderDayBox(cell.key);
                }

                const grupos = [
                  {
                    label: "Entregas",
                    color: "red.600",
                    items: cell.items.filter((i) => i.type === "venta"),
                  },
                  {
                    label: "Tareas",
                    color: "orange.600",
                    items: cell.items.filter((i) => i.type === "tarea"),
                  },
                  {
                    label: "Eventos",
                    color: "teal.600",
                    items: cell.items.filter((i) => i.type === "evento"),
                  },
                ].filter((g) => g.items.length > 0);

                const tooltipContent = (
                  <Box color="gray.900" maxW="240px">
                    <Text fontWeight="bold" fontSize="sm" mb={2}>
                      {cell.items.length} item{cell.items.length > 1 ? "s" : ""}
                    </Text>
                    <Stack spacing={2}>
                      {grupos.map((g) => (
                        <Box key={g.label}>
                          <Text fontWeight="bold" fontSize="xs" color={g.color}>
                            {g.label} ({g.items.length})
                          </Text>
                          {g.items.slice(0, 3).map((it) => (
                            <Text key={it.id} fontSize="xs" color="gray.700" noOfLines={1}>
                              · {it.title}
                            </Text>
                          ))}
                          {g.items.length > 3 && (
                            <Text fontSize="xs" color="gray.500" fontStyle="italic">
                              + {g.items.length - 3} más…
                            </Text>
                          )}
                        </Box>
                      ))}
                    </Stack>
                  </Box>
                );

                return (
                  <Tooltip
                    key={cell.key}
                    label={tooltipContent}
                    hasArrow
                    placement="top"
                    openDelay={150}
                    closeOnClick
                  >
                    {renderDayBox(undefined)}
                  </Tooltip>
                );
              })}
            </SimpleGrid>
            <Text fontSize="xs" color={mutedText} mt={3} fontStyle="italic">
              Hoy: {todayLabel}
            </Text>
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
            <Heading size="md" fontFamily="'Space Grotesk', 'DM Sans', sans-serif">
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
                      <Text fontWeight="bold" color={primaryText}>
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
            <Heading size="md" mb={4} fontFamily="'Space Grotesk', 'DM Sans', sans-serif">
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
          <Heading size="md" mb={6} fontFamily="'Space Grotesk', 'DM Sans', sans-serif">
            Capacidad e insumos
          </Heading>
          <SimpleGrid columns={{ base: 1, md: 3 }} gap={4}>
            <InsightCard
              title="Productos activos"
              value={numberFormatter.format(inventoryMetrics.productsCount)}
              caption={`${numberFormatter.format(inventoryMetrics.stockUnits)} unidades en stock`}
              icon={FaCubes}
              cardBg={cardBg}
              borderColor={borderColor}
            />
            <InsightCard
              title="Plantillas de costo"
              value={numberFormatter.format(inventoryMetrics.plantillasCount)}
              caption={`${inventoryMetrics.planillaCoverage}% de cobertura del catálogo`}
              icon={FaClipboardList}
              cardBg={cardBg}
              borderColor={borderColor}
            />
            <InsightCard
              title="Materias primas"
              value={numberFormatter.format(inventoryMetrics.rawMaterialsCount)}
              caption="Disponibles para producción"
              icon={FaWarehouse}
              cardBg={cardBg}
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
        onChanged={refetchEventos}
      />
    </Box>
  );
};
