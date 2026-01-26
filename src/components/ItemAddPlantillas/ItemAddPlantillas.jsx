import { useEffect, useState, useCallback, useMemo } from "react";

// Custom hook para debouncing (evita cálculos excesivos)
const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

// Hook para throttling de inputs más eficiente
const useThrottle = (callback, delay) => {
  const [isThrottled, setIsThrottled] = useState(false);

  return useCallback(
    (...args) => {
      if (!isThrottled) {
        callback(...args);
        setIsThrottled(true);
        setTimeout(() => setIsThrottled(false), delay);
      }
    },
    [callback, delay, isThrottled]
  );
};
import {
  useAddPlantilla,
  useItemsMateriasPrimas,
  useUpdatePlantilla,
  useGetTiposProyectoUnicos,
} from "../../hooks/index.js";
import { useAddProduct } from "../../hooks/productos/useAddProduct.js";
import {
  Button,
  Flex,
  Grid,
  GridItem,
  FormControl,
  FormLabel,
  FormHelperText,
  Input,
  Select,
  Stack,
  useToast,
  Box,
  Heading,
  HStack,
  VStack,
  Text,
  IconButton,
  SimpleGrid,
  Divider,
  Badge,
  Card,
  CardBody,
  CardHeader,
  useColorModeValue,
  Checkbox,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  Textarea,
} from "@chakra-ui/react";
import { FiPlus, FiMinus, FiRefreshCw } from "react-icons/fi";
import { useNavigate } from "react-router";
import { getPlantillaById } from "../../services/plantillas.service.js";
import { getMaterialTypeLabel } from "../../constants/materialTypes.js";
import {
  MERCADO_LIBRE_PLANS,
  buildDefaultPlataformasConfig,
  computePriceWithCommission,
  getMercadoLibrePrices,
  getNubePrices,
  parseStoredPlataformasConfig,
  PLATAFORMAS_CONFIG_STORAGE_KEY,
} from "../../constants/platformPricing.js";

// Función para formatear números con formato peso argentino similar a las cards
const formatCurrency = (value) => {
  if (value === null || value === undefined || value === "") return "";
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return "";
  const truncated = Math.trunc(parsed * 100) / 100;
  const hasDecimals = Math.abs(truncated % 1) > 0;
  const options = hasDecimals
    ? { minimumFractionDigits: 2, maximumFractionDigits: 2 }
    : { minimumFractionDigits: 0, maximumFractionDigits: 0 };
  return truncated.toLocaleString("es-AR", options);
};

// Función para desformatear (quitar separadores y normalizar decimales)
const unformatCurrency = (value) => {
  if (value === null || value === undefined) return "";
  const raw = value.toString().trim();
  if (!raw) return "";

  const compact = raw.replace(/[\s\u00A0]/g, "");
  if (!compact) return "";

  const allowed = compact.replace(/[^0-9.,-]/g, "");
  if (!allowed) return "";

  const lastComma = allowed.lastIndexOf(",");
  const lastDot = allowed.lastIndexOf(".");
  let decimalSeparator = null;

  if (lastComma !== -1 && lastDot !== -1) {
    decimalSeparator = lastComma > lastDot ? "," : ".";
  } else if (lastComma !== -1) {
    decimalSeparator = ",";
  } else if (lastDot !== -1) {
    const fractionalLength = allowed.length - lastDot - 1;
    if (fractionalLength > 0 && fractionalLength <= 2) {
      decimalSeparator = ".";
    }
  }

  let integerPart = allowed;
  let fractionalPart = "";

  if (decimalSeparator) {
    const separatorIndex = allowed.lastIndexOf(decimalSeparator);
    integerPart = allowed.slice(0, separatorIndex);
    fractionalPart = allowed.slice(separatorIndex + 1);
  }

  integerPart = integerPart.replace(/[^0-9-]/g, "");
  fractionalPart = fractionalPart.replace(/[^0-9]/g, "");

  if (!decimalSeparator) {
    return integerPart;
  }

  const normalizedInteger = integerPart || "0";
  const normalizedFractional = fractionalPart || "0";

  return `${normalizedInteger}.${normalizedFractional}`;
};

// Función para formatear precios mostrados (para badges y totales)
const formatPrice = (value) => {
  const formatted = formatCurrency(value);
  return formatted ? `$${formatted}` : "$0";
};

const normalizeText = (value = "") =>
  value
    ?.toString()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase() || "";

const categoriaRules = {
  herreria: {
    exclude: ["madera", "pintura", "pinturas"],
  },
  carpinteria: {
    include: ["madera"],
  },
  pintura: {
    include: ["proteccion"],
  },
  otros: {},
};

const seccionLabels = {
  herreria: "Herrería",
  carpinteria: "Carpintería",
  pintura: "Pintura",
  otros: "Otros",
};

const createEmptyItem = () => ({
  categoriaMP: "",
  tipoMP: "",
  medidaMP: "",
  espesorMP: "",
  valor: "",
  cantidad: "",
  isPriceAuto: false,
  isCustomMaterial: false,
  descripcionPersonalizada: "",
  nombreMadera: "",
  selectedMaterialId: "",
});

const createDefaultExtrasState = () => ({
  creditoCamioneta: { valor: "15000", porcentaje: "0" },
  envio: { valor: "", porcentaje: "0" },
  camposPersonalizados: [],
});

const toInputString = (value, fallback = "") =>
  value === undefined || value === null ? fallback : value.toString();

const formatCategoriaLabel = (value = "") =>
  value ? value.charAt(0).toUpperCase() + value.slice(1) : "";

const shouldIncludeCategoria = (section, categoria) => {
  if (!categoria || !section) return Boolean(categoria);
  const normalized = normalizeText(categoria);
  const rules = categoriaRules[section];
  if (!rules) return true;

  if (rules.include?.length) {
    return rules.include.some((allowed) => normalized === allowed);
  }

  if (rules.exclude?.length) {
    return !rules.exclude.some((blocked) => normalized === blocked);
  }

  return true;
};


