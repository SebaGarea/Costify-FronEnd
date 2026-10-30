import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Badge,
  Box,
  Button,
  Flex,
  Heading,
  HStack,
  IconButton,
  Input,
  InputGroup,
  InputLeftElement,
  Link,
  Progress,
  Select,
  SimpleGrid,
  Skeleton,
  Stack,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
  Text,
  Tooltip,
  useColorModeValue,
  useDisclosure,
  useToast,
} from "@chakra-ui/react";
import { AddIcon, DeleteIcon, DownloadIcon, EditIcon } from "@chakra-ui/icons";
import { FiRefreshCw, FiSearch, FiSliders } from "react-icons/fi";
import { Link as RouterLink } from "react-router-dom";
import {
  deleteMovimientoCaja,
  getCategoriasCaja,
  getMercadoPagoEstado,
  syncMercadoPago,
  getMovimientosCaja,
  getResumenCaja,
} from "../../services/caja.service.js";
import { useCuentasCaja } from "../../hooks/caja/useCuentasCaja.js";
import { useDataChanged } from "../../hooks/useDataChanged.js";
import {
  TIPOS_MOVIMIENTO,
  formatFecha,
  formatMoney,
  getApiError,
  mesActual,
  nombreMes,
  rangoDeMes,
} from "../../constants/caja.js";
import { MovimientoModal } from "./MovimientoModal.jsx";
import { AjusteSaldoModal } from "./AjusteSaldoModal.jsx";
import { CuentasCategoriasPanel } from "./CuentasCategoriasPanel.jsx";

const POR_PAGINA = 20;

const KpiCard = ({ label, value, color, hint }) => {
  const bg = useColorModeValue("white", "gray.800");
  const border = useColorModeValue("gray.200", "gray.700");
  const muted = useColorModeValue("gray.600", "gray.400");
  return (
    <Box p={4} borderRadius="xl" bg={bg} borderWidth="1px" borderColor={border}>
      <Text fontSize="sm" color={muted}>{label}</Text>
      <Text fontSize={{ base: "xl", md: "2xl" }} fontWeight="bold" color={color} className="tnum" whiteSpace="nowrap">
        {formatMoney(value)}
      </Text>
      {hint && <Text fontSize="xs" color={muted}>{hint}</Text>}
    </Box>
  );
};

