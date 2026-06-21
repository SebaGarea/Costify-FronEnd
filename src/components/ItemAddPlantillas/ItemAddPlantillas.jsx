import { useEffect, useState, useCallback, useMemo, useRef } from "react";

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
import { usePlantillaPreview } from "../../hooks/plantillas/usePlantillaPreview.js";
import { useAddProduct } from "../../hooks/productos/useAddProduct.js";
import { useItems } from "../../hooks/productos/useItems.js";
import { usePerfilesPintura } from "../../hooks/perfilesPintura/usePerfilesPintura.js";
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
  Image,
  Link,
  SimpleGrid,
  Divider,
  Badge,
  Card,
  CardBody,
  CardHeader,
  useColorModeValue,
  Checkbox,
  Switch,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  Textarea,
} from "@chakra-ui/react";
import { FiPlus, FiMinus, FiRefreshCw } from "react-icons/fi";
import { useNavigate } from "react-router";
import {
  getPlantillaById,
  uploadArchivosPlantilla,
  deleteArchivoPlantilla,
} from "../../services/plantillas.service.js";
import { getMaterialTypeLabel } from "../../constants/materialTypes.js";
import {
  MERCADO_LIBRE_PLANS,
  getMercadoLibrePrices,
  getNubePrices,
} from "../../constants/platformPricing.js";
import { useConfiguracion } from "../../hooks/configuracion/useConfiguracion.js";

// Detecta si un adjunto es PDF (por mimetype o extensión).
const esArchivoPdf = (archivo) =>
  archivo?.mimetype === "application/pdf" || /\.pdf($|\?)/i.test(archivo?.url || "");

// Construye la URL de vista previa apoyándose en las transformaciones de Cloudinary.
// Para PDF pide la primera página renderizada a JPG (pg_1,f_jpg): como el resultado
// es una imagen y no un PDF, Cloudinary la entrega aunque la "entrega de PDF" esté
// deshabilitada en la cuenta. Para imágenes solo redimensiona.
const buildPreviewUrl = (archivo, width = 400) => {
  const url = archivo?.url || "";
  if (!url || !url.includes("/upload/")) return url;
  const transform = esArchivoPdf(archivo)
    ? `pg_1,f_jpg,w_${width},q_auto`
    : `w_${width},q_auto`;
  return url.replace("/upload/", `/upload/${transform}/`);
};

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
  gananciaIndividual: "",
  pinturaAlHorno: false,
  perfilPinturaId: "",
  perfilPinturaPerimetro: 0,
  costoPintura: 0,
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