export const ItemAddPlantillas = ({ PlantillasId }) => {
  const [form, setForm] = useState({
    nombre: "",
    tipoProyecto: "",
    items: [],
    porcentajesPorCategoria: {
      herreria: 100,
      carpinteria: 100,
      pintura: 100,
      otros: 100,
    },
  });

  // Estado para rastrear si estamos en modo personalizado
  const [modoPersonalizado, setModoPersonalizado] = useState(false);

  // Estados para la creación automática de producto
  const [crearProducto, setCrearProducto] = useState(false);
  const [datosProducto, setDatosProducto] = useState({
    nombre: "",
    catalogo: "",
    modelo: "",
    descripcion: "",
    stock: 0
  });

  // Función para cargar configuración de plataformas desde localStorage
  const cargarConfiguracionPlataformas = () => {
    if (typeof window === "undefined" || !window.localStorage) {
      return buildDefaultPlataformasConfig();
    }
    const configGuardada = window.localStorage.getItem(
      PLATAFORMAS_CONFIG_STORAGE_KEY
    );
    return parseStoredPlataformasConfig(configGuardada);
  };

  // Estado para porcentajes de plataformas de venta
  const [porcentajesPlataformas, setPorcentajesPlataformas] = useState(
    cargarConfiguracionPlataformas
  );

  // Estados separados para cada categoría
  const [herreria, setHerreria] = useState([createEmptyItem()]);
  const [carpinteria, setCarpinteria] = useState([createEmptyItem()]);
  const [pintura, setPintura] = useState([createEmptyItem()]);
  const [otros, setOtros] = useState([createEmptyItem()]);

  // Estado para consumibles por categoría
  const [consumibles, setConsumibles] = useState({
    herreria: "",
    carpinteria: "",
    pintura: "",
    otros: "",
  });

  const [extras, setExtras] = useState(createDefaultExtrasState);

  // Hook para obtener tipos de proyecto únicos dinámicamente
  const { tiposProyecto, loading: loadingTipos, refetch: refetchTipos } = useGetTiposProyectoUnicos();
  
  // Opciones dinámicas para tipos de proyecto (memoizadas para optimizar rendimiento)
  const tiposProyectoOptions = useMemo(() => [
    // Opciones del enum del backend
    { value: "Puerta", label: "Puerta" },
    { value: "Ventana", label: "Ventana" },
    { value: "Portón", label: "Portón" },
    { value: "Mueble", label: "Mueble" },
    { value: "Estructura", label: "Estructura" },
    { value: "Decorativo", label: "Decorativo" },
    { value: "Otro", label: "Otro" },
    // Opciones dinámicas de plantillas existentes (filtradas para evitar duplicados)
    ...tiposProyecto.filter(tipo => 
      !["Puerta", "Ventana", "Portón", "Mueble", "Estructura", "Decorativo", "Otro"].includes(tipo)
    ).map(tipo => ({ value: tipo, label: tipo })),
    // Opción personalizada al final
    { value: "personalizado", label: "Personalizado" }
  ], [tiposProyecto]);

  const toast = useToast();
  const navigate = useNavigate();

  const {
    loading: addLoading,
    error: addError,
    addPlantilla,
  } = useAddPlantilla();

  const {
    addProduct,
    loading: isCreateProductLoading,
  } = useAddProduct();

  const {
    updatePlantilla,
    loading: updateLoading,
    error: updateError,
  } = useUpdatePlantilla();

  const { rawsMaterialData, loading: materiasLoading } = useItemsMateriasPrimas(100, { fetchAll: true });

  // Variables de color para modo claro/oscuro
  const cardBg = useColorModeValue("teal.50", "gray.700");
  const cardBorder = useColorModeValue("teal.200", "teal.500");
  const titleColor = useColorModeValue("teal.600", "teal.300");
  const subtotalBg = useColorModeValue("gray.50", "gray.600");
  const mutedTextColor = useColorModeValue("gray.600", "gray.300");

  // Variables de color para la sección del producto
  const productoBg = useColorModeValue("blue.50", "blue.900");
  const productoBorder = useColorModeValue("blue.200", "blue.600");
  const inputBg = useColorModeValue("white", "gray.700");
  const precioBg = useColorModeValue("green.50", "green.900");
  const precioBorder = useColorModeValue("green.200", "green.600");

  // Función para calcular subtotal de una categoría
  const calcularSubtotal = (items) => {
    return items.reduce((total, item) => {
      if (item.valor && item.cantidad) {
        return (
          total + parseFloat(item.valor || 0) * parseFloat(item.cantidad || 0)
        );
      }
      return total;
    }, 0);
  };

  // Función para calcular precio final con porcentaje de ganancia
  const calcularPrecioFinal = (subtotal, porcentaje) => {
    return subtotal * (1 + parseFloat(porcentaje || 0) / 100);
  };

  // Debounce de los estados para evitar recálculos excesivos
  const debouncedHerreria = useDebounce(herreria, 300);
  const debouncedCarpinteria = useDebounce(carpinteria, 300);
  const debouncedPintura = useDebounce(pintura, 300);
  const debouncedOtros = useDebounce(otros, 300);
  const debouncedConsumibles = useDebounce(consumibles, 300);

  // Memoizar cálculos pesados de subtotales con valores debounced
  const subtotalHerreria = useMemo(
    () =>
      calcularSubtotal(debouncedHerreria) +
      parseFloat(debouncedConsumibles.herreria || 0),
    [debouncedHerreria, debouncedConsumibles.herreria]
  );
  const subtotalCarpinteria = useMemo(
    () =>
      calcularSubtotal(debouncedCarpinteria) +
      parseFloat(debouncedConsumibles.carpinteria || 0),
    [debouncedCarpinteria, debouncedConsumibles.carpinteria]
  );
  const subtotalPintura = useMemo(
    () =>
      calcularSubtotal(debouncedPintura) +
      parseFloat(debouncedConsumibles.pintura || 0),
    [debouncedPintura, debouncedConsumibles.pintura]
  );
  const subtotalOtros = useMemo(
    () =>
      calcularSubtotal(debouncedOtros) +
      parseFloat(debouncedConsumibles.otros || 0),
    [debouncedOtros, debouncedConsumibles.otros]
  );

  // Calcular subtotal de extras con porcentajes aplicados
  const subtotalExtras =
    parseFloat(extras.creditoCamioneta.valor || 0) *
      (1 + parseFloat(extras.creditoCamioneta.porcentaje || 0) / 100) +
    parseFloat(extras.envio.valor || 0) *
      (1 + parseFloat(extras.envio.porcentaje || 0) / 100) +
    extras.camposPersonalizados.reduce((total, campo) => {
      const valorBase = parseFloat(campo.valor || 0);
      const valorConPorcentaje =
        valorBase * (1 + parseFloat(campo.porcentaje || 0) / 100);
      return total + valorConPorcentaje;
    }, 0);

  // Memoizar cálculos de precios finales
  const precioFinalHerreria = useMemo(
    () =>
      calcularPrecioFinal(
        subtotalHerreria,
        form.porcentajesPorCategoria.herreria
      ),
    [subtotalHerreria, form.porcentajesPorCategoria.herreria]
  );
  const precioFinalCarpinteria = useMemo(
    () =>
      calcularPrecioFinal(
        subtotalCarpinteria,
        form.porcentajesPorCategoria.carpinteria
      ),
    [subtotalCarpinteria, form.porcentajesPorCategoria.carpinteria]
  );
  const precioFinalPintura = useMemo(
    () =>
      calcularPrecioFinal(
        subtotalPintura,
        form.porcentajesPorCategoria.pintura
      ),
    [subtotalPintura, form.porcentajesPorCategoria.pintura]
  );
  const precioFinalOtros = useMemo(
    () =>
      calcularPrecioFinal(
        subtotalOtros,
        form.porcentajesPorCategoria.otros
      ),
    [subtotalOtros, form.porcentajesPorCategoria.otros]
  );

  // Total general (incluyendo extras)
  const costoTotal =
    subtotalHerreria +
    subtotalCarpinteria +
    subtotalPintura +
    subtotalOtros +
    subtotalExtras;
  const precioFinalTotal =
    precioFinalHerreria +
    precioFinalCarpinteria +
    precioFinalPintura +
    precioFinalOtros +
    subtotalExtras;
  const gananciaTotal = precioFinalTotal - costoTotal;

  // Cálculos para plataformas de venta
  const preciosMercadoLibre = useMemo(
    () => getMercadoLibrePrices(precioFinalTotal, porcentajesPlataformas),
    [precioFinalTotal, porcentajesPlataformas]
  );

  const {
    basePercent: nubeBasePercent,
    cuotasExtraPercent: nubeCuotasExtraPercent,
    totalCuotasPercent: nubeCuotasTotalPercent,
    valorBase: valorNube,
    valorCuotas: valorNubeCuotas,
  } = useMemo(
    () => getNubePrices(precioFinalTotal, porcentajesPlataformas),
    [precioFinalTotal, porcentajesPlataformas]
  );

  useEffect(() => {
    if (PlantillasId) {
      getPlantillaById(PlantillasId)
        .then((res) => {
          const plantilla = res.data.plantilla || res.data;
          const porcentajesGuardados = plantilla.porcentajesPorCategoria || {};
          setForm({
            nombre: plantilla.nombre || "",
            tipoProyecto: plantilla.tipoProyecto || "",
            items: plantilla.items || [],
            porcentajesPorCategoria: {
              herreria: porcentajesGuardados.herreria ?? 100,
              carpinteria: porcentajesGuardados.carpinteria ?? 100,
              pintura: porcentajesGuardados.pintura ?? 100,
              otros: porcentajesGuardados.otros ?? 100,
            },
          });

          // Cargar consumibles si existen
          const consumiblesGuardados = plantilla.consumibles || {};
          setConsumibles({
            herreria: consumiblesGuardados.herreria || "",
            carpinteria: consumiblesGuardados.carpinteria || "",
            pintura: consumiblesGuardados.pintura || "",
            otros: consumiblesGuardados.otros || "",
          });

          if (plantilla.extras) {
            const extrasServidor = plantilla.extras;
            setExtras({
              creditoCamioneta: {
                valor: toInputString(
                  extrasServidor.creditoCamioneta?.valor,
                  "15000"
                ),
                porcentaje: toInputString(
                  extrasServidor.creditoCamioneta?.porcentaje,
                  "0"
                ),
              },
              envio: {
                valor: toInputString(extrasServidor.envio?.valor, ""),
                porcentaje: toInputString(extrasServidor.envio?.porcentaje, "0"),
              },
              camposPersonalizados: Array.isArray(
                extrasServidor.camposPersonalizados
              )
                ? extrasServidor.camposPersonalizados.map((campo) => ({
                    nombre: campo.nombre || "",
                    valor: toInputString(campo.valor, ""),
                    porcentaje: toInputString(campo.porcentaje, "0"),
                  }))
                : [],
            });
          } else {
            setExtras(createDefaultExtrasState());
          }

          // Detectar si el tipo de proyecto es personalizado (no está en las opciones predefinidas)
          const tipoProyecto = plantilla.tipoProyecto || "";
          const esPersonalizado = tipoProyecto && !tiposProyectoOptions.some(
            (opt) => opt.value === tipoProyecto
          );
          
          if (esPersonalizado) {
            setModoPersonalizado(true);
          } else {
            setModoPersonalizado(false);
          }

          // Función para convertir item del servidor al formato de cascada
          const convertirItemACascada = (item) => {
            const esPersonalizado = Boolean(item.esPersonalizado || !item.materiaPrima);
            const materiaPrimaId =
              typeof item.materiaPrima === "object"
                ? item.materiaPrima?._id?.toString() || ""
                : typeof item.materiaPrima === "string"
                ? item.materiaPrima
                : "";

            const baseItem = {
              ...createEmptyItem(),
              ...item,
              valor: toInputString(item.valor, ""),
              cantidad: toInputString(item.cantidad, ""),
              descripcionPersonalizada: item.descripcionPersonalizada || "",
              nombreMadera: item.nombreMadera || "",
              selectedMaterialId: item.selectedMaterialId || materiaPrimaId,
              isCustomMaterial: esPersonalizado || Boolean(item.isCustomMaterial),
              isPriceAuto: esPersonalizado ? false : Boolean(item.isPriceAuto),
            };

            const tieneMetadatosCascada = Boolean(
              item.categoriaMP ||
                item.tipoMP ||
                item.medidaMP ||
                item.espesorMP ||
                item.nombreMadera
            );

            if (esPersonalizado && tieneMetadatosCascada) {
              return baseItem;
            }

            if (item.categoriaMP && item.tipoMP && item.medidaMP && !esPersonalizado) {
              return baseItem;
            }

            // Si materiaPrima es un OBJETO (populate del backend)
            if (item.materiaPrima && typeof item.materiaPrima === "object") {
              const selectedId = item.materiaPrima?._id?.toString() || materiaPrimaId;
              return {
                ...baseItem,
                categoriaMP:
                  item.materiaPrima.categoriaMP ||
                  item.materiaPrima.categoria ||
                  "",
                tipoMP:
                  item.materiaPrima.tipoMP || item.materiaPrima.type || "",
                medidaMP:
                  item.materiaPrima.medidaMP || item.materiaPrima.medida || "",
                espesorMP:
                  item.materiaPrima.espesorMP ||
                  item.materiaPrima.espesor ||
                  "",
                valor: toInputString(item.valor, "") || toInputString(item.materiaPrima.precio, ""),
                cantidad: toInputString(item.cantidad, ""),
                isPriceAuto: true, // Marcar como automático ya que viene del backend
                isCustomMaterial: esPersonalizado,
                descripcionPersonalizada: item.descripcionPersonalizada || "",
                nombreMadera:
                  item.nombreMadera || item.materiaPrima.nombreMadera || "",
                selectedMaterialId: selectedId,
              };
            }

            // Si materiaPrima es un ObjectId string y no tiene campos separados
            if (item.materiaPrima && typeof item.materiaPrima === "string") {
              // Intentar encontrar la materia prima por ObjectId
              const material = rawsMaterialData.find(
                (mp) => mp._id === item.materiaPrima
              );
              if (material) {
                return {
                  ...baseItem,
                  categoriaMP: material.categoria || "",
                  tipoMP: material.type || "",
                  medidaMP: material.medida || "",
                  espesorMP: material.espesor || "",
                  valor: toInputString(item.valor, "") || toInputString(material.precio, ""),
                  cantidad: toInputString(item.cantidad, ""),
                  isPriceAuto: false,
                  isCustomMaterial: esPersonalizado,
                  descripcionPersonalizada: item.descripcionPersonalizada || "",
                  nombreMadera: item.nombreMadera || material.nombreMadera || "",
                  selectedMaterialId: material._id?.toString() || materiaPrimaId,
                };
              }

              // Si materiaPrima es texto concatenado (estructura antigua)
              if (item.materiaPrima.includes(" - ")) {
                const partes = item.materiaPrima.split(" - ");
                return {
                  ...baseItem,
                  categoriaMP: partes[0] || "",
                  tipoMP: partes[1] || "",
                  medidaMP: partes[2] || "",
                  espesorMP: partes[3] || "",
                  valor: toInputString(item.valor, ""),
                  cantidad: toInputString(item.cantidad, ""),
                  isPriceAuto: false,
                  isCustomMaterial: esPersonalizado,
                  descripcionPersonalizada: item.descripcionPersonalizada || "",
                  nombreMadera: item.nombreMadera || "",
                  selectedMaterialId: "",
                };
              }
            }

            // Si no tiene ninguna estructura válida, reutilizar baseItem para mantener los datos ingresados
            return baseItem;
          };

          // Separar items por categoría y convertir al formato de cascada

          const herreriaItems =
            plantilla.items
              ?.filter((item) => item.categoria === "herreria")
              .map(convertirItemACascada) ?? [createEmptyItem()];

          const carpinteriaItems =
            plantilla.items
              ?.filter((item) => item.categoria === "carpinteria")
              .map(convertirItemACascada) ?? [createEmptyItem()];

          const pinturaItems =
            plantilla.items
              ?.filter((item) => item.categoria === "pintura")
              .map(convertirItemACascada) ?? [createEmptyItem()];

          const otrosItems =
            plantilla.items
              ?.filter((item) => item.categoria === "otros")
              .map(convertirItemACascada) ?? [createEmptyItem()];

          setHerreria(herreriaItems.length > 0 ? herreriaItems : [createEmptyItem()]);
          setCarpinteria(
            carpinteriaItems.length > 0 ? carpinteriaItems : [createEmptyItem()]
          );
          setPintura(pinturaItems.length > 0 ? pinturaItems : [createEmptyItem()]);
          setOtros(otrosItems.length > 0 ? otrosItems : [createEmptyItem()]);
        })
        .catch((error) => {
          console.error("Error al cargar la plantilla:", error);
          toast({
            title: "Error",
            description: "No se pudo cargar la plantilla",
            status: "error",
            duration: 3000,
            isClosable: true,
          });
        });
    }
  }, [PlantillasId, toast, rawsMaterialData, tiposProyectoOptions]);

  // useEffect para auto-llenar datos del producto cuando cambian los datos de la plantilla
  useEffect(() => {
    if (crearProducto && form.nombre) {
      setDatosProducto(prev => ({
        ...prev,
        nombre: form.nombre,
        descripcion: `Producto basado en plantilla: ${form.nombre}`
      }));
    }
  }, [crearProducto, form.nombre]);

  // useEffect para sincronizar el precio del producto con el precio final de la plantilla
  useEffect(() => {
    if (crearProducto && precioFinalTotal > 0) {
      setDatosProducto(prev => ({
        ...prev,
        precio: Math.round(precioFinalTotal)
      }));
    }
  }, [crearProducto, precioFinalTotal]);

  // Funciones para manejar agregar/quitar items por categoría
  const addItem = useCallback((categoria) => {
    const newItem = createEmptyItem();
    if (categoria === "herreria") {
      setHerreria((prev) => [...prev, newItem]);
    } else if (categoria === "carpinteria") {
      setCarpinteria((prev) => [...prev, newItem]);
    } else if (categoria === "pintura") {
      setPintura((prev) => [...prev, newItem]);
    } else if (categoria === "otros") {
      setOtros((prev) => [...prev, newItem]);
    }
  }, []);

  const removeItem = (categoria, index) => {
    if (categoria === "herreria" && herreria.length > 1) {
      setHerreria(herreria.filter((_, i) => i !== index));
    } else if (categoria === "carpinteria" && carpinteria.length > 1) {
      setCarpinteria(carpinteria.filter((_, i) => i !== index));
    } else if (categoria === "pintura" && pintura.length > 1) {
      setPintura(pintura.filter((_, i) => i !== index));
    } else if (categoria === "otros" && otros.length > 1) {
      setOtros(otros.filter((_, i) => i !== index));
    }
  };

  // Funciones utilitarias (deben ir antes de handleItemChange)
  const getEspesorOptions = useCallback(
    (categoriaSeleccionada, tipoSeleccionado, medidaSeleccionada) => {
      if (!categoriaSeleccionada || !tipoSeleccionado || !medidaSeleccionada)
        return [];
      const espesores = [
        ...new Set(
          rawsMaterialData
            .filter(
              (mp) =>
                mp.categoria === categoriaSeleccionada &&
                mp.type === tipoSeleccionado &&
                mp.medida === medidaSeleccionada
            )
            .map((mp) => mp.espesor)
            .filter(Boolean)
        ),
      ];
      return espesores.sort();
    },
    [rawsMaterialData]
  );

  const getMaterialMatch = useCallback(
    (
      categoriaSeleccionada,
      tipoSeleccionado,
      medidaSeleccionada,
      espesorSeleccionado
    ) => {
      if (!categoriaSeleccionada || !tipoSeleccionado || !medidaSeleccionada)
        return null;

      return (
        rawsMaterialData.find(
          (mp) =>
            mp.categoria === categoriaSeleccionada &&
            mp.type === tipoSeleccionado &&
            mp.medida === medidaSeleccionada &&
            (espesorSeleccionado
              ? mp.espesor === espesorSeleccionado
              : !mp.espesor || mp.espesor === "")
        ) || null
      );
    },
    [rawsMaterialData]
  );

  // Función optimizada para manejar cambios en items específicos
  const handleItemChange = useCallback(
    (categoria, index, field, value) => {
      const stateMap = {
        herreria: [herreria, setHerreria],
        carpinteria: [carpinteria, setCarpinteria],
        pintura: [pintura, setPintura],
        otros: [otros, setOtros],
      };

      const entry = stateMap[categoria];
      if (!entry) return;

      const [items, setter] = entry;
      const newItems = [...items];
      const currentItem = newItems[index] ? { ...newItems[index] } : null;
      if (!currentItem) return;

      const saveItem = (nextItem) => {
        newItems[index] = nextItem;
        setter(newItems);
      };

      if (field === "isCustomMaterial") {
        const isCustom = Boolean(value);
        const nextItem = {
          ...currentItem,
          isCustomMaterial: isCustom,
          isPriceAuto: false,
        };

        if (!isCustom) {
          nextItem.descripcionPersonalizada = "";
          nextItem.categoriaMP = "";
          nextItem.tipoMP = "";
          nextItem.medidaMP = "";
          nextItem.espesorMP = "";
          nextItem.valor = "";
          nextItem.nombreMadera = "";
          nextItem.selectedMaterialId = "";
        }

        saveItem(nextItem);
        return;
      }

      if (currentItem.isCustomMaterial) {
        const nextItem = { ...currentItem, isPriceAuto: false };
        if (field === "valor") {
          nextItem.valor = unformatCurrency(value);
        } else {
          nextItem[field] = value;
        }
        saveItem(nextItem);
        return;
      }

      const nextItem = { ...currentItem };

      if (field === "categoriaMP") {
        nextItem.categoriaMP = value;
        nextItem.tipoMP = "";
        nextItem.medidaMP = "";
        nextItem.espesorMP = "";
        nextItem.valor = "";
        nextItem.cantidad = "";
        nextItem.isPriceAuto = false;
        nextItem.nombreMadera = "";
        nextItem.selectedMaterialId = "";
        saveItem(nextItem);
        return;
      }

      if (field === "tipoMP") {
        nextItem.tipoMP = value;
        nextItem.medidaMP = "";
        nextItem.espesorMP = "";
        nextItem.valor = "";
        nextItem.cantidad = "";
        nextItem.isPriceAuto = false;
        nextItem.nombreMadera = "";
        nextItem.selectedMaterialId = "";
        saveItem(nextItem);
        return;
      }

      if (field === "medidaMP") {
        nextItem.medidaMP = value;
        nextItem.espesorMP = "";
        nextItem.valor = "";
        nextItem.isPriceAuto = false;
        nextItem.selectedMaterialId = "";

        const espesoresDisponibles = getEspesorOptions(
          nextItem.categoriaMP,
          nextItem.tipoMP,
          value
        );
        if (espesoresDisponibles.length === 0) {
          const material = getMaterialMatch(
            nextItem.categoriaMP,
            nextItem.tipoMP,
            value,
            null
          );
          if (material) {
            nextItem.valor = material.precio?.toString() || "";
            nextItem.isPriceAuto = true;
            nextItem.nombreMadera =
              material.nombreMadera?.trim() || nextItem.nombreMadera || "";
            nextItem.selectedMaterialId = material._id?.toString() || "";
          }
        }

        saveItem(nextItem);
        return;
      }

      if (field === "espesorMP") {
        nextItem.espesorMP = value;
        nextItem.isPriceAuto = false;
        nextItem.selectedMaterialId = "";
        const material = getMaterialMatch(
          nextItem.categoriaMP,
          nextItem.tipoMP,
          nextItem.medidaMP,
          value
        );
        if (material) {
          nextItem.valor = material.precio?.toString() || "";
          nextItem.isPriceAuto = true;
          nextItem.nombreMadera =
            material.nombreMadera?.trim() || nextItem.nombreMadera || "";
          nextItem.selectedMaterialId = material._id?.toString() || "";
        }
        saveItem(nextItem);
        return;
      }

      if (field === "selectedMaterialId") {
        nextItem.selectedMaterialId = value;
        const material = rawsMaterialData.find((mp) => mp._id === value);
        if (material) {
          nextItem.categoriaMP = material.categoria || nextItem.categoriaMP;
          nextItem.tipoMP = material.type || nextItem.tipoMP;
          nextItem.medidaMP = material.medida || "";
          nextItem.espesorMP = material.espesor || "";
          nextItem.valor = material.precio?.toString() || "";
          nextItem.isPriceAuto = true;
          if (categoria === "carpinteria") {
            nextItem.nombreMadera =
              material.nombreMadera?.trim() || nextItem.nombreMadera || "";
          }
        }
        saveItem(nextItem);
        return;
      }

      if (field === "valor") {
        nextItem.valor = unformatCurrency(value);
        nextItem.isPriceAuto = false;
        saveItem(nextItem);
        return;
      }

      nextItem[field] = value;
      saveItem(nextItem);
    },
    [
      herreria,
      carpinteria,
      pintura,
      otros,
      getEspesorOptions,
      getMaterialMatch,
      rawsMaterialData,
    ]
  );

  // Funciones para manejar la sección extras
  const handleExtrasChange = (field, type, value) => {
    if (type === "valor") {
      // Para valores, quitar formato antes de guardar
      const unformatted = unformatCurrency(value);
      setExtras({
        ...extras,
        [field]: {
          ...extras[field],
          [type]: unformatted,
        },
      });
    } else {
      setExtras({
        ...extras,
        [field]: {
          ...extras[field],
          [type]: value,
        },
      });
    }
  };

  const addCampoPersonalizado = () => {
    setExtras({
      ...extras,
      camposPersonalizados: [
        ...extras.camposPersonalizados,
        { nombre: "", valor: "", porcentaje: 0 },
      ],
    });
  };

  const removeCampoPersonalizado = (index) => {
    if (extras.camposPersonalizados.length > 0) {
      setExtras({
        ...extras,
        camposPersonalizados: extras.camposPersonalizados.filter(
          (_, i) => i !== index
        ),
      });
    }
  };

  const handleCampoPersonalizadoChange = (index, field, value) => {
    const newCampos = [...extras.camposPersonalizados];
    if (field === "valor") {
      // Para valores, aplicar formato de moneda
      const unformatted = unformatCurrency(value);
      newCampos[index][field] = unformatted;
    } else {
      newCampos[index][field] = value;
    }
    setExtras({
      ...extras,
      camposPersonalizados: newCampos,
    });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "nombre") {
      setForm({
        ...form,
        nombre: value,
      });
    } else if (name === "categoria") {
      setForm({
        ...form,
        [name]: value,
      });
    } else if (name.includes("porcentaje")) {
      const categoria = name.replace("porcentaje_", "");
      setForm({
        ...form,
        porcentajesPorCategoria: {
          ...form.porcentajesPorCategoria,
          [categoria]: parseFloat(value) || 0,
        },
      });
    } else if (name.includes("plataforma_")) {
      const plataforma = name.replace("plataforma_", "");
      const nuevaConfig = {
        ...porcentajesPlataformas,
        [plataforma]: parseFloat(value) || 0,
      };
      setPorcentajesPlataformas(nuevaConfig);
      // Guardar automáticamente en localStorage
      guardarConfiguracionPlataformas(nuevaConfig);
    }
  };

  // Optimizar función para manejar cambios en consumibles
  const handleConsumiblesChange = useCallback((categoria, value) => {
    const unformatted = unformatCurrency(value);
    setConsumibles((prev) => ({
      ...prev,
      [categoria]: unformatted,
    }));
  }, []);

  // Función para guardar configuración de plataformas en localStorage
  const guardarConfiguracionPlataformas = (nuevaConfig) => {
    if (typeof window === "undefined" || !window.localStorage) return;
    window.localStorage.setItem(
      PLATAFORMAS_CONFIG_STORAGE_KEY,
      JSON.stringify(nuevaConfig)
    );
  };

  // Función para resetear configuración de plataformas a valores originales
  const resetearConfiguracionPlataformas = () => {
    const valoresOriginales = buildDefaultPlataformasConfig();
    setPorcentajesPlataformas(valoresOriginales);
    guardarConfiguracionPlataformas(valoresOriginales);
    toast({
      title: "Configuración Reseteada",
      description: "Los porcentajes volvieron a los valores originales",
      status: "info",
      duration: 2000,
      isClosable: true,
    });
  };

  // Funciones para manejar tipo de proyecto
  const handleTipoProyectoChange = (e) => {
    const value = e.target.value;
    if (value === "personalizado") {
      setModoPersonalizado(true);
      setForm((prev) => ({ ...prev, tipoProyecto: "" })); // Limpiar el campo para que el input aparezca vacío
    } else {
      setModoPersonalizado(false);
      setForm((prev) => ({ ...prev, tipoProyecto: value }));
    }
  };

  const handleTipoProyectoPersonalizadoChange = (e) => {
    const value = e.target.value;
    setForm((prev) => ({ ...prev, tipoProyecto: value }));
  };

  const handleReset = () => {
    // Resetear formulario principal
    setForm({
      nombre: "",
      tipoProyecto: "",
      items: [],
      porcentajesPorCategoria: {
        herreria: 100,
        carpinteria: 100,
        pintura: 100,
        otros: 100,
      },
    });

    // Resetear modo personalizado
    setModoPersonalizado(false);

    // Resetear arrays de materiales
    setHerreria([createEmptyItem()]);
    setCarpinteria([createEmptyItem()]);
    setPintura([createEmptyItem()]);
    setOtros([createEmptyItem()]);

    // Resetear consumibles
    setConsumibles({
      herreria: "",
      carpinteria: "",
      pintura: "",
      otros: "",
    });

    // Resetear extras
    setExtras(createDefaultExtrasState());

    // Las configuraciones de plataformas NO se resetean
  };

  // Funciones auxiliares para obtener opciones en cascada
  const getCategoriaOptions = (categoriaSeccion) => {
    const categorias = [
      ...new Set((rawsMaterialData || []).map((mp) => mp.categoria).filter(Boolean)),
    ];

    const filtradas = categorias
      .filter((categoria) => shouldIncludeCategoria(categoriaSeccion, categoria))
      .sort((a, b) => a.localeCompare(b, "es", { sensitivity: "base" }));

    if (filtradas.length > 0) return filtradas;

    const includes = categoriaRules[categoriaSeccion]?.include;
    if (includes?.length) {
      return includes.map((value) => formatCategoriaLabel(value));
    }

    return categorias;
  };

  const getTipoOptions = (categoriaSeleccionada) => {
    if (!categoriaSeleccionada) return [];
    const tipoMap = new Map();
    rawsMaterialData
      .filter((mp) => mp.categoria === categoriaSeleccionada)
      .forEach((mp) => {
        if (!mp.type) return;
        if (!tipoMap.has(mp.type)) {
          tipoMap.set(mp.type, getMaterialTypeLabel(mp.type));
        }
      });
    return Array.from(tipoMap.entries())
      .map(([value, label]) => ({ value, label }))
      .sort((a, b) => a.label.localeCompare(b.label, "es", { sensitivity: "base" }));
  };

  const getMedidaOptions = (categoriaSeleccionada, tipoSeleccionado) => {
    if (!categoriaSeleccionada || !tipoSeleccionado) return [];
    const medidas = [
      ...new Set(
        rawsMaterialData
          .filter(
            (mp) =>
              mp.categoria === categoriaSeleccionada &&
              mp.type === tipoSeleccionado
          )
          .map((mp) => mp.medida)
          .filter(Boolean)
      ),
    ];
    return medidas.sort();
  };

  const getMaterialOptions = (categoriaSeleccionada, tipoSeleccionado) => {
    if (!categoriaSeleccionada || !tipoSeleccionado) return [];
    const categoriaNormalized = normalizeText(categoriaSeleccionada);
    const tipoNormalized = normalizeText(tipoSeleccionado);

    const options = rawsMaterialData
      .filter((mp) => {
        const categoriaMP = normalizeText(mp.categoria);
        const tipoMP = normalizeText(mp.type);
        return categoriaMP === categoriaNormalized && tipoMP === tipoNormalized;
      })
      .map((mp) => {
        const labelBase = mp.nombre || mp.type || "Material";
        const detalles = [mp.medida, mp.espesor].filter(Boolean).join(" - ");
        const label = detalles ? `${labelBase} (${detalles})` : labelBase;
        return {
          value: mp._id,
          label,
        };
      });

    return options.sort((a, b) =>
      a.label.localeCompare(b.label, "es", { sensitivity: "base" })
    );
  };

  const getNombreMaderaOptions = (categoriaSeleccionada, tipoSeleccionado) => {
    if (!categoriaSeleccionada || !tipoSeleccionado) return [];

    const categoriaNormalized = normalizeText(categoriaSeleccionada);
    const tipoNormalized = normalizeText(tipoSeleccionado);

    const nombres = [
      ...new Set(
        rawsMaterialData
          .filter((mp) => {
            const categoriaMP = normalizeText(mp.categoria);
            const tipoMP = normalizeText(mp.type);
            return (
              categoriaMP === categoriaNormalized &&
              tipoMP === tipoNormalized &&
              Boolean(mp.nombreMadera)
            );
          })
          .map((mp) => mp.nombreMadera?.trim())
          .filter(Boolean)
      ),
    ];

    return nombres.sort((a, b) =>
      a.localeCompare(b, "es", { sensitivity: "base" })
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Función para encontrar el ObjectId real de la materia prima
    const encontrarMateriaPrimaId = (
      categoriaMP,
      tipoMP,
      medidaMP,
      espesorMP
    ) => {
      const material = rawsMaterialData.find(
        (mp) =>
          mp.categoria === categoriaMP &&
          mp.type === tipoMP &&
          mp.medida === medidaMP &&
          (espesorMP
            ? mp.espesor === espesorMP
            : !mp.espesor || mp.espesor === "")
      );

      return material ? material._id : null;
    };

    // Función para limpiar y validar un item
    const limpiarItem = (item, categoria) => {
      const cantidad = parseFloat(item.cantidad) || 0;
      if (cantidad <= 0) return null;

      if (item.isCustomMaterial) {
        const valorPersonalizado = parseFloat(item.valor) || 0;
        if (valorPersonalizado <= 0) return null;

        const descripcion =
          item.descripcionPersonalizada?.trim() ||
          [
            item.categoriaMP,
            item.tipoMP,
            item.nombreMadera,
            item.medidaMP,
            item.espesorMP,
          ]
            .filter(Boolean)
            .join(" - ");

        if (!descripcion) return null;

        return {
          categoria,
          cantidad,
          valor: valorPersonalizado,
          esPersonalizado: true,
          descripcionPersonalizada: descripcion,
          categoriaMP:
            item.categoriaMP || seccionLabels[categoria] || formatCategoriaLabel(categoria),
          tipoMP: item.tipoMP || "",
          medidaMP: item.medidaMP || "",
          espesorMP: item.espesorMP || "",
          nombreMadera: item.nombreMadera || "",
        };
      }

      if (
        !item.categoriaMP ||
        !item.tipoMP ||
        !item.medidaMP
      ) {
        return null;
      }

      const materiaPrimaId = encontrarMateriaPrimaId(
        item.categoriaMP,
        item.tipoMP,
        item.medidaMP,
        item.espesorMP
      );

      if (!materiaPrimaId) {
        return null;
      }

      return {
        categoria,
        materiaPrima: materiaPrimaId,
        cantidad,
        valor: parseFloat(item.valor) || 0,
        categoriaMP: item.categoriaMP || "",
        tipoMP: item.tipoMP || "",
        medidaMP: item.medidaMP || "",
        espesorMP: item.espesorMP || "",
        nombreMadera: item.nombreMadera || "",
      };
    };

    const mapItemsByCategoria = (items, categoria) =>
      items.map((item) => limpiarItem(item, categoria)).filter(Boolean);

    // Combinar todos los items con su categoría
    const allItems = [
      ...mapItemsByCategoria(herreria, "herreria"),
      ...mapItemsByCategoria(carpinteria, "carpinteria"),
      ...mapItemsByCategoria(pintura, "pintura"),
      ...mapItemsByCategoria(otros, "otros"),
    ];

    // Validar que hay datos mínimos
    if (!form.nombre.trim()) {
      toast({
        title: "Error",
        description: "El nombre de la plantilla es requerido",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    if (!form.tipoProyecto || form.tipoProyecto.trim() === "") {
      toast({
        title: "Error",
        description: "El tipo de proyecto es requerido",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    if (allItems.length === 0) {
      toast({
        title: "Error",
        description: "Debe agregar al menos un material",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    // Limpiar datos de consumibles (convertir a números)
    const consumiblesLimpios = {
      herreria: parseFloat(consumibles.herreria) || 0,
      carpinteria: parseFloat(consumibles.carpinteria) || 0,
      pintura: parseFloat(consumibles.pintura) || 0,
      otros: parseFloat(consumibles.otros) || 0,
    };

    // Limpiar porcentajes (asegurar que sean números)
    const porcentajesLimpios = {
      herreria: parseFloat(form.porcentajesPorCategoria.herreria) || 0,
      carpinteria: parseFloat(form.porcentajesPorCategoria.carpinteria) || 0,
      pintura: parseFloat(form.porcentajesPorCategoria.pintura) || 0,
      otros: parseFloat(form.porcentajesPorCategoria.otros) || 0,
    };

    const parseNumberInput = (value) => {
      const parsed = parseFloat(value);
      return Number.isFinite(parsed) ? parsed : 0;
    };

    const extrasPayload = {
      creditoCamioneta: {
        valor: parseNumberInput(extras.creditoCamioneta?.valor),
        porcentaje: parseNumberInput(extras.creditoCamioneta?.porcentaje),
      },
      envio: {
        valor: parseNumberInput(extras.envio?.valor),
        porcentaje: parseNumberInput(extras.envio?.porcentaje),
      },
      camposPersonalizados: (extras.camposPersonalizados || [])
        .map((campo) => ({
          nombre: campo.nombre?.trim() || "",
          valor: parseNumberInput(campo.valor),
          porcentaje: parseNumberInput(campo.porcentaje),
        }))
        .filter((campo) => campo.nombre || campo.valor > 0),
    };

    // Construir objeto con la estructura exacta que espera el backend
    const plantillaData = {
      nombre: form.nombre.trim(),
      tipoProyecto: form.tipoProyecto?.trim() || "Otro",
      items: allItems, // Array de items con ObjectIds de materiaPrima
      porcentajesPorCategoria: porcentajesLimpios,
      consumibles: consumiblesLimpios,
      extras: extrasPayload,
      tags: [], // Agregar tags vacío por defecto
    };

    // Remover cualquier campo undefined o null
    Object.keys(plantillaData).forEach((key) => {
      if (plantillaData[key] === undefined || plantillaData[key] === null) {
        delete plantillaData[key];
      }
    });

    let ok;
    try {
      if (PlantillasId) {
        ok = await updatePlantilla(PlantillasId, plantillaData, false);
      } else {
        // console.log('=== CREANDO NUEVA PLANTILLA ===', plantillaData.nombre);
        ok = await addPlantilla(plantillaData);
      }
    } catch (error) {
      console.error("=== ERROR COMPLETO ===");
      console.error("Error:", error);
                  nombreMadera: item.nombreMadera || "",
      console.error("Response:", error.response);
      console.error("Response data:", error.response?.data);
      console.error("Status:", error.response?.status);
      ok = false;
    }

    if (ok) {
      // Refrescar la lista de tipos de proyecto para que aparezcan los nuevos tipos
      refetchTipos();

      const plantillaGuardadaId =
        PlantillasId ||
        ok?._id ||
        ok?.id ||
        ok?.plantilla?._id ||
        ok?.data?._id ||
        null;

      const plantillaEsNueva = !PlantillasId;

      const mostrarToastPlantilla = () => {
        toast({
          title: PlantillasId ? "Plantilla Actualizada" : "Plantilla Agregada",
          description: PlantillasId
            ? "La plantilla se actualizó correctamente"
            : "La plantilla se cargó con éxito",
          status: "success",
          duration: 2000,
          isClosable: true,
        });
      };

      const intentarCrearProducto = async () => {
        if (!datosProducto.nombre.trim() || !datosProducto.catalogo.trim() || !datosProducto.modelo.trim()) {
          toast({
            title: plantillaEsNueva ? "Plantilla creada" : "Plantilla actualizada",
            description:
              "Completá nombre, catálogo y modelo del producto para generarlo automáticamente.",
            status: "warning",
            duration: 3000,
            isClosable: true,
          });
          return false;
        }

        if (!plantillaGuardadaId) {
          toast({
            title: "No se pudo asociar la plantilla",
            description: "Guardá nuevamente y vuelve a intentar crear el producto.",
            status: "warning",
            duration: 3000,
            isClosable: true,
          });
          return false;
        }

        try {
          const productoData = {
            nombre: datosProducto.nombre.trim(),
            catalogo: datosProducto.catalogo.trim(),
            modelo: datosProducto.modelo.trim(),
            descripcion:
              datosProducto.descripcion.trim() || `Producto basado en plantilla: ${form.nombre}`,
            stock: parseInt(datosProducto.stock) || 0,
            precio: Math.round(precioFinalTotal),
            planillaCosto: plantillaGuardadaId,
          };

          const productoResult = await addProduct(productoData);

          if (productoResult) {
            toast({
              title: plantillaEsNueva
                ? "Plantilla y producto creados"
                : "Producto generado desde la plantilla",
              description: plantillaEsNueva
                ? "Todo listo: ya tenés el producto listado en catálogo"
                : "Se creó un producto nuevo basado en esta plantilla",
              status: "success",
              duration: 3000,
              isClosable: true,
            });
            return true;
          }

          toast({
            title: plantillaEsNueva ? "Plantilla creada" : "Plantilla actualizada",
            description: "La plantilla se guardó, pero hubo un problema al crear el producto.",
            status: "warning",
            duration: 3000,
            isClosable: true,
          });
          return false;
        } catch (error) {
          console.error("Error al crear producto:", error);
          toast({
            title: plantillaEsNueva ? "Plantilla creada" : "Plantilla actualizada",
            description: "La plantilla se guardó correctamente, pero falló la creación del producto.",
            status: "warning",
            duration: 3000,
            isClosable: true,
          });
          return false;
        }
      };

      const productoCreado = crearProducto ? await intentarCrearProducto() : false;

      if (!productoCreado && (!crearProducto || PlantillasId)) {
        mostrarToastPlantilla();
      }

      setTimeout(() => {
        navigate("/plantillas");
      }, 1000);
    } else {
      toast({
        title: "Error",
        description: addError || updateError,
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  };

  // Función para renderizar una sección de categoría
  const renderCategorySection = (
    categoria,
    items,
    color,
    subtotal,
    precioFinal
  ) => (
    <Card>
      <CardHeader>
        <HStack justify="space-between">
          <Heading size="md" color={color} textTransform="uppercase">
            {seccionLabels[categoria] || categoria}
          </Heading>
          <Button
            leftIcon={<FiPlus />}
            colorScheme={color.split(".")[0]}
            size="sm"
            onClick={() => addItem(categoria)}
          >
            Agregar Material
          </Button>
        </HStack>
      </CardHeader>

      <CardBody>
        <VStack spacing={4} align="stretch">
          {items.map((item, index) => {
              const isCarpinteria = categoria === "carpinteria";
              const isPintura = categoria === "pintura";
              const isHerreria = categoria === "herreria";
              const isOtros = categoria === "otros";
              const showSubtotalColumn = isCarpinteria || isPintura || isHerreria || isOtros;
              const fieldSize = "md";
              const labelFontSize = "sm";
              const baseColumns = showSubtotalColumn ? 8 : 6;
              const totalColumns =
                isPintura && !item.isCustomMaterial ? baseColumns + 1 : baseColumns;
              const mdColumns = Math.min(totalColumns, 3);
              const gridTemplateColumns = {
                base: "repeat(1, minmax(0, 1fr))",
                md: `repeat(${mdColumns}, minmax(0, 1fr))`,
                lg: `repeat(${totalColumns}, minmax(0, 1fr))`,
              };
              const valorColumnStart = {
                base: "auto",
                md: mdColumns,
                lg: showSubtotalColumn ? totalColumns - 1 : totalColumns,
              };
            const matchedMaterial =
              isCarpinteria && !item.isCustomMaterial
                ? getMaterialMatch(
                    item.categoriaMP,
                    item.tipoMP,
                    item.medidaMP,
                    item.espesorMP || null
                  )
                : null;
            const rawNombreMadera = isCarpinteria
              ? item.isCustomMaterial
                ? item.nombreMadera
                : item.nombreMadera || matchedMaterial?.nombreMadera || ""
              : "";
            const nombreMaderaValue = isCarpinteria
              ? rawNombreMadera?.trim() || ""
              : "";
              const materialOptions =
                isPintura && !item.isCustomMaterial
                  ? getMaterialOptions(item.categoriaMP, item.tipoMP)
                  : [];
              const nombreMaterialColSpan =
                isPintura && !item.isCustomMaterial
                  ? { base: 1, md: 2, lg: 3 }
                  : 1;
              const cantidadFieldProps =
                isPintura && !item.isCustomMaterial
                  ? {
                      maxW: { base: "100%", lg: "140px" },
                      justifySelf: { base: "stretch", lg: "center" },
                    }
                  : {};
            const valorNumerico = parseFloat(item.valor) || 0;
            const cantidadNumerica = parseFloat(item.cantidad) || 0;
            const subtotalMaterial = valorNumerico * cantidadNumerica;

            return (
              <Box
                key={index}
                p={3}
                border="1px"
                borderColor="gray.200"
                borderRadius="md"
                w="100%"
              >
                <VStack spacing={3} align="stretch">
                  <HStack justify="space-between" align="center">
                    <Text fontSize="sm" fontWeight="semibold">
                      Material {index + 1}
                    </Text>
                    <HStack spacing={3} align="center">
                      <Checkbox
                        size="sm"
                        colorScheme="purple"
                        isChecked={item.isCustomMaterial}
                        onChange={(e) =>
                          handleItemChange(
                            categoria,
                            index,
                            "isCustomMaterial",
                            e.target.checked
                          )
                        }
                      >
                        Fuera de catálogo
                      </Checkbox>
                      <IconButton
                        icon={<FiMinus />}
                        colorScheme="red"
                        size="sm"
                        onClick={() => removeItem(categoria, index)}
                        isDisabled={items.length === 1}
                        aria-label="Eliminar material"
                      />
                    </HStack>
                  </HStack>

                  <Grid
                    templateColumns={gridTemplateColumns}
                    gap={3}
                    w="100%"
                    alignItems="end"
                  >
                    <GridItem minW="0">
                      <FormControl>
                        <FormLabel fontSize={labelFontSize}>Categoría</FormLabel>
                        {item.isCustomMaterial ? (
                          <Input
                            size={fieldSize}
                            placeholder="Ej: Vidrio"
                            value={item.categoriaMP}
                            onChange={(e) =>
                              handleItemChange(
                                categoria,
                                index,
                                "categoriaMP",
                                e.target.value
                              )
                            }
                          />
                        ) : (
                          <Select
                            size={fieldSize}
                            placeholder="Categoría"
                            value={item.categoriaMP}
                            onChange={(e) =>
                              handleItemChange(
                                categoria,
                                index,
                                "categoriaMP",
                                e.target.value
                              )
                            }
                          >
                            {getCategoriaOptions(categoria).map((cat) => (
                              <option key={cat} value={cat}>
                                {cat.toUpperCase()}
                              </option>
                            ))}
                          </Select>
                        )}
                      </FormControl>
                    </GridItem>

                    <GridItem minW="0">
                      <FormControl>
                        <FormLabel fontSize={labelFontSize}>Tipo</FormLabel>
                        {item.isCustomMaterial ? (
                          <Input
                            size={fieldSize}
                            placeholder="Ej: Perfil T"
                            value={item.tipoMP}
                            onChange={(e) =>
                              handleItemChange(
                                categoria,
                                index,
                                "tipoMP",
                                e.target.value
                              )
                            }
                          />
                        ) : (
                          <Select
                            size={fieldSize}
                            placeholder="Tipo"
                            value={item.tipoMP}
                            isDisabled={!item.categoriaMP}
                            onChange={(e) =>
                              handleItemChange(
                                categoria,
                                index,
                                "tipoMP",
                                e.target.value
                              )
                            }
                          >
                            {getTipoOptions(item.categoriaMP).map((tipo) => (
                              <option key={tipo.value} value={tipo.value}>
                                {tipo.label}
                              </option>
                            ))}
                          </Select>
                        )}
                      </FormControl>
                    </GridItem>

                    {isCarpinteria && (
                      <GridItem minW="0">
                        <FormControl>
                          <FormLabel fontSize={labelFontSize}>Nombre de la madera</FormLabel>
                          {item.isCustomMaterial ? (
                            <Input
                              size={fieldSize}
                              placeholder="Ej: Paraíso, Petiribí"
                              value={nombreMaderaValue}
                              onChange={(e) =>
                                handleItemChange(
                                  categoria,
                                  index,
                                  "nombreMadera",
                                  e.target.value
                                )
                              }
                            />
                          ) : (
                            <Select
                              size={fieldSize}
                              placeholder={
                                item.tipoMP
                                  ? "Seleccioná un nombre"
                                  : "Elegí primero el tipo"
                              }
                              value={nombreMaderaValue}
                              isDisabled={!item.tipoMP}
                              onChange={(e) =>
                                handleItemChange(
                                  categoria,
                                  index,
                                  "nombreMadera",
                                  e.target.value
                                )
                              }
                            >
                              {getNombreMaderaOptions(
                                item.categoriaMP,
                                item.tipoMP
                              ).map((nombre) => (
                                <option key={nombre} value={nombre}>
                                  {nombre}
                                </option>
                              ))}
                            </Select>
                          )}
                        </FormControl>
                      </GridItem>
                    )}

                    <GridItem minW="0">
                      <FormControl>
                        <FormLabel fontSize={labelFontSize}>Medida</FormLabel>
                        {item.isCustomMaterial ? (
                          <Input
                            size={fieldSize}
                            placeholder="Ej: 2 x 1 mt"
                            value={item.medidaMP}
                            onChange={(e) =>
                              handleItemChange(
                                categoria,
                                index,
                                "medidaMP",
                                e.target.value
                              )
                            }
                          />
                        ) : (
                          <Select
                            size={fieldSize}
                            placeholder="Medida"
                            value={item.medidaMP}
                            isDisabled={!item.tipoMP}
                            onChange={(e) =>
                              handleItemChange(
                                categoria,
                                index,
                                "medidaMP",
                                e.target.value
                              )
                            }
                          >
                            {getMedidaOptions(item.categoriaMP, item.tipoMP).map(
                              (medida) => (
                                <option key={medida} value={medida}>
                                  {medida}
                                </option>
                              )
                            )}
                          </Select>
                        )}
                      </FormControl>
                    </GridItem>

                    <GridItem minW="0" colSpan={nombreMaterialColSpan}>
                      <FormControl>
                        <FormLabel fontSize={labelFontSize}>
                          {isPintura && !item.isCustomMaterial
                            ? "Nombre del material"
                            : "Espesor"}
                        </FormLabel>
                        {item.isCustomMaterial ? (
                          <Input
                            size={fieldSize}
                            placeholder={
                              isPintura ? "Ej: Base poliuretánica" : "Ej: 1.6 mm"
                            }
                            value={item.espesorMP}
                            onChange={(e) =>
                              handleItemChange(
                                categoria,
                                index,
                                "espesorMP",
                                e.target.value
                              )
                            }
                          />
                        ) : isPintura ? (
                          <Select
                            size={fieldSize}
                            placeholder={
                              item.tipoMP
                                ? "Seleccioná un material"
                                : "Elegí primero el tipo"
                            }
                            value={item.selectedMaterialId || ""}
                            isDisabled={!item.tipoMP}
                            onChange={(e) =>
                              handleItemChange(
                                categoria,
                                index,
                                "selectedMaterialId",
                                e.target.value
                              )
                            }
                          >
                            {materialOptions.map((option) => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </Select>
                        ) : (
                          <Select
                            size={fieldSize}
                            placeholder="Espesor"
                            value={item.espesorMP}
                            isDisabled={!item.medidaMP}
                            onChange={(e) =>
                              handleItemChange(
                                categoria,
                                index,
                                "espesorMP",
                                e.target.value
                              )
                            }
                          >
                            {getEspesorOptions(
                              item.categoriaMP,
                              item.tipoMP,
                              item.medidaMP
                            ).map((espesor) => (
                              <option key={espesor} value={espesor}>
                                {espesor}
                              </option>
                            ))}
                          </Select>
                        )}
                      </FormControl>
                    </GridItem>

                    <GridItem minW="0" {...cantidadFieldProps}>
                      <FormControl>
                        <FormLabel fontSize={labelFontSize}>Cantidad</FormLabel>
                        <Input
                          size={fieldSize}
                          type="number"
                          placeholder="0"
                          value={item.cantidad}
                          onChange={(e) =>
                            handleItemChange(
                              categoria,
                              index,
                              "cantidad",
                              e.target.value
                            )
                          }
                        />
                      </FormControl>
                    </GridItem>

                    <GridItem
                      minW="0"
                      colStart={valorColumnStart}
                      justifySelf={{ base: "stretch", lg: "end" }}
                    >
                      <FormControl>
                        <FormLabel fontSize={labelFontSize}>
                          Valor
                          {item.isPriceAuto && !item.isCustomMaterial && (
                            <Text as="span" color="green.500" fontSize="xs" ml={1}>
                              (Auto)
                            </Text>
                          )}
                        </FormLabel>
                        <Input
                          size={fieldSize}
                          type="text"
                          placeholder="$1.000"
                          value={formatCurrency(item.valor)}
                          borderColor={
                            item.isPriceAuto && !item.isCustomMaterial
                              ? "green.300"
                              : undefined
                          }
                          _focus={{
                            borderColor:
                              item.isPriceAuto && !item.isCustomMaterial
                                ? "green.400"
                                : "blue.400",
                            boxShadow:
                              item.isPriceAuto && !item.isCustomMaterial
                                ? "0 0 0 1px var(--chakra-colors-green-400)"
                                : "0 0 0 1px var(--chakra-colors-blue-400)",
                          }}
                          bg={
                            item.isPriceAuto && !item.isCustomMaterial
                              ? { base: "green.50", _dark: "green.900" }
                              : undefined
                          }
                          onChange={(e) =>
                            handleItemChange(
                              categoria,
                              index,
                              "valor",
                              e.target.value
                            )
                          }
                        />
                      </FormControl>
                    </GridItem>

                    {showSubtotalColumn && (
                      <GridItem minW="0">
                        <FormControl isReadOnly>
                          <FormLabel fontSize={labelFontSize}>Sub-total</FormLabel>
                          <Input
                            size={fieldSize}
                            type="text"
                            value={formatCurrency(subtotalMaterial)}
                            placeholder="$0"
                            readOnly
                          />
                        </FormControl>
                      </GridItem>
                    )}
                  </Grid>

                {item.isCustomMaterial && (
                  <FormControl>
                    <FormLabel fontSize={labelFontSize}>Descripción del material</FormLabel>
                    <Input
                      size={fieldSize}
                      placeholder="Ej: Vidrio templado importado"
                      value={item.descripcionPersonalizada}
                      onChange={(e) =>
                        handleItemChange(
                          categoria,
                          index,
                          "descripcionPersonalizada",
                          e.target.value
                        )
                      }
                    />
                  </FormControl>
                )}
              </VStack>
            </Box>
            );
          })}

          {/* Campos de consumibles y porcentaje en la misma fila */}
          <HStack spacing={4} align="end">
            <FormControl flex="2">
              <FormLabel>Consumibles</FormLabel>
              <Input
                type="text"
                placeholder="$0"
                value={formatCurrency(consumibles[categoria])}
                onChange={(e) =>
                  handleConsumiblesChange(categoria, e.target.value)
                }
              />
            </FormControl>

            <FormControl flex="1">
              <FormLabel>Porcentaje de Ganancia (%)</FormLabel>
              <Input
                type="number"
                name={`porcentaje_${categoria}`}
                value={form.porcentajesPorCategoria[categoria]}
                onChange={handleChange}
                placeholder="Ej: 50"
              />
            </FormControl>
          </HStack>

          {/* Subtotal de la categoría */}
          <Box
            p={4}
            bg={subtotalBg}
            borderRadius="md"
            borderLeft="4px"
            borderLeftColor={color}
          >
            <VStack spacing={2} align="stretch">
              <HStack justify="space-between">
                <Text fontSize="sm">Materiales:</Text>
                <Text fontSize="sm">{formatPrice(calcularSubtotal(items))}</Text>
              </HStack>
              <HStack justify="space-between">
                <Text fontSize="sm">Consumibles:</Text>
                <Text fontSize="sm">
                  {formatPrice(parseFloat(consumibles[categoria] || 0))}
                </Text>
              </HStack>
              <Divider />
              <HStack justify="space-between">
                <Text fontWeight="bold">Costo Total:</Text>
                <Badge colorScheme="blue" fontSize="md" p={2}>
                  {formatPrice(subtotal)}
                </Badge>
              </HStack>
              <HStack justify="space-between">
                <Text fontWeight="bold">Precio con Ganancia:</Text>
                <Badge colorScheme="green" fontSize="md" p={2}>
                  {formatPrice(precioFinal)}
                </Badge>
              </HStack>
              <HStack justify="space-between">
                <Text fontWeight="bold" color="orange.600">
                  Ganancia:
                </Text>
                <Badge colorScheme="orange" fontSize="md" p={2}>
                  {formatPrice(precioFinal - subtotal)}
                </Badge>
              </HStack>
            </VStack>
          </Box>
        </VStack>
      </CardBody>
    </Card>
  );

  return (
    <Box maxW="7xl" w="100%" mx="auto" p={6}>
      <form onSubmit={handleSubmit}>
        <VStack spacing={8} align="stretch">
          {/* Botón de Reset */}
          <HStack justify="space-between" align="center">
            <Heading
              size="lg"
              color={useColorModeValue("gray.700", "gray.200")}
            >
              {PlantillasId ? "Editar Planilla Presupuesto" : "Nueva Planilla Presupuesto"}
            </Heading>
            <Button
              leftIcon={<FiRefreshCw />}
              colorScheme="red"
              variant="outline"
              size="md"
              onClick={handleReset}
              _hover={{
                bg: "red.50",
                borderColor: "red.400",
                transform: "scale(1.05)",
              }}
              transition="all 0.2s"
            >
              Limpiar Todo
            </Button>
          </HStack>

          <Divider />

          {/* Nombre de la planilla */}
          <FormControl>
            <FormLabel fontSize="lg" fontWeight="bold">
              Nombre de la Planilla
            </FormLabel>
            <Input
              name="nombre"
              type="text"
              placeholder="Ej: Mesa de comedor"
              value={form.nombre}
              onChange={handleChange}
              size="lg"
              required
            />
          </FormControl>

          {/* Tipo de Proyecto */}
          <FormControl>
            <FormLabel fontSize="md" fontWeight="medium">
              Tipo de Proyecto
            </FormLabel>
            <VStack spacing={3} align="stretch">
              <Select
                name="tipoProyecto"
                placeholder="Seleccionar tipo de proyecto"
                value={
                  modoPersonalizado 
                    ? "personalizado"
                    : form.tipoProyecto &&
                      tiposProyectoOptions.some(
                        (opt) => opt.value === form.tipoProyecto
                      )
                    ? form.tipoProyecto
                    : ""
                }
                onChange={handleTipoProyectoChange}
              >
                {tiposProyectoOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
                <option value="personalizado">Otro (personalizado)</option>
              </Select>

              {/* Input condicional para tipo personalizado */}
              {modoPersonalizado && (
                <Input
                  name="tipoProyectoPersonalizado"
                  placeholder="Escribir tipo de proyecto personalizado"
                  value={form.tipoProyecto}
                  onChange={handleTipoProyectoPersonalizadoChange}
                />
              )}
            </VStack>
          </FormControl>

          <Divider />

          {/* Sección de Creación de Producto */}
          <FormControl>
            <VStack spacing={4} align="stretch">
              <Checkbox
                isChecked={crearProducto}
                onChange={(e) => setCrearProducto(e.target.checked)}
                colorScheme="blue"
                size="lg"
              >
                <Text fontWeight="semibold" color="blue.600">
                  Crear producto basado en esta plantilla
                </Text>
              </Checkbox>

              {crearProducto && (
                <Box
                  p={4}
                  bg={productoBg}
                  borderRadius="md"
                  borderWidth="1px"
                  borderColor={productoBorder}
                >
                  <VStack spacing={4} align="stretch">
                    <Text fontSize="sm" fontWeight="medium" color="blue.700">
                      Datos del Producto
                    </Text>
                    
                    <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                      <FormControl isRequired>
                        <FormLabel fontSize="sm">Nombre del Producto</FormLabel>
                        <Input
                          placeholder="Nombre del producto"
                          value={datosProducto.nombre}
                          onChange={(e) =>
                            setDatosProducto(prev => ({
                              ...prev,
                              nombre: e.target.value
                            }))
                          }
                          bg={inputBg}
                        />
                      </FormControl>

                      <FormControl isRequired>
                        <FormLabel fontSize="sm">Catálogo</FormLabel>
                        <Input
                          placeholder="Catálogo del producto"
                          value={datosProducto.catalogo}
                          onChange={(e) =>
                            setDatosProducto(prev => ({
                              ...prev,
                              catalogo: e.target.value
                            }))
                          }
                          bg={inputBg}
                        />
                      </FormControl>

                      <FormControl isRequired>
                        <FormLabel fontSize="sm">Modelo</FormLabel>
                        <Input
                          placeholder="Modelo del producto"
                          value={datosProducto.modelo}
                          onChange={(e) =>
                            setDatosProducto(prev => ({
                              ...prev,
                              modelo: e.target.value
                            }))
                          }
                          bg={inputBg}
                        />
                      </FormControl>

                      <FormControl isRequired>
                        <FormLabel fontSize="sm">Stock</FormLabel>
                        <NumberInput
                          min={0}
                          value={datosProducto.stock}
                          onChange={(value) =>
                            setDatosProducto(prev => ({
                              ...prev,
                              stock: parseInt(value) || 0
                            }))
                          }
                        >
                          <NumberInputField
                            placeholder="Cantidad en stock"
                            bg={inputBg}
                          />
                          <NumberInputStepper>
                            <NumberIncrementStepper />
                            <NumberDecrementStepper />
                          </NumberInputStepper>
                        </NumberInput>
                      </FormControl>
                    </SimpleGrid>

                    <FormControl>
                      <FormLabel fontSize="sm">Descripción</FormLabel>
                      <Textarea
                        placeholder="Descripción del producto"
                        value={datosProducto.descripcion}
                        onChange={(e) =>
                          setDatosProducto(prev => ({
                            ...prev,
                            descripcion: e.target.value
                          }))
                        }
                        rows={3}
                        bg={inputBg}
                      />
                    </FormControl>

                    {precioFinalTotal > 0 && (
                      <Box
                        p={3}
                        bg={precioBg}
                        borderRadius="md"
                        borderWidth="1px"
                        borderColor={precioBorder}
                      >
                        <Text fontSize="sm" fontWeight="medium" color="green.700">
                          Precio sugerido: ${Math.round(precioFinalTotal).toLocaleString()}
                        </Text>
                        <Text fontSize="xs" color="green.600">
                          (Basado en el costo total de la plantilla)
                        </Text>
                      </Box>
                    )}
                  </VStack>
                </Box>
              )}
            </VStack>
          </FormControl>

          <Divider />

          {/* Secciones en columna */}
          <VStack spacing={6} align="stretch">
            {renderCategorySection(
              "herreria",
              herreria,
              "orange.400",
              subtotalHerreria,
              precioFinalHerreria
            )}
            {renderCategorySection(
              "carpinteria",
              carpinteria,
              "green.400",
              subtotalCarpinteria,
              precioFinalCarpinteria
            )}
            {renderCategorySection(
              "pintura",
              pintura,
              "blue.400",
              subtotalPintura,
              precioFinalPintura
            )}
            {renderCategorySection(
              "otros",
              otros,
              "purple.300",
              subtotalOtros,
              precioFinalOtros
            )}

            {/* Sección Extras */}
            <Card>
              <CardHeader>
                <HStack justify="space-between">
                  <Heading
                    size="md"
                    color="purple.400"
                    textTransform="uppercase"
                  >
                    extras
                  </Heading>
                  <Button
                    leftIcon={<FiPlus />}
                    colorScheme="purple"
                    size="sm"
                    onClick={addCampoPersonalizado}
                  >
                    Agregar Campo
                  </Button>
                </HStack>
              </CardHeader>

              <CardBody>
                <VStack spacing={4} align="stretch">
                  {/* Campos fijos */}
                  <VStack spacing={4} align="stretch">
                    {/* Crédito Camioneta */}
                    <Box>
                      <Text fontWeight="bold" mb={2}>
                        💳 Crédito Camioneta
                      </Text>
                      <HStack spacing={3}>
                        <FormControl flex="2">
                          <FormLabel fontSize="sm">Valor</FormLabel>
                          <Input
                            type="text"
                            placeholder="$25.000"
                            value={formatCurrency(
                              extras.creditoCamioneta.valor
                            )}
                            onChange={(e) =>
                              handleExtrasChange(
                                "creditoCamioneta",
                                "valor",
                                e.target.value
                              )
                            }
                          />
                        </FormControl>

                        <FormControl flex="1">
                          <FormLabel fontSize="sm">Ganancia (%)</FormLabel>
                          <Input
                            type="number"
                            placeholder="0"
                            value={extras.creditoCamioneta.porcentaje}
                            onChange={(e) =>
                              handleExtrasChange(
                                "creditoCamioneta",
                                "porcentaje",
                                e.target.value
                              )
                            }
                          />
                        </FormControl>

                        <Box flex="1" textAlign="right">
                          <Text fontSize="sm" color="gray.500">
                            Total
                          </Text>
                          <Badge colorScheme="purple" fontSize="sm">
                            {formatPrice(
                              parseFloat(extras.creditoCamioneta.valor || 0) *
                                (1 +
                                  parseFloat(
                                    extras.creditoCamioneta.porcentaje || 0
                                  ) /
                                    100)
                            )}
                          </Badge>
                        </Box>
                      </HStack>
                    </Box>

                    {/* Envío */}
                    <Box>
                      <Text fontWeight="bold" mb={2}>
                        📦 Envío
                      </Text>
                      <HStack spacing={3}>
                        <FormControl flex="2">
                          <FormLabel fontSize="sm">Valor</FormLabel>
                          <Input
                            type="text"
                            placeholder="$5.000"
                            value={formatCurrency(extras.envio.valor)}
                            onChange={(e) =>
                              handleExtrasChange(
                                "envio",
                                "valor",
                                e.target.value
                              )
                            }
                          />
                        </FormControl>

                        <FormControl flex="1">
                          <FormLabel fontSize="sm">Ganancia (%)</FormLabel>
                          <Input
                            type="number"
                            placeholder="0"
                            value={extras.envio.porcentaje}
                            onChange={(e) =>
                              handleExtrasChange(
                                "envio",
                                "porcentaje",
                                e.target.value
                              )
                            }
                          />
                        </FormControl>

                        <Box flex="1" textAlign="right">
                          <Text fontSize="sm" color="gray.500">
                            Total
                          </Text>
                          <Badge colorScheme="purple" fontSize="sm">
                            {formatPrice(
                              parseFloat(extras.envio.valor || 0) *
                                (1 +
                                  parseFloat(extras.envio.porcentaje || 0) /
                                    100)
                            )}
                          </Badge>
                        </Box>
                      </HStack>
                    </Box>
                  </VStack>

                  {/* Campos personalizados */}
                  {extras.camposPersonalizados.map((campo, index) => (
                    <Box key={index}>
                      <Text fontWeight="bold" mb={2}>
                        🏷️ {campo.nombre || `Campo ${index + 1}`}
                      </Text>
                      <HStack spacing={3}>
                        <FormControl flex="2">
                          <FormLabel fontSize="sm">Nombre</FormLabel>
                          <Input
                            type="text"
                            placeholder="Nombre del campo"
                            value={campo.nombre}
                            onChange={(e) =>
                              handleCampoPersonalizadoChange(
                                index,
                                "nombre",
                                e.target.value
                              )
                            }
                          />
                        </FormControl>

                        <FormControl flex="2">
                          <FormLabel fontSize="sm">Valor</FormLabel>
                          <Input
                            type="text"
                            placeholder="$10.000"
                            value={formatCurrency(campo.valor)}
                            onChange={(e) =>
                              handleCampoPersonalizadoChange(
                                index,
                                "valor",
                                e.target.value
                              )
                            }
                          />
                        </FormControl>

                        <FormControl flex="1">
                          <FormLabel fontSize="sm">Ganancia (%)</FormLabel>
                          <Input
                            type="number"
                            placeholder="0"
                            value={campo.porcentaje}
                            onChange={(e) =>
                              handleCampoPersonalizadoChange(
                                index,
                                "porcentaje",
                                e.target.value
                              )
                            }
                          />
                        </FormControl>

                        <Box flex="1" textAlign="right">
                          <Text fontSize="sm" color="gray.500">
                            Total
                          </Text>
                          <Badge colorScheme="purple" fontSize="sm">
                            {formatPrice(
                              parseFloat(campo.valor || 0) *
                                (1 + parseFloat(campo.porcentaje || 0) / 100)
                            )}
                          </Badge>
                        </Box>

                        <IconButton
                          icon={<FiMinus />}
                          colorScheme="red"
                          size="sm"
                          onClick={() => removeCampoPersonalizado(index)}
                        />
                      </HStack>
                    </Box>
                  ))}
                </VStack>
              </CardBody>
            </Card>
          </VStack>

          {/* Cuadro de totales generales */}
          <Card bg={cardBg} borderWidth="2px" borderColor={cardBorder}>
            <CardHeader>
              <Heading size="lg" color={titleColor} textAlign="center">
                📊 RESUMEN TOTAL
              </Heading>
            </CardHeader>
            <CardBody>
              <VStack spacing={4}>
                <HStack w="100%" justify="space-between" fontSize="xl">
                  <Text fontWeight="bold">Costo Total de Materiales:</Text>
                  <Badge colorScheme="blue" fontSize="xl" p={3}>
                    {formatPrice(costoTotal)}
                  </Badge>
                </HStack>

                <HStack w="100%" justify="space-between" fontSize="xl">
                  <Text fontWeight="bold" color="orange.600">
                    Ganancia Total:
                  </Text>
                  <Badge colorScheme="orange" fontSize="xl" p={3}>
                    {formatPrice(gananciaTotal)}
                  </Badge>
                </HStack>

                <HStack w="100%" justify="space-between" fontSize="xl">
                  <Text fontWeight="bold">Precio Final con Ganancia:</Text>
                  <Badge colorScheme="green" fontSize="xl" p={3}>
                    {formatPrice(precioFinalTotal)}
                  </Badge>
                </HStack>

                <Divider />

                {/* Configuración de Porcentajes de Plataformas */}
                <HStack justify="space-between" align="center">
                  <Text fontSize="lg" fontWeight="bold" color={titleColor}>
                    ⚙️ CONFIGURACIÓN DE PLATAFORMAS
                  </Text>
                  <Button
                    size="xs"
                    colorScheme="gray"
                    variant="outline"
                    onClick={resetearConfiguracionPlataformas}
                    title="Volver a valores originales"
                  >
                    🔄 Reset
                  </Button>
                </HStack>

                <SimpleGrid columns={{ base: 1, md: 2 }} spacing={1} w="75%">
                  <Box
                    borderWidth="1px"
                    borderRadius="lg"
                    borderColor={cardBorder}
                    bg={useColorModeValue("white", "gray.800")}
                    p={3}
                  >
                    <Text fontWeight="bold" fontSize="sm" mb={1} textAlign={"center"}>
                      Mercado Libre
                    </Text>
                    <VStack spacing={2} align="stretch">
                      <FormControl>
                        <FormLabel fontSize="xs">Cargo de Venta (%)</FormLabel>
                        <Input
                          name="plataforma_mercadoLibreBase"
                          type="number"
                          step="0.01"
                          value={porcentajesPlataformas.mercadoLibreBase ?? ""}
                          onChange={handleChange}
                          size="sm"
                          textAlign="center"
                          py={1}
                        />
                        <FormHelperText fontSize="xs" textAlign="center">
                          Comisión fija aplicada a todas las ventas
                        </FormHelperText>
                      </FormControl>

                      {MERCADO_LIBRE_PLANS.map((plan) => (
                        <FormControl key={plan.key}>
                          <FormLabel fontSize="xs">
                            {plan.helper || plan.label} (%)
                          </FormLabel>
                          <Input
                            name={`plataforma_${plan.key}`}
                            type="number"
                            step="0.01"
                            value={porcentajesPlataformas[plan.key] ?? ""}
                            onChange={handleChange}
                            size="sm"
                            textAlign="center"
                            py={1}
                          />
                          <FormHelperText fontSize="xs" textAlign={"center"}>
                            Cargo adicional del plan de cuotas
                          </FormHelperText>
                        </FormControl>
                      ))}
                    </VStack>
                  </Box>

                  <Box
                    borderWidth="1px"
                    borderRadius="lg"
                    borderColor={cardBorder}
                    bg={useColorModeValue("white", "gray.800")}
                    p={3}
                  >
                    <Text fontWeight="bold" fontSize="sm" mb={1} textAlign={"center"}>
                      Tienda Nube
                    </Text>
                    <VStack spacing={2} align="stretch">
                      <FormControl>
                        <FormLabel fontSize="xs">Cargo de Venta (%)</FormLabel>
                        <Input
                          name="plataforma_nubeVentaBase"
                          type="number"
                          step="0.01"
                          value={porcentajesPlataformas.nubeVentaBase ?? ""}
                          onChange={handleChange}
                          size="sm"
                          textAlign="center"
                          py={1}
                        />
                        <FormHelperText fontSize="xs" textAlign={"center"}>
                          Comisión base aplicada a cada venta
                        </FormHelperText>
                      </FormControl>

                      <FormControl>
                        <FormLabel fontSize="xs">Cargo por Cuotas (%)</FormLabel>
                        <Input
                          name="plataforma_nubeCuotasExtra"
                          type="number"
                          step="0.01"
                          value={porcentajesPlataformas.nubeCuotasExtra ?? ""}
                          onChange={handleChange}
                          size="sm"
                          textAlign="center"
                          py={1}
                        />
                        <FormHelperText fontSize="xs" textAlign={"center"}>
                          Recargo adicional cuando ofrecés cuotas
                        </FormHelperText>
                      </FormControl>
                    </VStack>
                  </Box>
                </SimpleGrid>

                <Divider />

                {/* Precios de Plataformas */}
                <Text
                  fontSize="lg"
                  fontWeight="bold"
                  color={titleColor}
                  textAlign="center"
                >
                  💰 PRECIOS POR PLATAFORMA
                </Text>

                {preciosMercadoLibre.map((plan) => (
                  <HStack
                    key={plan.key}
                    w="80%"
                    justify="space-between"
                    fontSize="lg"
                  >
                    <Text fontWeight="bold">
                      {plan.label} ({plan.comisionTotalPercent}%):
                    </Text>
                    <VStack spacing={0} align="flex-end">
                      <Badge
                        colorScheme={plan.badgeColor}
                        fontSize="lg"
                        p={2}
                      >
                        {formatPrice(plan.precio)}
                      </Badge>
                      <Text fontSize="xs" color={mutedTextColor}>
                        Base {plan.basePercent}% + Cuotas {plan.extraPercent}%
                      </Text>
                    </VStack>
                  </HStack>
                ))}

                <HStack w="80%" justify="space-between" fontSize="lg">
                  <Text fontWeight="bold">
                    🌟 Valor Nube (Base {nubeBasePercent}%):
                  </Text>
                  <Badge colorScheme="teal" fontSize="lg" p={2}>
                    {formatPrice(valorNube)}
                  </Badge>
                </HStack>

                <HStack w="80%" justify="space-between" fontSize="lg">
                  <VStack align="flex-start" spacing={0}>
                    <Text fontWeight="bold">
                      ☁️ Valor Nube Cuotas ({nubeCuotasTotalPercent}%):
                    </Text>
                    <Text fontSize="xs" color={mutedTextColor}>
                      Base {nubeBasePercent}% + Cuotas {nubeCuotasExtraPercent}%
                    </Text>
                  </VStack>
                  <Badge colorScheme="cyan" fontSize="lg" p={2}>
                    {formatPrice(valorNubeCuotas)}
                  </Badge>
                </HStack>
              </VStack>
            </CardBody>
          </Card>

          {/* Botón de envío */}
          <Button
            type="submit"
            colorScheme="teal"
            size="lg"
            isLoading={addLoading || updateLoading}
            loadingText={PlantillasId ? "Actualizando..." : "Creando..."}
          >
            {PlantillasId ? "Actualizar Plantilla" : "Crear Plantilla"}
          </Button>
        </VStack>
      </form>
    </Box>
  );
};
