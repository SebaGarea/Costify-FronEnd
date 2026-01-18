import { useState, useMemo, useCallback, useEffect } from "react";
import {
  Box,
  Heading,
  Stack,
  Text,
  Divider,
  Flex,
  FormControl,
  FormLabel,
  NumberInput,
  NumberInputField,
  useColorModeValue,
} from "@chakra-ui/react";
import { Loader } from "../components";
import ListaCompraSeccion from "../components/ListaCompraSeccion";
import { useItemsMateriasPrimas } from "../hooks";

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

const parseStoredNumber = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const buildEmptySectionItems = () =>
  SECTIONS.reduce((acc, section) => {
    acc[section.key] = [];
    return acc;
  }, {});

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

  const pageBg = useColorModeValue("gray.50", "gray.900");
  const summaryBg = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.700");
  const mutedText = useColorModeValue("gray.600", "gray.400");

  if (loading && rawsMaterialData.length === 0) {
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
              <NumberInput
                value={formatInputCurrency(efectivoDisponible)}
                min={0}
                onChange={(valueString) =>
                  setEfectivoDisponible(parseInputCurrency(valueString))
                }
                size="sm"
              >
                <NumberInputField placeholder="$0" />
              </NumberInput>
            </FormControl>
            <FormControl>
              <FormLabel fontSize="sm">Dinero digital</FormLabel>
              <NumberInput
                value={formatInputCurrency(dineroDigital)}
                min={0}
                onChange={(valueString) =>
                  setDineroDigital(parseInputCurrency(valueString))
                }
                size="sm"
              >
                <NumberInputField placeholder="$0" />
              </NumberInput>
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
        </Box>
      </Stack>
    </Box>
  );
};
