import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import {
  Box,
  Heading,
  Stack,
  Text,
  Divider,
  Flex,
  FormControl,
  FormLabel,
  Input,
  useColorModeValue,
  Button,
  useToast,
} from "@chakra-ui/react";
import { DownloadIcon } from "@chakra-ui/icons";
import { getMaterialTypeLabel } from "../constants/materialTypes";
import { Loader } from "../components";
import ListaCompraSeccion from "../components/ListaCompraSeccion";
import { useItemsMateriasPrimas } from "../hooks";
import { getShoppingList, saveShoppingList } from "../services/shoppingList.service.js";

const SECTIONS = [
  {
    key: "herreria",
    title: "Herrería",
    colors: {
      bg: { light: "gray.100", dark: "gray.700" },
      border: { light: "gray.300", dark: "gray.500" },
      heading: { light: "gray.800", dark: "gray.100" },
      accent: { light: "blue.600", dark: "blue.200" },
      buttonScheme: "blue",
    },
    filter: { mode: "exclude", categories: ["carpinteria", "proteccion"] },
    showMaterialField: false,
  },
  {
    key: "carpinteria",
    title: "Carpintería",
    colors: {
      bg: { light: "#0d501a", dark: "green.700" },
      border: { light: "lime.200", dark: "lime.500" },
      heading: { light: "green.700", dark: "green.100" },
      accent: { light: "green.600", dark: "green.200" },
      buttonScheme: "green",
    },
    filter: { mode: "include", categories: ["madera"] },
    showMaterialField: true,
    materialFieldLabel: "Nombre de la madera",
  },
  {
    key: "pintura",
    title: "Pintura",
    colors: {
      bg: { light: "purple.50", dark: "purple.900" },
      border: { light: "purple.200", dark: "purple.600" },
      heading: { light: "purple.700", dark: "purple.100" },
      accent: { light: "purple.600", dark: "purple.200" },
      buttonScheme: "purple",
    },
    filter: { mode: "include", categories: ["proteccion"] },
    showMaterialField: false,
  },
];

const STORAGE_KEY = "costify:lista-de-compras";
const STORAGE_KEY_EFECTIVO = `${STORAGE_KEY}:efectivo`;
const STORAGE_KEY_DIGITAL = `${STORAGE_KEY}:digital`;
const SHOPPING_LIST_DEBOUNCE_MS = 1200;

const parseStoredNumber = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const buildEmptySectionItems = () =>
  SECTIONS.reduce((acc, section) => {
    acc[section.key] = [];
    return acc;
  }, {});

const normalizeSectionItemsShape = (value = {}) => {
  const empty = buildEmptySectionItems();
  if (!value || typeof value !== "object") {
    return empty;
  }
  return Object.keys(empty).reduce((acc, key) => {
    const candidate = value[key];
    acc[key] = Array.isArray(candidate) ? candidate : [];
    return acc;
  }, {});
};

const serializeShoppingListPayload = ({ sectionItems, efectivoDisponible, dineroDigital }) =>
  JSON.stringify({ sectionItems, efectivoDisponible, dineroDigital });

const currencyFormatter = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  maximumFractionDigits: 0,
});

const stripNbsp = (value = "") => value.replace(/\u00A0/g, "");

const formatInputCurrency = (value) => {
  if (value === null || value === undefined) return "";
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return "";
  return stripNbsp(currencyFormatter.format(numeric));
};

const parseInputCurrency = (value) => {
  if (!value) return 0;
  const sanitized = value.replace(/[^0-9,.-]/g, "");
  const normalized = sanitized
    .replace(/\./g, "")
    .replace(/,/g, ".");
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
};