const METROS_POR_UNIDAD = 6;

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

  // Porcentajes de plataformas desde configuración global
  const { config: configuracionGlobal } = useConfiguracion();
  const porcentajesPlataformas = configuracionGlobal.porcentajesPlataformas;

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
  const [precioPinturaM2, setPrecioPinturaM2] = useState(15000);
  const [precioPinturaPersonalizado, setPrecioPinturaPersonalizado] = useState(false);
  const [comentarios, setComentarios] = useState("");
  const [archivos, setArchivos] = useState([]);
  const [uploadingArchivos, setUploadingArchivos] = useState(false);
  const [deletingArchivoId, setDeletingArchivoId] = useState(null);

  const { perfiles: perfilesPintura } = usePerfilesPintura();

  const draftKey = `plantilla_draft_${PlantillasId || "new"}`;
  const isDraftLoaded = useRef(!PlantillasId);

  // Save form state to sessionStorage (safety net against tab-switch / browser reloads)
  useEffect(() => {
    if (!isDraftLoaded.current) return;
    const timer = setTimeout(() => {
      try {
        sessionStorage.setItem(
          draftKey,
          JSON.stringify({ form, herreria, carpinteria, pintura, otros, consumibles, extras, precioPinturaM2, precioPinturaPersonalizado, modoPersonalizado, comentarios })
        );
      } catch { /* sessionStorage lleno o deshabilitado */ }
    }, 800);
    return () => clearTimeout(timer);
  }, [form, herreria, carpinteria, pintura, otros, consumibles, extras, precioPinturaM2, precioPinturaPersonalizado, modoPersonalizado, comentarios, draftKey]);

  // Restaurar borrador al montar (solo para plantillas nuevas)
  useEffect(() => {
    if (PlantillasId) return;
    try {
      const raw = sessionStorage.getItem(draftKey);
      if (!raw) return;
      const draft = JSON.parse(raw);
      if (draft.form) setForm(draft.form);
      if (draft.herreria?.length) setHerreria(draft.herreria);
      if (draft.carpinteria?.length) setCarpinteria(draft.carpinteria);
      if (draft.pintura?.length) setPintura(draft.pintura);
      if (draft.otros?.length) setOtros(draft.otros);
      if (draft.consumibles) setConsumibles(draft.consumibles);
      if (draft.extras) setExtras(draft.extras);
      if (draft.precioPinturaM2 !== undefined) setPrecioPinturaM2(draft.precioPinturaM2);
      if (draft.precioPinturaPersonalizado !== undefined) setPrecioPinturaPersonalizado(draft.precioPinturaPersonalizado);
      if (draft.modoPersonalizado !== undefined) setModoPersonalizado(draft.modoPersonalizado);
      if (draft.comentarios !== undefined) setComentarios(draft.comentarios);
    } catch { /* borrador corrupto, ignorar */ }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Hook para obtener tipos de proyecto únicos dinámicamente
  const { tiposProyecto, loading: loadingTipos, refetch: refetchTipos } = useGetTiposProyectoUnicos();
  
  const tiposProyectoOptions = useMemo(() => [
    ...tiposProyecto.map(tipo => ({ value: tipo, label: tipo })),
  ], [tiposProyecto]);

  const toast = useToast();
  const navigate = useNavigate();

  const handleUploadArchivos = async (event) => {
    const files = event.target.files;
    if (!files || !files.length || !PlantillasId) return;
    setUploadingArchivos(true);
    try {
      const res = await uploadArchivosPlantilla(PlantillasId, files);
      setArchivos(res.data.archivos || []);
      toast({
        title: "Archivos subidos",
        status: "success",
        duration: 2000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: "No se pudieron subir los archivos",
        description:
          error.response?.data?.error ||
          error.message ||
          "Error inesperado (verificá el tamaño y el formato)",
        status: "error",
        duration: 4000,
        isClosable: true,
      });
    } finally {
      setUploadingArchivos(false);
      event.target.value = ""; // permitir re-subir el mismo archivo
    }
  };

  const handleDeleteArchivo = async (publicId) => {
    if (!PlantillasId || !publicId) return;
    if (!window.confirm("¿Eliminar este archivo?")) return;
    setDeletingArchivoId(publicId);
    try {
      const res = await deleteArchivoPlantilla(PlantillasId, publicId);
      setArchivos(res.data.archivos || []);
      toast({
        title: "Archivo eliminado",
        status: "success",
        duration: 2000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: "No se pudo eliminar el archivo",
        description: error.response?.data?.error || error.message,
        status: "error",
        duration: 3500,
        isClosable: true,
      });
    } finally {
      setDeletingArchivoId(null);
    }
  };

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
  const { productsData } = useItems();
  const catalogosExistentes = useMemo(
    () => [...new Set(productsData.map((p) => p.catalogo).filter(Boolean))].sort(),
    [productsData]
  );


  // Variables de color para modo claro/oscuro
  const cardBg = useColorModeValue("teal.50", "gray.700");
  const cardBorder = useColorModeValue("teal.200", "teal.500");
  const titleColor = useColorModeValue("teal.600", "teal.300");
  const subtotalBg = useColorModeValue("gray.50", "gray.600");
  const mutedTextColor = useColorModeValue("gray.600", "gray.300");

  // Variables de color para la sección del producto (neutral; el énfasis va en teal)
  const productoBg = useColorModeValue("gray.50", "gray.800");
  const productoBorder = useColorModeValue("gray.200", "gray.600");
  const inputBg = useColorModeValue("white", "gray.700");
  const precioBg = useColorModeValue("green.50", "green.900");
  const precioBorder = useColorModeValue("green.200", "green.600");

  const obtenerPrecioUnitario = (item) => {
    const valorManual =
      item?.valor !== undefined && item?.valor !== null && item.valor !== ""
        ? parseFloat(item.valor) || 0
        : null;

    if (valorManual !== null) {
      return valorManual;
    }

    if (item?.valorPersonalizado !== undefined && item.valorPersonalizado !== "") {
      return parseFloat(item.valorPersonalizado) || 0;
    }

    if (
      item?.materiaPrima?.precio !== undefined &&
      item?.materiaPrima?.precio !== null
    ) {
      return parseFloat(item.materiaPrima.precio) || 0;
    }

    return 0;
  };

  // Función para calcular subtotal de una categoría
  const calcularSubtotal = (items) => {
    return items.reduce((total, item) => {
      const cantidad = parseFloat(item.cantidad) || 0;
      if (cantidad <= 0) return total;
      const precioUnitario = obtenerPrecioUnitario(item);
      return total + precioUnitario * cantidad;
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

  // Construir items con el shape que espera el backend (mismo que limpiarItem usa al guardar)
  const previewItems = useMemo(() => {
    const convertir = (items, categoria) =>
      items
        .map((item) => {
          const cantidad = parseFloat(item.cantidad) || 0;
          if (cantidad <= 0) return null;

          const base = {
            categoria,
            cantidad,
            valor: parseFloat(item.valor) || 0,
            isPriceAuto: Boolean(item.isPriceAuto),
            esPersonalizado: Boolean(item.isCustomMaterial),
            pinturaAlHorno: Boolean(item.pinturaAlHorno),
            perfilPinturaPerimetro: parseFloat(item.perfilPinturaPerimetro) || 0,
            costoPintura: parseFloat(item.costoPintura) || 0,
            gananciaIndividual:
              item.gananciaIndividual !== undefined &&
              item.gananciaIndividual !== "" &&
              item.gananciaIndividual !== null
                ? parseFloat(item.gananciaIndividual) || 0
                : null,
          };

          if (item.isCustomMaterial) return base;

          // Buscar el _id de la materia prima por la cascada (igual que limpiarItem en save).
          // Incluye nombreMadera porque varias maderas pueden compartir cat/tipo/medida/espesor.
          if (!item.categoriaMP || !item.tipoMP || !item.medidaMP) return base;

          const material = rawsMaterialData.find(
            (mp) =>
              mp.categoria === item.categoriaMP &&
              mp.type === item.tipoMP &&
              mp.medida === item.medidaMP &&
              (item.espesorMP
                ? mp.espesor === item.espesorMP
                : !mp.espesor || mp.espesor === "") &&
              (item.nombreMadera
                ? (mp.nombreMadera || "") === item.nombreMadera
                : true)
          );

          if (!material) return base;
          return { ...base, materiaPrima: material._id };
        })
        .filter(Boolean);

    return [
      ...convertir(debouncedHerreria, "herreria"),
      ...convertir(debouncedCarpinteria, "carpinteria"),
      ...convertir(debouncedPintura, "pintura"),
      ...convertir(debouncedOtros, "otros"),
    ];
  }, [
    debouncedHerreria,
    debouncedCarpinteria,
    debouncedPintura,
    debouncedOtros,
    rawsMaterialData,
  ]);

  const previewPayload = useMemo(
    () => ({
      items: previewItems,
      porcentajesPorCategoria: {
        herreria: parseFloat(form.porcentajesPorCategoria.herreria) || 0,
        carpinteria: parseFloat(form.porcentajesPorCategoria.carpinteria) || 0,
        pintura: parseFloat(form.porcentajesPorCategoria.pintura) || 0,
        otros: parseFloat(form.porcentajesPorCategoria.otros) || 0,
      },
      consumibles: {
        herreria: parseFloat(debouncedConsumibles.herreria) || 0,
        carpinteria: parseFloat(debouncedConsumibles.carpinteria) || 0,
        pintura: parseFloat(debouncedConsumibles.pintura) || 0,
        otros: parseFloat(debouncedConsumibles.otros) || 0,
      },
      extras,
      precioPinturaM2: parseFloat(precioPinturaM2) || 15000,
    }),
    [
      previewItems,
      form.porcentajesPorCategoria,
      debouncedConsumibles,
      extras,
      precioPinturaM2,
    ]
  );

  const { preview } = usePlantillaPreview(previewPayload, 350);

  // Todos los totales vienen ahora del backend (single source of truth).
  const subtotalHerreria = preview.subtotalesPorCategoria?.herreria ?? 0;
  const subtotalCarpinteria = preview.subtotalesPorCategoria?.carpinteria ?? 0;
  const subtotalPintura = preview.subtotalesPorCategoria?.pintura ?? 0;
  const subtotalOtros = preview.subtotalesPorCategoria?.otros ?? 0;
  const subtotalExtras = preview.extrasTotal ?? 0;
  const precioFinalHerreria = preview.precioFinalesPorCategoria?.herreria ?? 0;
  const precioFinalCarpinteria = preview.precioFinalesPorCategoria?.carpinteria ?? 0;
  const precioFinalPintura = preview.precioFinalesPorCategoria?.pintura ?? 0;
  const precioFinalOtros = preview.precioFinalesPorCategoria?.otros ?? 0;
  const totalPinturaHorno = preview.totalPinturaHorno ?? 0;
  const costoTotal = preview.costoTotal ?? 0;
  const precioFinalTotal = preview.precioFinal ?? 0;
  const gananciaTotal = preview.ganancia ?? 0;

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

  const plantillaLoadedRef = useRef(false);

  useEffect(() => {
    if (!PlantillasId || plantillaLoadedRef.current || !rawsMaterialData.length) return;
    plantillaLoadedRef.current = true;
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

          setComentarios(plantilla.comentarios || "");
          setArchivos(Array.isArray(plantilla.archivos) ? plantilla.archivos : []);

          // Precio base guardado en la plantilla
          if (plantilla.precioPinturaPersonalizado && plantilla.precioPinturaM2 != null) {
            setPrecioPinturaM2(plantilla.precioPinturaM2);
            setPrecioPinturaPersonalizado(true);
          }

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
              // Items viejos sin isPriceAuto en BD se tratan como auto (true)
              isPriceAuto: esPersonalizado ? false : (item.isPriceAuto !== false),
              gananciaIndividual: toInputString(item.gananciaIndividual, ""),
            };

            const tieneMetadatosCascada = Boolean(
              item.categoriaMP ||
                item.tipoMP ||
                item.medidaMP ||
                item.espesorMP ||
                item.nombreMadera
            );

            // Si el item es auto-priced, sobrescribir valor con el precio live de la MP
            // (matchea el cálculo del backend que siempre usa el precio actual).
            const esAutoPriced = !esPersonalizado && item.isPriceAuto !== false;
            if (esAutoPriced) {
              let precioLive = null;
              if (
                item.materiaPrima &&
                typeof item.materiaPrima === "object" &&
                item.materiaPrima.precio != null
              ) {
                precioLive = item.materiaPrima.precio;
              } else if (item.categoriaMP && item.tipoMP && item.medidaMP) {
                const match = rawsMaterialData.find(
                  (mp) =>
                    mp.categoria === item.categoriaMP &&
                    mp.type === item.tipoMP &&
                    mp.medida === item.medidaMP &&
                    (item.espesorMP
                      ? mp.espesor === item.espesorMP
                      : !mp.espesor || mp.espesor === "") &&
                    (item.nombreMadera
                      ? (mp.nombreMadera || "") === item.nombreMadera
                      : true)
                );
                if (match && match.precio != null) precioLive = match.precio;
              }
              if (precioLive != null) {
                baseItem.valor = toInputString(precioLive, "");
              }
            }

            if (esPersonalizado && tieneMetadatosCascada) {
              return baseItem;
            }

            if (item.categoriaMP && item.tipoMP && item.medidaMP && !esPersonalizado) {
              return baseItem;
            }

            // Si materiaPrima es un OBJETO (populate del backend)
            if (item.materiaPrima && typeof item.materiaPrima === "object") {
              const selectedId = item.materiaPrima?._id?.toString() || materiaPrimaId;
              // Si es auto-priced (default true para items viejos), priorizar precio LIVE de la MP
              const esAuto = !esPersonalizado && item.isPriceAuto !== false;
              const precioLive = item.materiaPrima.precio;
              const valorFinal = esAuto && precioLive != null
                ? toInputString(precioLive, "")
                : (toInputString(item.valor, "") || toInputString(precioLive, ""));
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
                valor: valorFinal,
                cantidad: toInputString(item.cantidad, ""),
                isPriceAuto: esAuto,
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
                const esAuto = !esPersonalizado && item.isPriceAuto !== false;
                const valorFinal = esAuto && material.precio != null
                  ? toInputString(material.precio, "")
                  : (toInputString(item.valor, "") || toInputString(material.precio, ""));
                return {
                  ...baseItem,
                  categoriaMP: material.categoria || "",
                  tipoMP: material.type || "",
                  medidaMP: material.medida || "",
                  espesorMP: material.espesor || "",
                  valor: valorFinal,
                  cantidad: toInputString(item.cantidad, ""),
                  isPriceAuto: esAuto,
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

          // Restaurar borrador con cambios no guardados (seguridad ante recargas por cambio de pestaña)
          isDraftLoaded.current = true;
          try {
            const raw = sessionStorage.getItem(draftKey);
            if (raw) {
              const draft = JSON.parse(raw);
              if (draft.form) setForm(draft.form);
              if (draft.herreria?.length) setHerreria(draft.herreria);
              if (draft.carpinteria?.length) setCarpinteria(draft.carpinteria);
              if (draft.pintura?.length) setPintura(draft.pintura);
              if (draft.otros?.length) setOtros(draft.otros);
              if (draft.consumibles) setConsumibles(draft.consumibles);
              if (draft.extras) setExtras(draft.extras);
              if (draft.precioPinturaM2 !== undefined) setPrecioPinturaM2(draft.precioPinturaM2);
              if (draft.modoPersonalizado !== undefined) setModoPersonalizado(draft.modoPersonalizado);
              if (draft.comentarios !== undefined) setComentarios(draft.comentarios);
            }
          } catch { /* borrador corrupto, ignorar */ }
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
  }, [PlantillasId, toast, rawsMaterialData, tiposProyectoOptions]);

  // Precio live de la MP "Pintura al Horno" — se aplica solo cuando no hay un valor personalizado
  useEffect(() => {
    if (!rawsMaterialData.length) return;
    if (precioPinturaPersonalizado) return;
    const mp = rawsMaterialData.find(
      (m) =>
        m.categoria?.toLowerCase() === "proteccion" &&
        m.type?.toLowerCase().includes("pintura al horno")
    );
    if (mp?.precio != null) setPrecioPinturaM2(Number(mp.precio));
  }, [rawsMaterialData, precioPinturaPersonalizado]);

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
      setHerreria((prev) => [newItem, ...prev]);
    } else if (categoria === "carpinteria") {
      setCarpinteria((prev) => [newItem, ...prev]);
    } else if (categoria === "pintura") {
      setPintura((prev) => [newItem, ...prev]);
    } else if (categoria === "otros") {
      setOtros((prev) => [newItem, ...prev]);
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
    (categoriaSeleccionada, tipoSeleccionado, medidaSeleccionada, nombreMaderaSeleccionado) => {
      if (!categoriaSeleccionada || !tipoSeleccionado || !medidaSeleccionada)
        return [];
      
      let filtrados = rawsMaterialData.filter(
        (mp) =>
          mp.categoria === categoriaSeleccionada &&
          mp.type === tipoSeleccionado &&
          mp.medida === medidaSeleccionada
      );

      // Si hay nombreMadera seleccionado, filtrar también por eso
      if (nombreMaderaSeleccionado) {
        filtrados = filtrados.filter(
          (mp) => mp.nombreMadera === nombreMaderaSeleccionado
        );
      }

      const espesores = [
        ...new Set(
          filtrados
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
      espesorSeleccionado,
      nombreMaderaSeleccionado
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
              : !mp.espesor || mp.espesor === "") &&
            (nombreMaderaSeleccionado
              ? mp.nombreMadera === nombreMaderaSeleccionado
              : true)
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
          value,
          nextItem.nombreMadera
        );
        if (espesoresDisponibles.length === 0) {
          const material = getMaterialMatch(
            nextItem.categoriaMP,
            nextItem.tipoMP,
            value,
            null,
            nextItem.nombreMadera
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
          value,
          nextItem.nombreMadera
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

  const getMedidaOptions = (categoriaSeleccionada, tipoSeleccionado, nombreMaderaSeleccionado) => {
    if (!categoriaSeleccionada || !tipoSeleccionado) return [];
    
    let filtrados = rawsMaterialData.filter(
      (mp) =>
        mp.categoria === categoriaSeleccionada &&
        mp.type === tipoSeleccionado
    );

    // Si hay nombreMadera seleccionado, filtrar también por eso
    if (nombreMaderaSeleccionado) {
      filtrados = filtrados.filter(
        (mp) => mp.nombreMadera === nombreMaderaSeleccionado
      );
    }

    const medidas = [
      ...new Set(
        filtrados
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

  const savePlantilla = async (shouldRedirect = true) => {
    // Función para encontrar el ObjectId real de la materia prima.
    // Incluye nombreMadera porque dos maderas distintas (ej: Petiribí vs Paraíso)
    // pueden compartir categoría/tipo/medida/espesor y solo diferenciarse por nombre.
    const encontrarMateriaPrimaId = (
      categoriaMP,
      tipoMP,
      medidaMP,
      espesorMP,
      nombreMadera
    ) => {
      const material = rawsMaterialData.find(
        (mp) =>
          mp.categoria === categoriaMP &&
          mp.type === tipoMP &&
          mp.medida === medidaMP &&
          (espesorMP
            ? mp.espesor === espesorMP
            : !mp.espesor || mp.espesor === "") &&
          (nombreMadera
            ? (mp.nombreMadera || "") === nombreMadera
            : true)
      );

      return material ? material._id : null;
    };

    // Función para limpiar y validar un item
    const limpiarItem = (item, categoria) => {
      const cantidad = parseFloat(item.cantidad) || 0;
      if (cantidad <= 0) return null;

      const gananciaIndividualLimpia =
        categoria === "pintura" && item.gananciaIndividual !== undefined && item.gananciaIndividual !== ""
          ? parseFloat(item.gananciaIndividual) || 0
          : null;

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

        const costoPinturaCustom = (item.pinturaAlHorno && item.perfilPinturaPerimetro)
          ? item.perfilPinturaPerimetro * cantidad * METROS_POR_UNIDAD * precioPinturaM2
          : 0;
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
          pinturaAlHorno: Boolean(item.pinturaAlHorno),
          perfilPinturaId: item.perfilPinturaId || null,
          perfilPinturaPerimetro: item.perfilPinturaPerimetro ?? 0,
          costoPintura: costoPinturaCustom,
          ...(gananciaIndividualLimpia !== null
            ? { gananciaIndividual: gananciaIndividualLimpia }
            : {}),
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
        item.espesorMP,
        item.nombreMadera
      );

      if (!materiaPrimaId) {
        return null;
      }

      const costoPinturaCalc = (item.pinturaAlHorno && item.perfilPinturaPerimetro)
        ? item.perfilPinturaPerimetro * cantidad * precioPinturaM2
        : 0;
      return {
        categoria,
        materiaPrima: materiaPrimaId,
        cantidad,
        valor: parseFloat(item.valor) || 0,
        isPriceAuto: Boolean(item.isPriceAuto),
        categoriaMP: item.categoriaMP || "",
        tipoMP: item.tipoMP || "",
        medidaMP: item.medidaMP || "",
        espesorMP: item.espesorMP || "",
        nombreMadera: item.nombreMadera || "",
        pinturaAlHorno: Boolean(item.pinturaAlHorno),
        perfilPinturaId: item.perfilPinturaId || null,
        perfilPinturaPerimetro: item.perfilPinturaPerimetro ?? 0,
        costoPintura: costoPinturaCalc,
        ...(gananciaIndividualLimpia !== null
          ? { gananciaIndividual: gananciaIndividualLimpia }
          : {}),
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
      items: allItems,
      porcentajesPorCategoria: porcentajesLimpios,
      consumibles: consumiblesLimpios,
      extras: extrasPayload,
      tags: [],
      precioPinturaM2: parseFloat(precioPinturaM2) || 15000,
      precioPinturaPersonalizado: Boolean(precioPinturaPersonalizado),
      comentarios: comentarios || "",
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
    } catch {
      ok = false;
    }

    if (ok) {
      sessionStorage.removeItem(draftKey);
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

      if (shouldRedirect) {
        setTimeout(() => { navigate("/plantillas"); }, 1000);
      } else if (!PlantillasId && plantillaGuardadaId) {
        navigate(`/plantillas/plantillaAdd/${plantillaGuardadaId}`, { replace: true });
      }
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

  const handlePinturaToggle = useCallback((index, checked) => {
    setHerreria((prev) => {
      const newItems = [...prev];
      const item = { ...newItems[index] };
      item.pinturaAlHorno = checked;

      if (checked && item.medidaMP) {
        const norm = (s) =>
          s?.toString().toLowerCase()
            .replace(/×/g, "x")
            .replace(/\s+/g, "")
            .replace(/[^a-z0-9x]/g, "");

        const tipoLabel = getMaterialTypeLabel(item.tipoMP) || item.tipoMP || "";
        const tipoNorm = tipoLabel.toLowerCase();
        const categoriaNorm = item.categoriaMP?.toLowerCase() ?? "";
        const esCanio = categoriaNorm.includes("caño") || categoriaNorm.includes("cano");

        const detectarTipo = (t) => {
          if (t.includes("angulo") || t.includes("ángulo"))  return "L";
          if (t.includes("planchuela"))                       return "planchuela";
          if (t.includes("tee"))                              return "tee";
          if (t.includes("cuadrado macizo") || t.includes("cuadmacizo")) return "cuadMacizo";
          if (t.includes("redondo macizo") || t.includes("redmacizo"))   return "redMacizo";
          // Si la categoría es CAÑO → mm matching (null)
          if (esCanio) return null;
          // Hierros sin caño
          if (t.includes("cuadrado")) return "cuadMacizo";
          if (t.includes("redondo"))  return "redMacizo";
          return null;
        };
        const tipoDetectado = detectarTipo(tipoNorm);
        const tiposEnPulgadas = ["L", "planchuela", "tee", "cuadMacizo", "redMacizo"];
        const esPulgadas = tiposEnPulgadas.includes(tipoDetectado);
        const tiposPermitidos = tipoDetectado ? [tipoDetectado] : ["cuadrado", "rectangular", "redondo"];

        const candidatos = perfilesPintura.filter((p) => tiposPermitidos.includes(p.tipo));

        // Tipos en pulgadas: comparar medida exacta (ej. "1,1/2")
        // Tipos en mm (caños): buscar dimensiones "40x40" en el nombre del perfil
        // Normaliza "1 1/4", "1,1/4", "1-1/4" → todos a "11/4" para comparar igual
        const extractNum = (s) => s?.replace(/[^0-9\/]/g, "") ?? "";
        const medida = norm(item.medidaMP);
        const perfil = esPulgadas
          ? candidatos.find((p) => extractNum(p.nombre) === extractNum(item.medidaMP) && extractNum(item.medidaMP).length > 0)
          : candidatos.find((p) => {
              const dims = norm(p.nombre).match(/(\d+)x(\d+)/);
              if (!dims) return false;
              const reversed = `${dims[2]}x${dims[1]}`;
              return medida.includes(dims[0]) || medida.includes(reversed);
            });
        item.perfilPinturaId = perfil?._id ?? "";
        item.perfilPinturaPerimetro = perfil?.perimetro ?? 0;
      } else if (!checked) {
        item.perfilPinturaId = "";
        item.perfilPinturaPerimetro = 0;
        item.costoPintura = 0;
      }

      newItems[index] = item;
      return newItems;
    });
  }, [perfilesPintura]);

  const handleSubmit = (e) => {
    e.preventDefault();
    savePlantilla(true);
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
          <Heading size="md" color={color} textTransform="capitalize">
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
              const selectorExtraColumn = isPintura && !item.isCustomMaterial ? 1 : 0;
              const gananciaExtraColumn = isPintura ? 1 : 0;
              const totalColumns = baseColumns + selectorExtraColumn + gananciaExtraColumn;
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
                    item.espesorMP || null,
                    item.nombreMadera
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
                            {getMedidaOptions(item.categoriaMP, item.tipoMP, item.nombreMadera).map(
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
                              item.medidaMP,
                              item.nombreMadera
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

                    {isPintura && (
                      <GridItem minW="0">
                        <FormControl>
                          <FormLabel fontSize={labelFontSize}>Ganancia (%)</FormLabel>
                          <Input
                            size={fieldSize}
                            type="number"
                            placeholder="Ej: 30"
                            min="0"
                            step="0.1"
                            value={item.gananciaIndividual ?? ""}
                            onChange={(e) =>
                              handleItemChange(
                                categoria,
                                index,
                                "gananciaIndividual",
                                e.target.value
                              )
                            }
                          />
                        </FormControl>
                      </GridItem>
                    )}

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
                                : "teal.400",
                            boxShadow:
                              item.isPriceAuto && !item.isCustomMaterial
                                ? "0 0 0 1px var(--chakra-colors-green-400)"
                                : "0 0 0 1px var(--chakra-colors-teal-400)",
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

                {isHerreria && (
                  <Box borderTop="1px" borderColor="orange.200" pt={2}>
                    <HStack spacing={3} align="center" width="100%">
                      <FormLabel fontSize="sm" mb={0} whiteSpace="nowrap">🔥 Pintura al horno</FormLabel>
                      <Switch
                        colorScheme="orange"
                        isChecked={item.pinturaAlHorno}
                        onChange={(e) => handlePinturaToggle(index, e.target.checked)}
                      />
                      {item.pinturaAlHorno && (
                        item.perfilPinturaId && item.perfilPinturaPerimetro > 0 ? (
                          <>
                            <Text fontSize="xs" color="orange.500" whiteSpace="nowrap">
                              {perfilesPintura.find((p) => p._id === item.perfilPinturaId)?.nombre ?? "Perfil detectado"}
                            </Text>
                            <Badge colorScheme="orange" fontSize="sm" px={3} py={1} ml="auto" whiteSpace="nowrap">
                              {formatPrice(item.perfilPinturaPerimetro * (parseFloat(item.cantidad) || 0) * METROS_POR_UNIDAD * precioPinturaM2)}
                            </Badge>
                          </>
                        ) : (
                          <Text fontSize="xs" color="gray.400" fontStyle="italic">
                            Sin perfil detectado
                          </Text>
                        )
                      )}
                    </HStack>
                  </Box>
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

            {categoria !== "pintura" && (
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
            )}
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
              {categoria === "pintura" && totalPinturaHorno > 0 && (
                <HStack justify="space-between">
                  <Text fontSize="sm">🔥 Pintura al horno (herrería):</Text>
                  <Text fontSize="sm" color="orange.500" fontWeight="semibold">
                    {formatPrice(totalPinturaHorno)}
                  </Text>
                </HStack>
              )}
              <Divider />
              <HStack justify="space-between">
                <Text fontWeight="bold">Costo Total:</Text>
                <Badge colorScheme="teal" fontSize="md" p={2}>
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
                colorScheme="teal"
                size="lg"
              >
                <Text fontWeight="semibold" color={titleColor}>
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
                    <Text fontSize="sm" fontWeight="medium" color={titleColor}>
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
                          list="catalogos-existentes"
                          placeholder="Elegí uno o escribí uno nuevo"
                          value={datosProducto.catalogo}
                          onChange={(e) =>
                            setDatosProducto(prev => ({
                              ...prev,
                              catalogo: e.target.value
                            }))
                          }
                          bg={inputBg}
                          autoComplete="off"
                        />
                        <datalist id="catalogos-existentes">
                          {catalogosExistentes.map((cat) => (
                            <option key={cat} value={cat} />
                          ))}
                        </datalist>
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
            <HStack justify="flex-end" align="center" spacing={3}>
              <Text fontSize="sm" color="orange.500" fontWeight="semibold">
                🔥 Pintura al horno ($/m²):
              </Text>
              {precioPinturaPersonalizado && (
                <Badge colorScheme="yellow" fontSize="xs" variant="subtle">
                  Personalizado
                </Badge>
              )}
              <Input
                size="sm"
                type="number"
                value={precioPinturaM2}
                onChange={(e) => {
                  setPrecioPinturaM2(Number(e.target.value));
                  setPrecioPinturaPersonalizado(true);
                }}
                w="120px"
                min={0}
              />
              {precioPinturaPersonalizado && (
                <IconButton
                  icon={<FiRefreshCw />}
                  size="xs"
                  variant="ghost"
                  colorScheme="gray"
                  title="Resetear al valor de la base de datos"
                  onClick={() => {
                    setPrecioPinturaPersonalizado(false);
                  }}
                />
              )}
            </HStack>
            {renderCategorySection(
              "herreria",
              herreria,
              "orange.400",
              subtotalHerreria,
              precioFinalHerreria
            )}
            <Button
              onClick={() => savePlantilla(false)}
              colorScheme="teal"
              variant="outline"
              size="sm"
              alignSelf="flex-end"
              isLoading={addLoading || updateLoading}
              loadingText="Guardando..."
            >
              Guardar cambios
            </Button>

            {renderCategorySection(
              "carpinteria",
              carpinteria,
              "green.400",
              subtotalCarpinteria,
              precioFinalCarpinteria
            )}
            <Button
              onClick={() => savePlantilla(false)}
              colorScheme="teal"
              variant="outline"
              size="sm"
              alignSelf="flex-end"
              isLoading={addLoading || updateLoading}
              loadingText="Guardando..."
            >
              Guardar cambios
            </Button>

            {renderCategorySection(
              "pintura",
              pintura,
              "blue.400",
              subtotalPintura + totalPinturaHorno,
              precioFinalPintura + totalPinturaHorno
            )}
            <Button
              onClick={() => savePlantilla(false)}
              colorScheme="teal"
              variant="outline"
              size="sm"
              alignSelf="flex-end"
              isLoading={addLoading || updateLoading}
              loadingText="Guardando..."
            >
              Guardar cambios
            </Button>

            {renderCategorySection(
              "otros",
              otros,
              "purple.300",
              subtotalOtros,
              precioFinalOtros
            )}
            <Button
              onClick={() => savePlantilla(false)}
              colorScheme="teal"
              variant="outline"
              size="sm"
              alignSelf="flex-end"
              isLoading={addLoading || updateLoading}
              loadingText="Guardando..."
            >
              Guardar cambios
            </Button>

            {/* Sección Extras */}
            <Card>
              <CardHeader>
                <HStack justify="space-between">
                  <Heading
                    size="md"
                    color="purple.400"
                    textTransform="capitalize"
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

          {/* Comentarios / detalle del presupuesto */}
          <Card bg={cardBg} borderWidth="1px" borderColor={cardBorder}>
            <CardHeader>
              <Heading size="md" color={titleColor}>
                📝 Comentarios / detalle
              </Heading>
            </CardHeader>
            <CardBody>
              <FormControl>
                <FormLabel fontSize="sm" color="gray.500">
                  Notas, aclaraciones o detalles para este presupuesto
                </FormLabel>
                <Textarea
                  value={comentarios}
                  onChange={(e) => setComentarios(e.target.value)}
                  placeholder="Ej: plano ajustado, condiciones de entrega, observaciones del cliente…"
                  rows={4}
                />
              </FormControl>
            </CardBody>
          </Card>

          {/* Archivos adjuntos (PDF / imágenes) */}
          <Card bg={cardBg} borderWidth="1px" borderColor={cardBorder}>
            <CardHeader>
              <Heading size="md" color={titleColor}>
                📎 Archivos adjuntos
              </Heading>
            </CardHeader>
            <CardBody>
              {!PlantillasId ? (
                <Text fontSize="sm" color="gray.500">
                  Guardá la plantilla primero para poder adjuntar archivos (PDF o imágenes).
                </Text>
              ) : (
                <VStack align="stretch" spacing={3}>
                  <FormControl>
                    <FormLabel fontSize="sm" color="gray.500">
                      Subir PDF o imágenes (planos, referencias, etc.)
                    </FormLabel>
                    <Input
                      type="file"
                      multiple
                      accept=".pdf,image/*"
                      onChange={handleUploadArchivos}
                      isDisabled={uploadingArchivos}
                      pt={1}
                    />
                    <FormHelperText>Máximo 10MB por archivo.</FormHelperText>
                  </FormControl>

                  {uploadingArchivos && (
                    <Text fontSize="sm" color={titleColor}>
                      Subiendo archivos…
                    </Text>
                  )}

                  {archivos.length === 0 ? (
                    <Text fontSize="sm" color={mutedTextColor}>
                      No hay archivos adjuntos todavía.
                    </Text>
                  ) : (
                    <SimpleGrid columns={{ base: 1, md: 2 }} spacing={3}>
                      {archivos.map((archivo) => {
                        const esPdf = esArchivoPdf(archivo);
                        const previewUrl = buildPreviewUrl(archivo, 500);
                        const previewGrande = buildPreviewUrl(archivo, 1400);
                        return (
                          <HStack
                            key={archivo.publicId}
                            align="flex-start"
                            justify="space-between"
                            borderWidth="1px"
                            borderColor={cardBorder}
                            borderRadius="md"
                            p={2}
                            spacing={3}
                          >
                            <Image
                              src={previewUrl}
                              alt={archivo.nombre || "Adjunto"}
                              boxSize="72px"
                              objectFit="cover"
                              borderRadius="md"
                              cursor="pointer"
                              flexShrink={0}
                              onClick={() => window.open(previewGrande, "_blank", "noopener")}
                              fallback={
                                <Box
                                  boxSize="72px"
                                  borderRadius="md"
                                  bg="blackAlpha.100"
                                  display="flex"
                                  alignItems="center"
                                  justifyContent="center"
                                  fontSize="2xl"
                                  flexShrink={0}
                                >
                                  {esPdf ? "📄" : "🖼️"}
                                </Box>
                              }
                            />
                            <Box minW={0} flex="1">
                              <Text
                                fontSize="sm"
                                fontWeight="medium"
                                noOfLines={2}
                                title={archivo.nombre || archivo.url}
                              >
                                {(esPdf ? "📄 " : "🖼️ ") + (archivo.nombre || "Archivo")}
                              </Text>
                              <HStack mt={1} spacing={3} flexWrap="wrap">
                                <Link
                                  href={previewGrande}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  color={titleColor}
                                  fontSize="xs"
                                >
                                  Vista previa
                                </Link>
                                <Link
                                  href={archivo.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  color={titleColor}
                                  fontSize="xs"
                                >
                                  Abrir original
                                </Link>
                              </HStack>
                            </Box>
                            <IconButton
                              aria-label="Eliminar archivo"
                              icon={<FiMinus />}
                              size="sm"
                              colorScheme="red"
                              variant="ghost"
                              flexShrink={0}
                              isLoading={deletingArchivoId === archivo.publicId}
                              onClick={() => handleDeleteArchivo(archivo.publicId)}
                            />
                          </HStack>
                        );
                      })}
                    </SimpleGrid>
                  )}
                </VStack>
              )}
            </CardBody>
          </Card>

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
                  <Badge colorScheme="teal" fontSize="xl" p={3}>
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
                  <Badge colorScheme="teal" fontSize="lg" p={2}>
                    {formatPrice(valorNubeCuotas)}
                  </Badge>
                </HStack>
              </VStack>
            </CardBody>
          </Card>

          <Button
            onClick={() => savePlantilla(false)}
            colorScheme="teal"
            variant="outline"
            size="sm"
            alignSelf="flex-end"
            isLoading={addLoading || updateLoading}
            loadingText="Guardando..."
          >
            Guardar cambios
          </Button>

          {/* Botón de envío */}
          <Button
            type="submit"
            colorScheme="teal"
            size="lg"
            isLoading={addLoading || updateLoading}
            loadingText={PlantillasId ? "Actualizando..." : "Creando..."}
          >
            {PlantillasId ? "Actualizar y volver" : "Crear Plantilla"}
          </Button>
        </VStack>
      </form>
    </Box>
  );
};