export const CajaView = () => {
  const toast = useToast();
  const pageBg = useColorModeValue("gray.50", "gray.900");
  const cardBg = useColorModeValue("white", "gray.800");
  const border = useColorModeValue("gray.200", "gray.700");
  const muted = useColorModeValue("gray.600", "gray.400");
  const rowHover = useColorModeValue("gray.50", "gray.700");

  const {
    cuentas,
    cuentasActivas,
    totales,
    cuentaCobroDefault,
    loading: loadingCuentas,
    refetch: refetchCuentas,
  } = useCuentasCaja({ incluirArchivadas: true });

  const [mes, setMes] = useState(mesActual());
  const periodo = useMemo(() => rangoDeMes(mes), [mes]);

  const [categorias, setCategorias] = useState([]);
  const [resumen, setResumen] = useState(null);
  const [movimientos, setMovimientos] = useState({ items: [], total: 0, totalPages: 1 });
  const [loadingMovs, setLoadingMovs] = useState(true);
  const [page, setPage] = useState(1);
  const [filtros, setFiltros] = useState({ cuenta: "", categoria: "", tipo: "", q: "" });
  const [busqueda, setBusqueda] = useState("");

  const movimientoModal = useDisclosure();
  const [movimientoEditando, setMovimientoEditando] = useState(null);
  const [tipoNuevo, setTipoNuevo] = useState("egreso");
  const [cuentaAjuste, setCuentaAjuste] = useState(null);

  // Integración con Mercado Pago (la importación corre sola cada minuto).
  const [mpEstado, setMpEstado] = useState(null);
  const [sincronizando, setSincronizando] = useState(false);

  const fetchMpEstado = useCallback(async () => {
    try {
      const res = await getMercadoPagoEstado();
      setMpEstado(res.data);
    } catch {
      setMpEstado(null);
    }
  }, []);

  const fetchCategorias = useCallback(async () => {
    try {
      const res = await getCategoriasCaja({ archivadas: "true" });
      setCategorias(res.data ?? []);
    } catch (error) {
      console.error("No se pudieron cargar las categorías", error);
    }
  }, []);

  const fetchResumen = useCallback(async () => {
    try {
      const res = await getResumenCaja(periodo);
      setResumen(res.data);
    } catch (error) {
      toast({ status: "error", title: "No se pudo cargar el resumen", description: getApiError(error) });
    }
  }, [periodo, toast]);

  const fetchMovimientos = useCallback(async () => {
    setLoadingMovs(true);
    try {
      const params = { ...periodo, page, limit: POR_PAGINA };
      Object.entries(filtros).forEach(([k, v]) => {
        if (v) params[k] = v;
      });
      const res = await getMovimientosCaja(params);
      setMovimientos(res.data ?? { items: [], total: 0, totalPages: 1 });
    } catch (error) {
      toast({ status: "error", title: "No se pudieron cargar los movimientos", description: getApiError(error) });
    } finally {
      setLoadingMovs(false);
    }
  }, [periodo, page, filtros, toast]);

  useEffect(() => { fetchCategorias(); }, [fetchCategorias]);
  useEffect(() => { fetchMpEstado(); }, [fetchMpEstado]);
  useEffect(() => { fetchResumen(); }, [fetchResumen]);
  useEffect(() => { fetchMovimientos(); }, [fetchMovimientos]);
  useEffect(() => { setPage(1); }, [periodo, filtros]);

  // Búsqueda con un pequeño debounce.
  useEffect(() => {
    const t = setTimeout(() => setFiltros((prev) => (prev.q === busqueda ? prev : { ...prev, q: busqueda })), 350);
    return () => clearTimeout(t);
  }, [busqueda]);

  const refrescarTodo = useCallback(() => {
    refetchCuentas();
    fetchResumen();
    fetchMovimientos();
    fetchCategorias();
    fetchMpEstado();
  }, [refetchCuentas, fetchResumen, fetchMovimientos, fetchCategorias, fetchMpEstado]);

  const handleSyncMp = async () => {
    setSincronizando(true);
    try {
      const res = await syncMercadoPago();
      const r = res.data || {};
      const cambios = (r.nuevos || 0) + (r.vinculados || 0) + (r.devoluciones || 0);
      toast({
        status: "success",
        title: cambios ? "Mercado Pago sincronizado" : "Mercado Pago ya estaba al día",
        description: cambios
          ? [
              r.nuevos ? `${r.nuevos} movimientos nuevos` : null,
              r.vinculados ? `${r.vinculados} cobros unidos a ventas` : null,
              r.devoluciones ? `${r.devoluciones} devoluciones` : null,
            ].filter(Boolean).join(" · ")
          : undefined,
        duration: 3000,
      });
      refrescarTodo();
    } catch (error) {
      toast({ status: "error", title: "No se pudo sincronizar con Mercado Pago", description: getApiError(error) });
      fetchMpEstado();
    } finally {
      setSincronizando(false);
    }
  };

  useDataChanged(() => refrescarTodo(), ["caja", "venta"]);

  // Mercado Pago se importa solo cada minuto: si entraron movimientos nuevos
  // mientras la página está abierta (y visible), se refresca.
  const importadosRef = useRef(null);
  useEffect(() => {
    importadosRef.current = mpEstado?.importados ?? null;
  }, [mpEstado?.importados]);
  useEffect(() => {
    if (!mpEstado?.habilitado) return undefined;
    const id = setInterval(async () => {
      if (document.visibilityState !== "visible") return;
      try {
        const res = await getMercadoPagoEstado();
        const importados = res.data?.importados ?? null;
        if (importados !== importadosRef.current) refrescarTodo();
        else setMpEstado(res.data);
      } catch {
        /* sin conexión: se reintenta en el próximo ciclo */
      }
    }, 60 * 1000);
    return () => clearInterval(id);
  }, [mpEstado?.habilitado, refrescarTodo]);

  const abrirNuevo = (tipo) => {
    setMovimientoEditando(null);
    setTipoNuevo(tipo);
    movimientoModal.onOpen();
  };

  const abrirEdicion = (mov) => {
    setMovimientoEditando(mov);
    setTipoNuevo(mov.tipo);
    movimientoModal.onOpen();
  };

  const handleDelete = async (mov) => {
    const mensaje = mov.origen?.mpPaymentId
      ? "¿Eliminar este movimiento de Mercado Pago? No se va a volver a importar y los saldos se recalculan."
      : "¿Eliminar este movimiento? Los saldos se recalculan.";
    if (!window.confirm(mensaje)) return;
    try {
      await deleteMovimientoCaja(mov._id);
      toast({ status: "success", title: "Movimiento eliminado", duration: 1500 });
      refrescarTodo();
    } catch (error) {
      toast({ status: "error", title: "No se pudo eliminar", description: getApiError(error) });
    }
  };

  const handleExport = async () => {
    try {
      const XLSX = await import("xlsx-js-style");
      const todos = [];
      let p = 1;
      let totalPages = 1;
      do {
        const res = await getMovimientosCaja({ ...periodo, page: p, limit: 500 });
        todos.push(...(res.data?.items ?? []));
        totalPages = res.data?.totalPages ?? 1;
        p += 1;
      } while (p <= totalPages);

      if (!todos.length) {
        toast({ status: "info", title: "No hay movimientos en el período" });
        return;
      }

      const header = ["Fecha", "Tipo", "Cuenta", "Destino", "Categoría", "Descripción", "Monto"];
      const rows = [header];
      todos
        .slice()
        .reverse()
        .forEach((m) => {
          const signo = m.tipo === "egreso" || (m.tipo === "ajuste" && m.direccion === "-") ? -1 : 1;
          rows.push([
            formatFecha(m.fecha),
            TIPOS_MOVIMIENTO[m.tipo]?.label ?? m.tipo,
            m.cuenta?.nombre ?? "",
            m.cuentaDestino?.nombre ?? "",
            m.categoria?.nombre ?? "",
            m.descripcion ?? "",
            m.tipo === "transferencia" ? m.monto : signo * m.monto,
          ]);
        });
      rows.push([]);
      rows.push(["", "Ingresos", "", "", "", "", resumen?.ingresos ?? 0]);
      rows.push(["", "Egresos", "", "", "", "", -(resumen?.egresos ?? 0)]);
      rows.push(["", "Resultado", "", "", "", "", resumen?.resultado ?? 0]);

      const ws = XLSX.utils.aoa_to_sheet(rows);
      ws["!cols"] = [{ wch: 12 }, { wch: 14 }, { wch: 16 }, { wch: 16 }, { wch: 20 }, { wch: 44 }, { wch: 16 }];
      const headerStyle = {
        font: { bold: true, color: { rgb: "FFFFFF" } },
        fill: { fgColor: { rgb: "1A202C" } },
        alignment: { horizontal: "center" },
      };
      header.forEach((_, c) => {
        const cell = ws[XLSX.utils.encode_cell({ r: 0, c })];
        if (cell) cell.s = headerStyle;
      });
      for (let r = 1; r < rows.length; r += 1) {
        const cell = ws[XLSX.utils.encode_cell({ r, c: 6 })];
        if (cell && typeof cell.v === "number") cell.z = '"$"#,##0;[Red]-"$"#,##0';
      }
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Caja");
      XLSX.writeFile(wb, `caja-${mes}.xlsx`);
    } catch (error) {
      console.error("Error al exportar la caja", error);
      toast({ status: "error", title: "No se pudo exportar", description: getApiError(error) });
    }
  };

  const categoriasEgreso = resumen?.egresosPorCategoria ?? [];
  const maxCategoria = Math.max(1, ...categoriasEgreso.map((c) => c.total));
  const flujo = resumen?.flujoMensual ?? [];
  const maxFlujo = Math.max(1, ...flujo.flatMap((f) => [f.ingresos, f.egresos]));
  const hayFiltros = Object.values(filtros).some(Boolean);

  return (
    <Box bg={pageBg} minH="100vh" px={{ base: 4, md: 10 }} py={{ base: 6, md: 10 }}>
      <Stack spacing={6} maxW="1200px" mx="auto">
        <Flex justify="space-between" align={{ base: "flex-start", md: "center" }} gap={4} direction={{ base: "column", md: "row" }}>
          <Box>
            <Heading fontSize={{ base: "2xl", md: "4xl" }} mb={1} fontFamily="heading">
              Caja
            </Heading>
            <Text fontSize="lg" color={muted}>
              Lo que entra, lo que sale y cuánto hay en cada lugar.
            </Text>
          </Box>
          <HStack spacing={2} flexWrap="wrap">
            <Button leftIcon={<AddIcon />} colorScheme="red" variant="outline" onClick={() => abrirNuevo("egreso")}>
              Gasto
            </Button>
            <Button leftIcon={<AddIcon />} colorScheme="green" variant="outline" onClick={() => abrirNuevo("ingreso")}>
              Ingreso
            </Button>
            <Button variant="outline" onClick={() => abrirNuevo("transferencia")}>
              Transferir
            </Button>
          </HStack>
        </Flex>

        {/* Saldos por cuenta */}
        <SimpleGrid columns={{ base: 1, sm: 2, xl: Math.min(4, cuentasActivas.length + 1) }} spacing={4}>
          {loadingCuentas
            ? [0, 1, 2, 3].map((i) => <Skeleton key={i} h="96px" borderRadius="xl" />)
            : (
              <>
                {cuentasActivas.map((cuenta) => (
                  <Box
                    key={cuenta._id}
                    p={4}
                    borderRadius="xl"
                    bg={cardBg}
                    borderWidth="1px"
                    borderColor={border}
                    borderTopWidth="4px"
                    borderTopColor={`${cuenta.color || "teal"}.400`}
                  >
                    <Flex justify="space-between" align="flex-start" gap={2}>
                      <Box minW={0}>
                        <Text fontSize="sm" color={muted} noOfLines={1}>
                          {cuenta.nombre}
                        </Text>
                        <Text fontSize={{ base: "xl", md: "2xl" }} fontWeight="bold" className="tnum" whiteSpace="nowrap">
                          {formatMoney(cuenta.saldo)}
                        </Text>
                      </Box>
                      <Tooltip label="Ajustar al saldo real" hasArrow>
                        <IconButton
                          aria-label={`Ajustar saldo de ${cuenta.nombre}`}
                          icon={<FiSliders />}
                          size="sm"
                          variant="ghost"
                          onClick={() => setCuentaAjuste(cuenta)}
                        />
                      </Tooltip>
                    </Flex>
                    {cuenta.aLiberar > 0 && (
                      <Tooltip label="Cobrado en Mercado Pago pero todavía no disponible (neto de comisiones). Ya está sumado al saldo." hasArrow>
                        <Text fontSize="xs" color={muted} className="tnum">
                          A liberar: <b>{formatMoney(cuenta.aLiberar)}</b>
                        </Text>
                      </Tooltip>
                    )}
                    <HStack spacing={1} mt={1} flexWrap="wrap">
                      <Badge variant="subtle" colorScheme={cuenta.esDigital ? "blue" : "green"} textTransform="none">
                        {cuenta.esDigital ? "Digital" : "Efectivo"}
                      </Badge>
                      {String(cuenta._id) === String(cuentaCobroDefault) && (
                        <Badge variant="subtle" colorScheme="purple" textTransform="none">
                          Cobros
                        </Badge>
                      )}
                    </HStack>
                    {cuenta.integracion === "mercadopago" && mpEstado?.habilitado && (
                      <Flex align="center" justify="space-between" mt={2} gap={2}>
                        <Tooltip
                          hasArrow
                          label={
                            mpEstado.ultimoError
                              ? `Último error: ${mpEstado.ultimoError}`
                              : "Se sincroniza sola cada minuto"
                          }
                        >
                          <Text fontSize="xs" color={mpEstado.ultimoError ? "red.400" : muted} noOfLines={1}>
                            {mpEstado.ultimoError
                              ? "Error al sincronizar"
                              : mpEstado.ultimaSync
                                ? `Sincronizado ${new Date(mpEstado.ultimaSync).toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" })}`
                                : "Conectada a Mercado Pago"}
                          </Text>
                        </Tooltip>
                        <Tooltip label="Sincronizar ahora" hasArrow>
                          <IconButton
                            aria-label="Sincronizar con Mercado Pago"
                            icon={<FiRefreshCw />}
                            size="xs"
                            variant="ghost"
                            isLoading={sincronizando}
                            onClick={handleSyncMp}
                          />
                        </Tooltip>
                      </Flex>
                    )}
                  </Box>
                ))}
                <Box p={4} borderRadius="xl" bg="teal.500" color="white">
                  <Text fontSize="sm" opacity={0.9}>Total disponible</Text>
                  <Text fontSize={{ base: "xl", md: "2xl" }} fontWeight="bold" className="tnum" whiteSpace="nowrap">
                    {formatMoney(totales.total)}
                  </Text>
                  <Text fontSize="xs" opacity={0.9} className="tnum">
                    Efectivo {formatMoney(totales.efectivo)} · Digital {formatMoney(totales.digital)}
                  </Text>
                </Box>
              </>
            )}
        </SimpleGrid>

        <Tabs variant="soft-rounded" colorScheme="teal" isLazy>
          <TabList flexWrap="wrap" gap={2}>
            <Tab>Movimientos</Tab>
            <Tab>Cuentas y categorías</Tab>
          </TabList>
          <TabPanels>
            <TabPanel px={0}>
              <Stack spacing={6}>
                {/* Período */}
                <Flex align="center" gap={3} flexWrap="wrap">
                  <Text fontWeight="semibold">Período:</Text>
                  <Input
                    type="month"
                    value={mes}
                    onChange={(e) => e.target.value && setMes(e.target.value)}
                    maxW="200px"
                    size="sm"
                    bg={cardBg}
                  />
                  <Text color={muted} fontSize="sm">{nombreMes(mes)}</Text>
                  <Button size="sm" variant="ghost" leftIcon={<DownloadIcon />} ml="auto" onClick={handleExport}>
                    Exportar
                  </Button>
                </Flex>

                <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
                  <KpiCard label="Ingresos" value={resumen?.ingresos} color="green.500" />
                  <KpiCard label="Egresos" value={resumen?.egresos} color="red.400" />
                  <KpiCard
                    label="Resultado"
                    value={resumen?.resultado}
                    color={(resumen?.resultado ?? 0) >= 0 ? "green.500" : "red.400"}
                    hint="Ingresos − egresos (sin transferencias ni ajustes)"
                  />
                </SimpleGrid>

                <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={4}>
                  {/* Gastos por categoría */}
                  <Box p={5} borderRadius="xl" bg={cardBg} borderWidth="1px" borderColor={border}>
                    <Heading size="sm" mb={4} fontFamily="heading">Gastos por categoría</Heading>
                    {categoriasEgreso.length === 0 ? (
                      <Text fontSize="sm" color={muted}>No hay gastos en este período.</Text>
                    ) : (
                      <Stack spacing={3}>
                        {categoriasEgreso.map((c) => (
                          <Box
                            key={c.categoriaId || c.nombre}
                            cursor={c.categoriaId ? "pointer" : "default"}
                            onClick={() => c.categoriaId && setFiltros((f) => ({ ...f, categoria: c.categoriaId, tipo: "" }))}
                          >
                            <Flex justify="space-between" fontSize="sm" mb={1}>
                              <Text>{c.nombre}</Text>
                              <Text fontWeight="semibold" className="tnum">
                                {formatMoney(c.total)}
                                <Text as="span" color={muted} fontWeight="normal" ml={2}>
                                  {Math.round((c.total / (resumen?.egresos || 1)) * 100)}%
                                </Text>
                              </Text>
                            </Flex>
                            <Progress value={(c.total / maxCategoria) * 100} size="sm" colorScheme={c.color || "gray"} borderRadius="full" />
                          </Box>
                        ))}
                      </Stack>
                    )}
                  </Box>

                  {/* Flujo de los últimos 6 meses */}
                  <Box p={5} borderRadius="xl" bg={cardBg} borderWidth="1px" borderColor={border}>
                    <Flex justify="space-between" align="center" mb={4}>
                      <Heading size="sm" fontFamily="heading">Últimos 6 meses</Heading>
                      <HStack spacing={3} fontSize="xs" color={muted}>
                        <HStack spacing={1}><Box w={2} h={2} borderRadius="full" bg="green.400" /><Text>Ingresos</Text></HStack>
                        <HStack spacing={1}><Box w={2} h={2} borderRadius="full" bg="red.400" /><Text>Egresos</Text></HStack>
                      </HStack>
                    </Flex>
                    <Flex align="flex-end" justify="space-between" h="150px" gap={2}>
                      {flujo.map((f) => (
                        <Tooltip
                          key={f.mes}
                          hasArrow
                          label={`${nombreMes(f.mes)} · Ingresos ${formatMoney(f.ingresos)} · Egresos ${formatMoney(f.egresos)}`}
                        >
                          <Flex direction="column" align="center" flex="1" h="100%" justify="flex-end" cursor="pointer" onClick={() => setMes(f.mes)}>
                            <Flex align="flex-end" gap="3px" h="100%" w="100%" justify="center">
                              <Box w="40%" maxW="18px" bg="green.400" borderRadius="sm" h={`${(f.ingresos / maxFlujo) * 100}%`} minH={f.ingresos ? "2px" : 0} />
                              <Box w="40%" maxW="18px" bg="red.400" borderRadius="sm" h={`${(f.egresos / maxFlujo) * 100}%`} minH={f.egresos ? "2px" : 0} />
                            </Flex>
                            <Text fontSize="xs" color={f.mes === mes ? "teal.500" : muted} fontWeight={f.mes === mes ? "bold" : "normal"} mt={1}>
                              {nombreMes(f.mes, { corto: true })}
                            </Text>
                          </Flex>
                        </Tooltip>
                      ))}
                    </Flex>
                  </Box>
                </SimpleGrid>

                {/* Movimientos */}
                <Box p={{ base: 3, md: 5 }} borderRadius="xl" bg={cardBg} borderWidth="1px" borderColor={border}>
                  <Flex gap={2} mb={4} flexWrap="wrap" align="center">
                    <Heading size="sm" fontFamily="heading" mr="auto">
                      Movimientos {movimientos.total > 0 && <Badge ml={1} borderRadius="full">{movimientos.total}</Badge>}
                    </Heading>
                    <InputGroup size="sm" maxW={{ base: "100%", md: "220px" }}>
                      <InputLeftElement pointerEvents="none"><FiSearch /></InputLeftElement>
                      <Input placeholder="Buscar descripción" value={busqueda} onChange={(e) => setBusqueda(e.target.value)} />
                    </InputGroup>
                    <Select size="sm" maxW={{ base: "48%", md: "150px" }} value={filtros.tipo} onChange={(e) => setFiltros((f) => ({ ...f, tipo: e.target.value }))}>
                      <option value="">Todos los tipos</option>
                      {Object.entries(TIPOS_MOVIMIENTO).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                    </Select>
                    <Select size="sm" maxW={{ base: "48%", md: "160px" }} value={filtros.cuenta} onChange={(e) => setFiltros((f) => ({ ...f, cuenta: e.target.value }))}>
                      <option value="">Todas las cuentas</option>
                      {cuentas.map((c) => <option key={c._id} value={c._id}>{c.nombre}</option>)}
                    </Select>
                    <Select size="sm" maxW={{ base: "100%", md: "180px" }} value={filtros.categoria} onChange={(e) => setFiltros((f) => ({ ...f, categoria: e.target.value }))}>
                      <option value="">Todas las categorías</option>
                      {categorias.map((c) => <option key={c._id} value={c._id}>{c.nombre}</option>)}
                    </Select>
                    {hayFiltros && (
                      <Button size="sm" variant="ghost" onClick={() => { setFiltros({ cuenta: "", categoria: "", tipo: "", q: "" }); setBusqueda(""); }}>
                        Limpiar
                      </Button>
                    )}
                  </Flex>

                  {loadingMovs && movimientos.items.length === 0 ? (
                    <Stack>{[0, 1, 2].map((i) => <Skeleton key={i} h="52px" borderRadius="md" />)}</Stack>
                  ) : movimientos.items.length === 0 ? (
                    <Text fontSize="sm" color={muted} py={6} textAlign="center">
                      {hayFiltros ? "No hay movimientos con esos filtros." : "Todavía no hay movimientos en este período."}
                    </Text>
                  ) : (
                    <Stack spacing={0} opacity={loadingMovs ? 0.6 : 1}>
                      {movimientos.items.map((m) => {
                        const tipo = TIPOS_MOVIMIENTO[m.tipo] ?? TIPOS_MOVIMIENTO.ajuste;
                        const negativo = m.tipo === "egreso" || (m.tipo === "ajuste" && m.direccion === "-");
                        const colorMonto = m.tipo === "transferencia" || m.tipo === "ajuste" ? undefined : negativo ? "red.400" : "green.500";
                        const deVenta = m.origen?.tipo === "venta" && m.origen?.venta;
                        const deMp = Boolean(m.origen?.mpPaymentId);
                        const porLiberar = m.liberacion && new Date(m.liberacion) > new Date();
                        return (
                          <Flex
                            key={m._id}
                            py={3}
                            px={2}
                            gap={3}
                            align="center"
                            borderBottomWidth="1px"
                            borderColor={border}
                            _hover={{ bg: rowHover }}
                            _last={{ borderBottomWidth: 0 }}
                          >
                            <Box minW="72px" fontSize="sm" color={muted} className="tnum">{formatFecha(m.fecha)}</Box>
                            <Box flex="1" minW={0}>
                              <Text fontSize="sm" fontWeight="medium" noOfLines={1}>
                                {m.descripcion || m.categoria?.nombre || tipo.label}
                              </Text>
                              <HStack spacing={1} mt={0.5} flexWrap="wrap">
                                <Badge colorScheme={tipo.color} variant="subtle" textTransform="none">{tipo.label}</Badge>
                                {m.categoria && (
                                  <Badge colorScheme={m.categoria.color || "gray"} variant="outline" textTransform="none">{m.categoria.nombre}</Badge>
                                )}
                                <Text fontSize="xs" color={muted}>
                                  {m.cuenta?.nombre}
                                  {m.tipo === "transferencia" && m.cuentaDestino ? ` → ${m.cuentaDestino.nombre}` : ""}
                                </Text>
                                {deVenta && (
                                  <Link as={RouterLink} to={`/ventas/itemAdd/${m.origen.venta._id ?? m.origen.venta}`} fontSize="xs" color="teal.500">
                                    Desde venta
                                  </Link>
                                )}
                                {m.origen?.tipo === "compra" && (
                                  <Text fontSize="xs" color={muted}>· Lista de compras</Text>
                                )}
                                {deMp && (
                                  <Badge colorScheme="blue" variant="subtle" textTransform="none">Mercado Pago</Badge>
                                )}
                                {porLiberar && (
                                  <Text fontSize="xs" color="orange.400">· se libera el {formatFecha(m.liberacion)}</Text>
                                )}
                              </HStack>
                            </Box>
                            <Text fontWeight="bold" className="tnum" color={colorMonto} whiteSpace="nowrap">
                              {m.tipo === "transferencia" ? "" : negativo ? "−" : "+"}
                              {formatMoney(m.monto)}
                            </Text>
                            <HStack spacing={0}>
                              <Tooltip
                                label={
                                  deVenta
                                    ? "Se modifica desde la venta"
                                    : m.tipo === "ajuste"
                                      ? "Los ajustes no se editan"
                                      : deMp
                                        ? "Editar categoría y descripción"
                                        : "Editar"
                                }
                                hasArrow
                              >
                                <IconButton
                                  aria-label="Editar movimiento"
                                  icon={<EditIcon />}
                                  size="sm"
                                  variant="ghost"
                                  isDisabled={Boolean(deVenta) || m.tipo === "ajuste"}
                                  onClick={() => abrirEdicion(m)}
                                />
                              </Tooltip>
                              <Tooltip label={deVenta ? "Se modifica desde la venta" : "Eliminar"} hasArrow>
                                <IconButton
                                  aria-label="Eliminar movimiento"
                                  icon={<DeleteIcon />}
                                  size="sm"
                                  variant="ghost"
                                  colorScheme="red"
                                  isDisabled={Boolean(deVenta)}
                                  onClick={() => handleDelete(m)}
                                />
                              </Tooltip>
                            </HStack>
                          </Flex>
                        );
                      })}
                    </Stack>
                  )}

                  {movimientos.totalPages > 1 && (
                    <Flex justify="center" align="center" gap={3} mt={4}>
                      <Button size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} isDisabled={page <= 1}>Anterior</Button>
                      <Text fontSize="sm" color={muted}>Página {page} de {movimientos.totalPages}</Text>
                      <Button size="sm" onClick={() => setPage((p) => Math.min(movimientos.totalPages, p + 1))} isDisabled={page >= movimientos.totalPages}>Siguiente</Button>
                    </Flex>
                  )}
                </Box>
              </Stack>
            </TabPanel>

            <TabPanel px={0}>
              <CuentasCategoriasPanel
                cuentas={cuentas}
                categorias={categorias}
                cuentaCobroDefault={cuentaCobroDefault}
                onChanged={refrescarTodo}
              />
            </TabPanel>
          </TabPanels>
        </Tabs>
      </Stack>

      <MovimientoModal
        isOpen={movimientoModal.isOpen}
        onClose={movimientoModal.onClose}
        movimiento={movimientoEditando}
        tipoInicial={tipoNuevo}
        cuentas={cuentasActivas}
        categorias={categorias.filter((c) => c.activa)}
        onSaved={refrescarTodo}
      />
      <AjusteSaldoModal
        cuenta={cuentaAjuste}
        onClose={() => setCuentaAjuste(null)}
        onSaved={refrescarTodo}
      />
    </Box>
  );
};
