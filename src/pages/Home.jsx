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
  Input,
  SimpleGrid,
  Stack,
  Stat,
  StatHelpText,
  StatLabel,
  StatNumber,
  Text,
  VStack,
  useColorModeValue,
} from "@chakra-ui/react";
import { useMemo, useState } from "react";
import {
  FaBalanceScale,
  FaCashRegister,
  FaChartLine,
  FaClipboardList,
  FaCrown,
  FaCubes,
  FaHourglassHalf,
  FaShoppingBag,
  FaWarehouse,
} from "react-icons/fa";
import { Loader } from "../components";
import {
  useGetAllPlantillas,
  useGetAllVentas,
  useItems,
  useItemsMateriasPrimas,
} from "../hooks";

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

export const Home = () => {
  const {
    ventasData,
    loading: ventasLoading,
    error: ventasError,
  } = useGetAllVentas();
  const { productsData = [], loading: productsLoading } = useItems();
  const {
    plantillasData = [],
    loading: plantillasLoading,
    error: plantillasError,
  } = useGetAllPlantillas();
  const { rawsMaterialData = [], loading: materiasLoading } = useItemsMateriasPrimas();

  const isLoading = ventasLoading || productsLoading || plantillasLoading || materiasLoading;
  const errorMessage = ventasError || plantillasError;

  const [dateFilterMode, setDateFilterMode] = useState("last30");
  const [customRange, setCustomRange] = useState({ start: "", end: "" });

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
  const accentPink = useColorModeValue("rose.500", "pink.300");
  const accentPinkBg = useColorModeValue("pink.50", "whiteAlpha.200");
  const accentIndigo = useColorModeValue("indigo.600", "indigo.300");
  const accentIndigoBg = useColorModeValue("indigo.50", "whiteAlpha.200");
  const accentLime = useColorModeValue("lime.600", "lime.300");
  const accentLimeBg = useColorModeValue("lime.50", "whiteAlpha.200");
  const primaryText = useColorModeValue("gray.800", "gray.100");
  const channelRankBg = useColorModeValue("gray.100", "gray.700");
  const mutedText = useColorModeValue("gray.600", "gray.400");
  const innerCardBg = useColorModeValue("white", "gray.900");

  const ventas = useMemo(() => (Array.isArray(ventasData) ? ventasData : []), [ventasData]);

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
        averageTicket: 0,
        conversionRate: 0,
        pendingCount: 0,
        pendingAmount: 0,
        estimatedMargin: 0,
        finalizadas: 0,
        totalVentas: 0,
        topProduct: { label: "Sin datos", count: 0, revenue: 0 },
        topProducts: [],
        lastUpdate: null,
      };
    }

    let totalRevenue = 0;
    let totalCost = 0;
    let pendingCount = 0;
    let pendingAmount = 0;
    let finalizadas = 0;
    const productMap = new Map();
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
        venta?.producto?.planillaCosto?.costoTotal ??
          venta?.plantilla?.costoTotal ??
          0
      );
      const quantity = Number(venta?.cantidad ?? 1) || 1;
      if (Number.isFinite(unitCost) && unitCost > 0) {
        totalCost += unitCost * quantity;
      }

      const label = getProductLabel(venta);
      const key = venta?.producto?._id ?? label ?? venta?._id;
      if (label) {
        const current = productMap.get(key) || { label, count: 0, revenue: 0 };
        current.count += quantity;
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

    const sortedProducts = Array.from(productMap.values()).sort(
      (a, b) => b.revenue - a.revenue
    );
    const topProducts = sortedProducts.slice(0, 3);
    const topProduct = topProducts[0] ?? { label: "Sin datos", count: 0, revenue: 0 };

    const totalVentas = filteredVentas.length;
    const averageTicket = totalVentas ? totalRevenue / totalVentas : 0;
    const conversionRate = totalVentas ? finalizadas / totalVentas : 0;
    const estimatedMargin = totalRevenue - totalCost;

    return {
      totalRevenue,
      averageTicket,
      conversionRate,
      pendingCount,
      pendingAmount,
      estimatedMargin,
      finalizadas,
      totalVentas,
      topProduct,
      topProducts,
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
    const rawMaterialsCount = Array.isArray(rawsMaterialData) ? rawsMaterialData.length : 0;
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
  }, [productsData, plantillasData, rawsMaterialData]);

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
      value: currencyFormatter.format(salesMetrics.averageTicket || 0),
      helpText: salesMetrics.totalVentas
        ? `${salesMetrics.totalVentas} operaciones en el período`
        : "Esperando primeras ventas",
      icon: FaShoppingBag,
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
      helpText: salesMetrics.topProduct.count
        ? `${numberFormatter.format(salesMetrics.topProduct.count)} unidades | ${currencyFormatter.format(
            salesMetrics.topProduct.revenue
          )}`
        : "Seguimos recolectando datos",
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
      label: "Ventas con saldo restante",
      value: numberFormatter.format(salesMetrics.pendingCount),
      helpText: `${currencyFormatter.format(salesMetrics.pendingAmount)} en saldo`,
      icon: FaHourglassHalf,
      accentColor: accentPink,
      accentBg: accentPinkBg,
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
        <Stack spacing={3}>
          <Badge
            alignSelf="flex-start"
            colorScheme="teal"
            px={3}
            py={1}
            borderRadius="full"
            fontSize="0.7rem"
          >
            Tablero operativo
          </Badge>
          <Heading
            fontSize={{ base: "2xl", md: "4xl" }}
            fontFamily="'Space Grotesk', 'DM Sans', sans-serif"
          >
            Dashboard Costify
          </Heading>
          <Text fontSize="lg" color={mutedText} maxW="720px">
            Controlá el pulso de ventas, márgenes y capacidad productiva desde una
            sola pantalla. Los indicadores se recalculan automáticamente con cada
            registro nuevo.
          </Text>
          <Text fontSize="sm" color={mutedText}>
            Última sincronización: <strong>{lastUpdateText}</strong>
          </Text>
          <Text fontSize="sm" color={mutedText}>
            Período analizado: <strong>{rangeDescription}</strong>
          </Text>
        </Stack>

        <Box
          p={5}
          borderRadius="xl"
          bg={cardBg}
          borderWidth="1px"
          borderColor={borderColor}
          boxShadow="md"
        >
          <Stack spacing={4}>
            <Flex direction={{ base: "column", md: "row" }} justify="space-between" gap={3}>
              <Box>
                <Heading size="sm" fontFamily="'Space Grotesk', 'DM Sans', sans-serif">
                  Ajustar período
                </Heading>
                <Text fontSize="sm" color={mutedText}>
                  Filtra los indicadores por último mes o definí manualmente el rango.
                </Text>
              </Box>
              <ButtonGroup size="sm" variant="ghost" colorScheme="teal">
                <Button
                  variant={dateFilterMode === "last30" ? "solid" : "ghost"}
                  onClick={() => setDateFilterMode("last30")}
                >
                  Últimos 30 días
                </Button>
                <Button
                  variant={dateFilterMode === "custom" ? "solid" : "ghost"}
                  onClick={() => setDateFilterMode("custom")}
                >
                  Rango personalizado
                </Button>
              </ButtonGroup>
            </Flex>
            {dateFilterMode === "custom" && (
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
            )}
          </Stack>
        </Box>

        <SimpleGrid columns={{ base: 1, md: 2, xl: 3 }} gap={6}>
          {statCards.map((card) => (
            <StatCard
              key={card.label}
              {...card}
              cardBg={cardBg}
              borderColor={borderColor}
            />
          ))}
        </SimpleGrid>

        <Flex direction={{ base: "column", lg: "row" }} gap={6}>
          <Box flex="2" p={6} borderRadius="2xl" bg={cardBg} borderWidth="1px" borderColor={borderColor}>
            <Heading size="md" mb={4} fontFamily="'Space Grotesk', 'DM Sans', sans-serif">
              Estado de ventas
            </Heading>
            <SimpleGrid columns={{ base: 1, md: 3 }} gap={4}>
              <InsightCard
                title="Ticket promedio"
                value={currencyFormatter.format(salesMetrics.averageTicket || 0)}
                caption="Ingresos por operación"
                icon={FaShoppingBag}
                cardBg={innerCardBg}
                borderColor={borderColor}
              />
              <InsightCard
                title="Saldo pendiente"
                value={currencyFormatter.format(salesMetrics.pendingAmount)}
                caption={`${salesMetrics.pendingCount} ventas con cobro parcial`}
                icon={FaHourglassHalf}
                cardBg={innerCardBg}
                borderColor={borderColor}
              />
              <InsightCard
                title="Margen estimado"
                value={currencyFormatter.format(salesMetrics.estimatedMargin)}
                caption="Base en planillas de costo"
                icon={FaBalanceScale}
                cardBg={innerCardBg}
                borderColor={borderColor}
              />
            </SimpleGrid>
            <Divider my={6} opacity={0.5} />
            <Text fontSize="sm" color={mutedText}>
              Conversión sobre el total: {(salesMetrics.conversionRate * 100 || 0).toFixed(1)}% ·
              Operaciones finalizadas: {salesMetrics.finalizadas} · Pipeline activa: {salesMetrics.totalVentas - salesMetrics.finalizadas}
            </Text>
          </Box>

          <Box flex="1" p={6} borderRadius="2xl" bg={cardBg} borderWidth="1px" borderColor={borderColor}>
            <Heading size="md" mb={4} fontFamily="'Space Grotesk', 'DM Sans', sans-serif">
              Top 3 productos
            </Heading>
            {salesMetrics.topProducts?.length ? (
              <Stack spacing={4}>
                {salesMetrics.topProducts.map((product, index) => {
                  const share = salesMetrics.totalRevenue
                    ? (product.revenue / salesMetrics.totalRevenue) * 100
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
                          {numberFormatter.format(product.count)} unidades · {currencyFormatter.format(product.revenue)}
                        </Text>
                      </Box>
                      <Badge colorScheme="teal" borderRadius="full" px={3} py={1}>
                        {share.toFixed(1)}% ingresos
                      </Badge>
                    </Flex>
                  );
                })}
              </Stack>
            ) : (
              <Text color={mutedText}>Aún no hay suficiente información para este período.</Text>
            )}
          </Box>
        </Flex>

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
    </Box>
  );
};