export const ListaDeCompras = () => {
  const {
    rawsMaterialData = [],
    loading,
    error,
  } = useItemsMateriasPrimas(100, { fetchAll: true });
  const toast = useToast();

  const materialsById = useMemo(() => {
    const map = new Map();
    rawsMaterialData.forEach((material) => {
      if (material?._id) {
        map.set(material._id, material);
      }
    });
    return map;
  }, [rawsMaterialData]);

  const [efectivoDisponible, setEfectivoDisponible] = useState(() => {
    if (typeof window === "undefined") return 0;
    return parseStoredNumber(
      window.localStorage.getItem(STORAGE_KEY_EFECTIVO)
    );
  });

  const [dineroDigital, setDineroDigital] = useState(() => {
    if (typeof window === "undefined") return 0;
    return parseStoredNumber(
      window.localStorage.getItem(STORAGE_KEY_DIGITAL)
    );
  });

  const [sectionItems, setSectionItems] = useState(() => {
    if (typeof window === "undefined") {
      return buildEmptySectionItems();
    }
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        return {
          ...buildEmptySectionItems(),
          ...(parsed && typeof parsed === "object" ? parsed : {}),
        };
      }
    } catch (storageError) {
      console.error("No se pudo leer la lista guardada", storageError);
    }
    return buildEmptySectionItems();
  });

  const [isShoppingListLoading, setIsShoppingListLoading] = useState(true);
  const [isSyncReady, setIsSyncReady] = useState(false);
  const [hasPendingSave, setHasPendingSave] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSyncedAt, setLastSyncedAt] = useState(null);
  const lastSnapshotRef = useRef(null);
  const isMountedRef = useRef(false);
  const lastSaveErrorMessageRef = useRef(null);
  const sectionItemsRef = useRef(sectionItems);
  const efectivoRef = useRef(efectivoDisponible);
  const digitalRef = useRef(dineroDigital);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    sectionItemsRef.current = sectionItems;
  }, [sectionItems]);

  useEffect(() => {
    efectivoRef.current = efectivoDisponible;
  }, [efectivoDisponible]);

  useEffect(() => {
    digitalRef.current = dineroDigital;
  }, [dineroDigital]);

  const loadShoppingList = useCallback(async () => {
    setIsShoppingListLoading(true);
    try {
      const response = await getShoppingList();
      if (!isMountedRef.current) {
        return;
      }
      const remote = response?.data?.listaCompra;
      if (remote) {
        const normalizedSections = normalizeSectionItemsShape(remote.sectionItems);
        const efectivo = Number(remote.efectivoDisponible ?? 0);
        const digital = Number(remote.dineroDigital ?? 0);
        const remoteHasItems = Object.values(normalizedSections).some(
          (items) => Array.isArray(items) && items.length > 0
        );
        const remoteHasBalances = efectivo > 0 || digital > 0;
        const remoteHasContent = remoteHasItems || remoteHasBalances;

        const localSnapshot = normalizeSectionItemsShape(sectionItemsRef.current);
        const localHasItems = Object.values(localSnapshot).some(
          (items) => Array.isArray(items) && items.length > 0
        );
        const localHasBalances =
          Number(efectivoRef.current || 0) > 0 || Number(digitalRef.current || 0) > 0;
        const localHasContent = localHasItems || localHasBalances;

        if (remoteHasContent || !localHasContent) {
          setSectionItems(normalizedSections);
          setEfectivoDisponible(efectivo);
          setDineroDigital(digital);
          lastSnapshotRef.current = serializeShoppingListPayload({
            sectionItems: normalizedSections,
            efectivoDisponible: efectivo,
            dineroDigital: digital,
          });
          setLastSyncedAt(remote.updatedAt || new Date().toISOString());
          setHasPendingSave(false);
          lastSaveErrorMessageRef.current = null;
        } else {
          lastSnapshotRef.current = null;
        }
      } else {
        lastSnapshotRef.current = serializeShoppingListPayload({
          sectionItems: buildEmptySectionItems(),
          efectivoDisponible: 0,
          dineroDigital: 0,
        });
        setHasPendingSave(false);
        lastSaveErrorMessageRef.current = null;
      }
    } catch (error) {
      console.error("Error al cargar la lista de compras", error);
      if (isMountedRef.current) {
        toast({
          title: "No pudimos cargar la lista de compras",
          description:
            error?.response?.data?.message || "Intentá nuevamente en unos segundos.",
          status: "warning",
          duration: 5000,
          isClosable: true,
        });
      }
    } finally {
      if (isMountedRef.current) {
        setIsShoppingListLoading(false);
        setIsSyncReady(true);
      }
    }
  }, [toast]);

  useEffect(() => {
    loadShoppingList();
  }, [loadShoppingList]);

  const persistShoppingList = useCallback(
    async (payload) => {
      if (!isMountedRef.current) {
        return;
      }
      setIsSaving(true);
      try {
        const response = await saveShoppingList(payload);
        if (!isMountedRef.current) {
          return;
        }
        const updated = response?.data?.listaCompra;
        const normalizedSections = normalizeSectionItemsShape(
          updated?.sectionItems ?? payload.sectionItems
        );
        const efectivo = Number(updated?.efectivoDisponible ?? payload.efectivoDisponible ?? 0);
        const digital = Number(updated?.dineroDigital ?? payload.dineroDigital ?? 0);
        const serialized = serializeShoppingListPayload({
          sectionItems: normalizedSections,
          efectivoDisponible: efectivo,
          dineroDigital: digital,
        });
        setSectionItems(normalizedSections);
        setEfectivoDisponible(efectivo);
        setDineroDigital(digital);
        lastSnapshotRef.current = serialized;
        setHasPendingSave(false);
        setLastSyncedAt(updated?.updatedAt || new Date().toISOString());
        lastSaveErrorMessageRef.current = null;
      } catch (error) {
        console.error("Error al guardar la lista de compras", error);
        if (isMountedRef.current) {
          const message =
            error?.response?.data?.message || "Intentá nuevamente en unos segundos.";
          if (lastSaveErrorMessageRef.current !== message) {
            toast({
              title: "No pudimos guardar la lista",
              description: message,
              status: "error",
              duration: 5000,
              isClosable: true,
            });
            lastSaveErrorMessageRef.current = message;
          }
        }
      } finally {
        if (isMountedRef.current) {
          setIsSaving(false);
        }
      }
    },
    [toast]
  );

  useEffect(() => {
    if (!isSyncReady) {
      return undefined;
    }
    const payload = {
      sectionItems: normalizeSectionItemsShape(sectionItems),
      efectivoDisponible,
      dineroDigital,
    };
    const serialized = serializeShoppingListPayload(payload);
    if (serialized === lastSnapshotRef.current) {
      return undefined;
    }
    setHasPendingSave(true);
    const timeoutId = setTimeout(() => {
      persistShoppingList(payload);
    }, SHOPPING_LIST_DEBOUNCE_MS);
    return () => clearTimeout(timeoutId);
  }, [
    efectivoDisponible,
    dineroDigital,
    isSyncReady,
    persistShoppingList,
    sectionItems,
  ]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(sectionItems));
    } catch (storageError) {
      console.error("No se pudo guardar la lista de compras", storageError);
    }
  }, [sectionItems]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(
        STORAGE_KEY_EFECTIVO,
        String(efectivoDisponible || 0)
      );
    } catch (storageError) {
      console.error("No se pudo guardar el efectivo disponible", storageError);
    }
  }, [efectivoDisponible]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(
        STORAGE_KEY_DIGITAL,
        String(dineroDigital || 0)
      );
    } catch (storageError) {
      console.error("No se pudo guardar el dinero digital", storageError);
    }
  }, [dineroDigital]);

  const [subtotals, setSubtotals] = useState({
    herreria: 0,
    carpinteria: 0,
    pintura: 0,
  });

  const handleSubtotalChange = useCallback((sectionKey, amount) => {
    setSubtotals((prev) => ({ ...prev, [sectionKey]: amount }));
  }, []);

  const handleItemsChange = useCallback((sectionKey, items) => {
    setSectionItems((prev) => ({ ...prev, [sectionKey]: items }));
  }, []);

  const totalGeneral = useMemo(
    () =>
      Object.values(subtotals).reduce(
        (acc, value) => acc + (Number.isFinite(value) ? value : 0),
        0
      ),
    [subtotals]
  );

  const totalDisponible = useMemo(
    () => (Number(efectivoDisponible) || 0) + (Number(dineroDigital) || 0),
    [efectivoDisponible, dineroDigital]
  );

  const diferencia = useMemo(
    () => totalDisponible - totalGeneral,
    [totalDisponible, totalGeneral]
  );

  const syncStatusMessage = useMemo(() => {
    if (isSaving) return "Guardando cambios...";
    if (hasPendingSave) return "Cambios pendientes de guardado";
    if (lastSyncedAt) {
      try {
        return `Última sincronización: ${new Date(lastSyncedAt).toLocaleString("es-AR")}`;
      } catch (dateError) {
        console.error("No se pudo formatear la fecha de sincronización", dateError);
      }
    }
    return "Sincronización pendiente";
  }, [hasPendingSave, isSaving, lastSyncedAt]);

  const pageBg = useColorModeValue("gray.50", "gray.900");
  const summaryBg = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.700");
  const mutedText = useColorModeValue("gray.600", "gray.400");

  const getMaterialName = useCallback(
    (item) => {
      if (!item) return "";
      if (item.esPersonalizado) {
        return item.nombrePersonalizado || item.descripcion || "Ítem manual";
      }
      if (item.nombreMadera) return item.nombreMadera;
      const onRecord = materialsById.get(item.materiaId);
      return (
        onRecord?.nombreMadera ||
        onRecord?.nombre ||
        onRecord?.codigo ||
        "Material"
      );
    },
    [materialsById]
  );

  const getUnitPrice = useCallback(
    (item) => {
      if (!item) return 0;
      if (item.esPersonalizado) {
        const manualValue = Number(item.valorPersonalizado);
        return Number.isFinite(manualValue) ? manualValue : 0;
      }
      const material = materialsById.get(item.materiaId);
      const parsed = Number(material?.precio ?? 0);
      return Number.isFinite(parsed) ? parsed : 0;
    },
    [materialsById]
  );

  const getLineTotal = useCallback(
    (item) => {
      if (!item) return 0;
      const quantity = Number(item.cantidad) || 0;
      return getUnitPrice(item) * quantity;
    },
    [getUnitPrice]
  );

  const handleExport = useCallback(async () => {
    if (typeof window === "undefined") return;

    let XLSX;
    try {
      XLSX = await import("xlsx-js-style");
    } catch (importError) {
      console.error("No se pudo cargar la librería de exportación", importError);
      toast({
        title: "Error al preparar la exportación",
        description: "Intentá nuevamente en unos segundos.",
        status: "error",
        duration: 4000,
        isClosable: true,
      });
      return;
    }

    const header = [
      "Sección",
      "Material",
      "Categoría",
      "Tipo",
      "Medida",
      "Espesor",
      "Cantidad",
      "Valor unitario",
      "Sub-total",
      "Notas",
    ];

    const rows = [header];
    let hasData = false;

    const makeEmptyRow = () => new Array(header.length).fill("");

    SECTIONS.forEach((section) => {
      const sectionList = sectionItems[section.key] ?? [];
      if (!sectionList.length) return;
      hasData = true;
      sectionList.forEach((item) => {
        const displayTipo = section.key === "herreria"
          ? getMaterialTypeLabel(item.tipo) || item.tipo || ""
          : item.tipo || "";
        rows.push([
          section.title,
          getMaterialName(item),
          item.categoria || "",
          displayTipo,
          item.medida || "",
          item.espesor || "",
          Number(item.cantidad) || 0,
          getUnitPrice(item) || 0,
          getLineTotal(item) || 0,
          item.descripcion || "",
        ]);
      });
    });

    if (!hasData) {
      toast({
        title: "No hay datos para exportar",
        description: "Agregá ítems a la lista antes de generar el archivo.",
        status: "info",
        duration: 4000,
        isClosable: true,
      });
      return;
    }

    rows.push(makeEmptyRow());
    rows.push([
      "",
      "Total general",
      "",
      "",
      "",
      "",
      "",
      "",
      totalGeneral,
      "",
    ]);
    rows.push([
      "",
      "Disponible total",
      "",
      "",
      "",
      "",
      "",
      "",
      totalDisponible,
      "",
    ]);
    rows.push([
      "",
      "Diferencia",
      "",
      "",
      "",
      "",
      "",
      "",
      diferencia,
      "",
    ]);

    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.aoa_to_sheet(rows);

    worksheet["!cols"] = [
      { wch: 16 },
      { wch: 28 },
      { wch: 16 },
      { wch: 16 },
      { wch: 14 },
      { wch: 14 },
      { wch: 12 },
      { wch: 16 },
      { wch: 16 },
      { wch: 24 },
    ];

    worksheet["!rows"] = rows.map((_, index) =>
      index === 0 ? { hpt: 28 } : { hpt: 20 }
    );

    const range = XLSX.utils.decode_range(worksheet["!ref"]);
    const headerBorder = { style: "thin", color: { rgb: "CBD5E0" } };
    const bodyBorder = { style: "thin", color: { rgb: "E2E8F0" } };

    const applyHeaderStyle = () => {
      const headerStyle = {
        font: { bold: true, color: { rgb: "FFFFFF" } },
        alignment: { horizontal: "center", vertical: "center" },
        fill: { fgColor: { rgb: "1A202C" } },
        border: {
          top: headerBorder,
          bottom: headerBorder,
          left: headerBorder,
          right: headerBorder,
        },
      };
      for (let c = range.s.c; c <= range.e.c; c += 1) {
        const cellAddress = XLSX.utils.encode_cell({ r: 0, c });
        const cell = worksheet[cellAddress];
        if (cell) {
          cell.s = headerStyle;
        }
      }
    };

    const buildBodyStyle = (overrides = {}) => ({
      font: { color: { rgb: "1A202C" }, ...(overrides.font || {}) },
      alignment: {
        horizontal: "left",
        vertical: "center",
        ...(overrides.alignment || {}),
      },
      border: {
        top: bodyBorder,
        bottom: bodyBorder,
        left: bodyBorder,
        right: bodyBorder,
      },
      ...(overrides.fill ? { fill: overrides.fill } : {}),
    });

    const applyBodyStyles = () => {
      for (let r = 1; r <= range.e.r; r += 1) {
        for (let c = range.s.c; c <= range.e.c; c += 1) {
          const cellAddress = XLSX.utils.encode_cell({ r, c });
          const cell = worksheet[cellAddress];
          if (cell) {
            cell.s = buildBodyStyle();
          }
        }
      }
    };

    const applyColumnStyle = (columnIndex, overrides = {}, numFmt) => {
      for (let r = 1; r <= range.e.r; r += 1) {
        const cellAddress = XLSX.utils.encode_cell({ r, c: columnIndex });
        const cell = worksheet[cellAddress];
        if (!cell) continue;
        cell.s = buildBodyStyle(overrides);
        if (numFmt && typeof cell.v === "number") {
          cell.z = numFmt;
        }
      }
    };

    applyHeaderStyle();
    applyBodyStyles();
    applyColumnStyle(4, { alignment: { horizontal: "center" } });
    applyColumnStyle(6, { alignment: { horizontal: "center" } });
    const currencyFormat = '"$"#,##0';
    applyColumnStyle(7, { alignment: { horizontal: "center" } }, currencyFormat);
    applyColumnStyle(8, { alignment: { horizontal: "center" } }, currencyFormat);

    XLSX.utils.book_append_sheet(workbook, worksheet, "Lista de Compras");
    const timestamp = new Date().toISOString().split("T")[0];
    XLSX.writeFile(workbook, `lista-compras-${timestamp}.xlsx`);
  }, [
    diferencia,
    getLineTotal,
    getMaterialName,
    getUnitPrice,
    sectionItems,
    toast,
    totalDisponible,
    totalGeneral,
  ]);

  const isPageLoading =
    (loading && rawsMaterialData.length === 0) || isShoppingListLoading;

  if (isPageLoading) {
    return <Loader />;
  }

  if (error) {
    return (
      <Box p={8}>
        <Text color="red.400">No pudimos cargar las materias primas: {error}</Text>
      </Box>
    );
  }

  return (
    <Box bg={pageBg} minH="100vh" px={{ base: 4, md: 10 }} py={{ base: 6, md: 10 }}>
      <Stack spacing={8} maxW="1200px" mx="auto">
        <Box>
          <Heading fontSize={{ base: "2xl", md: "4xl" }} mb={2} fontFamily="'Space Grotesk', 'DM Sans', sans-serif">
            Lista de Compras
          </Heading>
          <Text fontSize="lg" color={mutedText} maxW="720px">
            Organizá las compras por área, calculá cantidades.
          </Text>
          <Text fontSize="sm" color={mutedText} mt={1}>
            {syncStatusMessage}
          </Text>
        </Box>

        <Stack spacing={6}>
          {SECTIONS.map((section) => (
            <ListaCompraSeccion
              key={section.key}
              title={section.title}
              categorySlug={section.key}
              rawMaterials={rawsMaterialData}
              colorConfig={section.colors}
              filterConfig={section.filter}
              items={sectionItems[section.key] ?? []}
              onItemsChange={(items) => handleItemsChange(section.key, items)}
              showMaterialField={section.showMaterialField}
              materialFieldLabel={section.materialFieldLabel}
              onSubtotalChange={(value) => handleSubtotalChange(section.key, value)}
            />
          ))}
        </Stack>

        <Box
          mt={6}
          p={6}
          borderRadius="2xl"
          bg={summaryBg}
          borderWidth="1px"
          borderColor={borderColor}
          boxShadow="xl"
        >
          <Heading size="md" mb={4} fontFamily="'Space Grotesk', 'DM Sans', sans-serif">
            Resumen de compra
          </Heading>
          <Stack spacing={3}>
            {SECTIONS.map((section) => (
              <Flex key={section.key} justify="space-between" fontSize="md">
                <Text color={mutedText}>{section.title}</Text>
                <Text fontWeight="semibold">
                  {currencyFormatter.format(subtotals[section.key] || 0)}
                </Text>
              </Flex>
            ))}
          </Stack>
          <Divider my={5} />
          <Flex justify="space-between" align="center">
            <Text fontSize="lg" fontWeight="semibold">
              Total general
            </Text>
            <Text fontSize="lg" fontWeight="bold">
              {currencyFormatter.format(totalGeneral)}
            </Text>
          </Flex>
          <Stack spacing={3} mt={6}>
            <FormControl>
              <FormLabel fontSize="sm">Efectivo disponible</FormLabel>
              <Input
                value={formatInputCurrency(efectivoDisponible)}
                onChange={(event) =>
                  setEfectivoDisponible(parseInputCurrency(event.target.value))
                }
                placeholder="$0"
                size="sm"
                inputMode="decimal"
              />
            </FormControl>
            <FormControl>
              <FormLabel fontSize="sm">Dinero digital</FormLabel>
              <Input
                value={formatInputCurrency(dineroDigital)}
                onChange={(event) =>
                  setDineroDigital(parseInputCurrency(event.target.value))
                }
                placeholder="$0"
                size="sm"
                inputMode="decimal"
              />
            </FormControl>
            <Flex justify="space-between" fontSize="md">
              <Text color={mutedText}>Disponible total</Text>
              <Text fontWeight="semibold">
                {currencyFormatter.format(totalDisponible)}
              </Text>
            </Flex>
            <Flex justify="space-between" fontSize="lg" fontWeight="bold">
              <Text>Diferencia</Text>
              <Text color={diferencia >= 0 ? "green.500" : "red.400"}>
                {currencyFormatter.format(diferencia)}
              </Text>
            </Flex>
          </Stack>
          <Button
            leftIcon={<DownloadIcon />}
            colorScheme="teal"
            mt={6}
            onClick={handleExport}
            width={{ base: "100%", sm: "auto" }}
          >
            Exportar a Excel
          </Button>
        </Box>
      </Stack>
    </Box>
  );
};
