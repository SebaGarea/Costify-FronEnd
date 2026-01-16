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
  FormControl,
  FormLabel,
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

  const cleaned = raw.replace(/[^0-9.,-]/g, "");
  if (!cleaned) return "";

  const lastComma = cleaned.lastIndexOf(",");
  const lastDot = cleaned.lastIndexOf(".");
  let decimalSeparatorIndex = -1;
  let decimalSeparator = null;

  if (lastComma !== -1 && lastDot !== -1) {
    decimalSeparatorIndex = Math.max(lastComma, lastDot);
    decimalSeparator = cleaned[decimalSeparatorIndex];
  } else if (lastComma !== -1) {
    decimalSeparatorIndex = lastComma;
    decimalSeparator = ",";
  } else if (lastDot !== -1) {
    decimalSeparatorIndex = lastDot;
    decimalSeparator = ".";
  }

  if (decimalSeparatorIndex !== -1) {
    const integerPart = cleaned
      .slice(0, decimalSeparatorIndex)
      .replace(/[^0-9-]/g, "");
    const fractionalPart = cleaned.slice(decimalSeparatorIndex + 1).replace(/[^0-9]/g, "");
    return `${integerPart || "0"}.${fractionalPart || "0"}`;
  }

  return cleaned.replace(/[^0-9-]/g, "");
};

// Función para formatear precios mostrados (para badges y totales)
const formatPrice = (value) => {
  const formatted = formatCurrency(value);
  return formatted ? `$${formatted}` : "$0";
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
    const configGuardada = localStorage.getItem("costify-plataformas-config");
    if (configGuardada) {
      return JSON.parse(configGuardada);
    }
    // Valores por defecto iniciales
    return {
      mercadoLibre: 16.28,
      mercadoLibre3Cuotas: 41,
      valorNubeCuotas: 47,
      valorNube: 10,
    };
  };

  // Estado para porcentajes de plataformas de venta
  const [porcentajesPlataformas, setPorcentajesPlataformas] = useState(
    cargarConfiguracionPlataformas
  );

  // Estados separados para cada categoría
  const [herreria, setHerreria] = useState([
    {
      categoriaMP: "",
      tipoMP: "",
      medidaMP: "",
      espesorMP: "",
      valor: "",
      cantidad: "",
      isPriceAuto: false,
    },
  ]);
  const [carpinteria, setCarpinteria] = useState([
    {
      categoriaMP: "",
      tipoMP: "",
      medidaMP: "",
      espesorMP: "",
      valor: "",
      cantidad: "",
      isPriceAuto: false,
    },
  ]);
  const [pintura, setPintura] = useState([
    {
      categoriaMP: "",
      tipoMP: "",
      medidaMP: "",
      espesorMP: "",
      valor: "",
      cantidad: "",
      isPriceAuto: false,
    },
  ]);

  // Estado para consumibles por categoría
  const [consumibles, setConsumibles] = useState({
    herreria: "",
    carpinteria: "",
    pintura: "",
  });

  const [extras, setExtras] = useState({
    creditoCamioneta: { valor: "15000", porcentaje: 0 },
    envio: { valor: "", porcentaje: 0 },
    camposPersonalizados: [], // Array de { nombre: "", valor: "", porcentaje: 0 }
  });

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

  // Total general (incluyendo extras)
  const costoTotal =
    subtotalHerreria + subtotalCarpinteria + subtotalPintura + subtotalExtras;
  const precioFinalTotal =
    precioFinalHerreria +
    precioFinalCarpinteria +
    precioFinalPintura +
    subtotalExtras;
  const gananciaTotal = precioFinalTotal - costoTotal;

  // Cálculos para plataformas de venta
  const precioMercadoLibre =
    precioFinalTotal * (1 + porcentajesPlataformas.mercadoLibre / 100);
  const precioML3Cuotas =
    precioFinalTotal * (1 + porcentajesPlataformas.mercadoLibre3Cuotas / 100);
  const valorNubeCuotas =
    precioFinalTotal * (1 + porcentajesPlataformas.valorNubeCuotas / 100);
  const valorNube =
    precioFinalTotal * (1 + porcentajesPlataformas.valorNube / 100);

  useEffect(() => {
    if (PlantillasId) {
      getPlantillaById(PlantillasId)
        .then((res) => {
          const plantilla = res.data.plantilla || res.data;
          setForm({
            nombre: plantilla.nombre || "",
            tipoProyecto: plantilla.tipoProyecto || "",
            items: plantilla.items || [],
            porcentajesPorCategoria: plantilla.porcentajesPorCategoria || {
              herreria: 100,
              carpinteria: 100,
              pintura: 100,
            },
          });

          // Cargar consumibles si existen
          if (plantilla.consumibles) {
            setConsumibles({
              herreria: plantilla.consumibles.herreria || "",
              carpinteria: plantilla.consumibles.carpinteria || "",
              pintura: plantilla.consumibles.pintura || "",
            });
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
            // Si ya tiene la estructura nueva (con campos separados), devolverlo tal como está
            if (item.categoriaMP && item.tipoMP && item.medidaMP) {
              return {
                ...item,
                isPriceAuto: false, // Agregar campo que falta
              };
            }

            // Si materiaPrima es un OBJETO (populate del backend)
            if (item.materiaPrima && typeof item.materiaPrima === "object") {
              return {
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
                valor: item.valor || item.materiaPrima.precio || "",
                cantidad: item.cantidad || "",
                isPriceAuto: true, // Marcar como automático ya que viene del backend
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
                  categoriaMP: material.categoria || "",
                  tipoMP: material.type || "",
                  medidaMP: material.medida || "",
                  espesorMP: material.espesor || "",
                  valor: item.valor || material.precio || "",
                  cantidad: item.cantidad || "",
                  isPriceAuto: false,
                };
              }

              // Si materiaPrima es texto concatenado (estructura antigua)
              if (item.materiaPrima.includes(" - ")) {
                const partes = item.materiaPrima.split(" - ");
                return {
                  categoriaMP: partes[0] || "",
                  tipoMP: partes[1] || "",
                  medidaMP: partes[2] || "",
                  espesorMP: partes[3] || "",
                  valor: item.valor || "",
                  cantidad: item.cantidad || "",
                  isPriceAuto: false,
                };
              }
            }

            // Si no tiene ninguna estructura válida, devolver estructura vacía
            return {
              categoriaMP: "",
              tipoMP: "",
              medidaMP: "",
              espesorMP: "",
              valor: "",
              cantidad: "",
              isPriceAuto: false,
            };
          };

          // Separar items por categoría y convertir al formato de cascada

          const herreriaItems = plantilla.items
            ?.filter((item) => item.categoria === "herreria")
            .map(convertirItemACascada) || [
            {
              categoriaMP: "",
              tipoMP: "",
              medidaMP: "",
              espesorMP: "",
              valor: "",
              cantidad: "",
              isPriceAuto: false,
            },
          ];

          const carpinteriaItems = plantilla.items
            ?.filter((item) => item.categoria === "carpinteria")
            .map(convertirItemACascada) || [
            {
              categoriaMP: "",
              tipoMP: "",
              medidaMP: "",
              espesorMP: "",
              valor: "",
              cantidad: "",
              isPriceAuto: false,
            },
          ];

          const pinturaItems = plantilla.items
            ?.filter((item) => item.categoria === "pintura")
            .map(convertirItemACascada) || [
            {
              categoriaMP: "",
              tipoMP: "",
              medidaMP: "",
              espesorMP: "",
              valor: "",
              cantidad: "",
              isPriceAuto: false,
            },
          ];

          setHerreria(
            herreriaItems.length > 0
              ? herreriaItems
              : [
                  {
                    categoriaMP: "",
                    tipoMP: "",
                    medidaMP: "",
                    espesorMP: "",
                    valor: "",
                    cantidad: "",
                    isPriceAuto: false,
                  },
                ]
          );
          setCarpinteria(
            carpinteriaItems.length > 0
              ? carpinteriaItems
              : [
                  {
                    categoriaMP: "",
                    tipoMP: "",
                    medidaMP: "",
                    espesorMP: "",
                    valor: "",
                    cantidad: "",
                    isPriceAuto: false,
                  },
                ]
          );
          setPintura(
            pinturaItems.length > 0
              ? pinturaItems
              : [
                  {
                    categoriaMP: "",
                    tipoMP: "",
                    medidaMP: "",
                    espesorMP: "",
                    valor: "",
                    cantidad: "",
                    isPriceAuto: false,
                  },
                ]
          );
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
    const newItem = {
      categoriaMP: "",
      tipoMP: "",
      medidaMP: "",
      espesorMP: "",
      valor: "",
      cantidad: "",
      isPriceAuto: false,
    };
    if (categoria === "herreria") {
      setHerreria((prev) => [...prev, newItem]);
    } else if (categoria === "carpinteria") {
      setCarpinteria((prev) => [...prev, newItem]);
    } else if (categoria === "pintura") {
      setPintura((prev) => [...prev, newItem]);
    }
  }, []);

  const removeItem = (categoria, index) => {
    if (categoria === "herreria" && herreria.length > 1) {
      setHerreria(herreria.filter((_, i) => i !== index));
    } else if (categoria === "carpinteria" && carpinteria.length > 1) {
      setCarpinteria(carpinteria.filter((_, i) => i !== index));
    } else if (categoria === "pintura" && pintura.length > 1) {
      setPintura(pintura.filter((_, i) => i !== index));
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

  const getPrecioMaterial = useCallback(
    (
      categoriaSeleccionada,
      tipoSeleccionado,
      medidaSeleccionada,
      espesorSeleccionado
    ) => {
      if (!categoriaSeleccionada || !tipoSeleccionado || !medidaSeleccionada)
        return null;

      const material = rawsMaterialData.find(
        (mp) =>
          mp.categoria === categoriaSeleccionada &&
          mp.type === tipoSeleccionado &&
          mp.medida === medidaSeleccionada &&
          (espesorSeleccionado
            ? mp.espesor === espesorSeleccionado
            : !mp.espesor || mp.espesor === "")
      );

      return material ? material.precio.toString() : null;
    },
    [rawsMaterialData]
  );

  // Función optimizada para manejar cambios en items específicos
  const handleItemChange = useCallback(
    (categoria, index, field, value) => {
      if (categoria === "herreria") {
        const newHerreria = [...herreria];
        if (field === "categoriaMP") {
          // Reset campos dependientes cuando cambia la categoría
          newHerreria[index] = {
            ...newHerreria[index],
            categoriaMP: value,
            tipoMP: "",
            medidaMP: "",
            espesorMP: "",
            valor: "",
            isPriceAuto: false,
          };
        } else if (field === "tipoMP") {
          // Reset campos dependientes cuando cambia el tipo
          newHerreria[index] = {
            ...newHerreria[index],
            tipoMP: value,
            medidaMP: "",
            espesorMP: "",
            valor: "",
            isPriceAuto: false,
          };
        } else if (field === "medidaMP") {
          // Reset campos dependientes cuando cambia la medida
          newHerreria[index] = {
            ...newHerreria[index],
            medidaMP: value,
            espesorMP: "",
            valor: "",
            isPriceAuto: false,
          };
          // Si no hay espesores disponibles, obtener precio directamente
          const espesoresDisponibles = getEspesorOptions(
            newHerreria[index].categoriaMP,
            newHerreria[index].tipoMP,
            value
          );
          if (espesoresDisponibles.length === 0) {
            const precio = getPrecioMaterial(
              newHerreria[index].categoriaMP,
              newHerreria[index].tipoMP,
              value,
              null
            );
            if (precio) {
              newHerreria[index].valor = precio;
              newHerreria[index].isPriceAuto = true;
            }
          }
        } else if (field === "espesorMP") {
          // Cuando se selecciona el espesor, obtener precio automáticamente
          newHerreria[index][field] = value;
          newHerreria[index].isPriceAuto = false;
          const precio = getPrecioMaterial(
            newHerreria[index].categoriaMP,
            newHerreria[index].tipoMP,
            newHerreria[index].medidaMP,
            value
          );
          if (precio) {
            newHerreria[index].valor = precio;
            newHerreria[index].isPriceAuto = true;
          }
        } else if (field === "valor") {
          // Para valores, quitar formato antes de guardar y marcar como no automático
          const unformatted = unformatCurrency(value);
          newHerreria[index][field] = unformatted;
          newHerreria[index].isPriceAuto = false;
        } else {
          newHerreria[index][field] = value;
        }
        setHerreria(newHerreria);
      } else if (categoria === "carpinteria") {
        const newCarpinteria = [...carpinteria];
        if (field === "categoriaMP") {
          newCarpinteria[index] = {
            ...newCarpinteria[index],
            categoriaMP: value,
            tipoMP: "",
            medidaMP: "",
            espesorMP: "",
            valor: "",
            isPriceAuto: false,
          };
        } else if (field === "tipoMP") {
          newCarpinteria[index] = {
            ...newCarpinteria[index],
            tipoMP: value,
            medidaMP: "",
            espesorMP: "",
            valor: "",
            isPriceAuto: false,
          };
        } else if (field === "medidaMP") {
          newCarpinteria[index] = {
            ...newCarpinteria[index],
            medidaMP: value,
            espesorMP: "",
            valor: "",
            isPriceAuto: false,
          };
          // Si no hay espesores disponibles, obtener precio directamente
          const espesoresDisponibles = getEspesorOptions(
            newCarpinteria[index].categoriaMP,
            newCarpinteria[index].tipoMP,
            value
          );
          if (espesoresDisponibles.length === 0) {
            const precio = getPrecioMaterial(
              newCarpinteria[index].categoriaMP,
              newCarpinteria[index].tipoMP,
              value,
              null
            );
            if (precio) {
              newCarpinteria[index].valor = precio;
              newCarpinteria[index].isPriceAuto = true;
            }
          }
        } else if (field === "espesorMP") {
          // Cuando se selecciona el espesor, obtener precio automáticamente
          newCarpinteria[index][field] = value;
          newCarpinteria[index].isPriceAuto = false;
          const precio = getPrecioMaterial(
            newCarpinteria[index].categoriaMP,
            newCarpinteria[index].tipoMP,
            newCarpinteria[index].medidaMP,
            value
          );
          if (precio) {
            newCarpinteria[index].valor = precio;
            newCarpinteria[index].isPriceAuto = true;
          }
        } else if (field === "valor") {
          const unformatted = unformatCurrency(value);
          newCarpinteria[index][field] = unformatted;
          newCarpinteria[index].isPriceAuto = false;
        } else {
          newCarpinteria[index][field] = value;
        }
        setCarpinteria(newCarpinteria);
      } else if (categoria === "pintura") {
        const newPintura = [...pintura];
        if (field === "categoriaMP") {
          newPintura[index] = {
            ...newPintura[index],
            categoriaMP: value,
            tipoMP: "",
            medidaMP: "",
            espesorMP: "",
            valor: "",
            isPriceAuto: false,
          };
        } else if (field === "tipoMP") {
          newPintura[index] = {
            ...newPintura[index],
            tipoMP: value,
            medidaMP: "",
            espesorMP: "",
            valor: "",
            isPriceAuto: false,
          };
        } else if (field === "medidaMP") {
          newPintura[index] = {
            ...newPintura[index],
            medidaMP: value,
            espesorMP: "",
            valor: "",
            isPriceAuto: false,
          };
          // Si no hay espesores disponibles, obtener precio directamente
          const espesoresDisponibles = getEspesorOptions(
            newPintura[index].categoriaMP,
            newPintura[index].tipoMP,
            value
          );
          if (espesoresDisponibles.length === 0) {
            const precio = getPrecioMaterial(
              newPintura[index].categoriaMP,
              newPintura[index].tipoMP,
              value,
              null
            );
            if (precio) {
              newPintura[index].valor = precio;
              newPintura[index].isPriceAuto = true;
            }
          }
        } else if (field === "espesorMP") {
          // Cuando se selecciona el espesor, obtener precio automáticamente
          newPintura[index][field] = value;
          newPintura[index].isPriceAuto = false;
          const precio = getPrecioMaterial(
            newPintura[index].categoriaMP,
            newPintura[index].tipoMP,
            newPintura[index].medidaMP,
            value
          );
          if (precio) {
            newPintura[index].valor = precio;
            newPintura[index].isPriceAuto = true;
          }
        } else if (field === "valor") {
          const unformatted = unformatCurrency(value);
          newPintura[index][field] = unformatted;
          newPintura[index].isPriceAuto = false;
        } else {
          newPintura[index][field] = value;
        }
        setPintura(newPintura);
      }
    },
    [herreria, carpinteria, pintura, getEspesorOptions, getPrecioMaterial]
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
    localStorage.setItem(
      "costify-plataformas-config",
      JSON.stringify(nuevaConfig)
    );
  };

  // Función para resetear configuración de plataformas a valores originales
  const resetearConfiguracionPlataformas = () => {
    const valoresOriginales = {
      mercadoLibre: 16.28,
      mercadoLibre3Cuotas: 41,
      valorNubeCuotas: 47,
      valorNube: 10,
    };
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
      },
    });

    // Resetear modo personalizado
    setModoPersonalizado(false);

    // Resetear arrays de materiales
    setHerreria([
      {
        categoriaMP: "",
        tipoMP: "",
        medidaMP: "",
        espesorMP: "",
        valor: "",
        cantidad: "",
        isPriceAuto: false,
      },
    ]);
    setCarpinteria([
      {
        categoriaMP: "",
        tipoMP: "",
        medidaMP: "",
        espesorMP: "",
        valor: "",
        cantidad: "",
        isPriceAuto: false,
      },
    ]);
    setPintura([
      {
        categoriaMP: "",
        tipoMP: "",
        medidaMP: "",
        espesorMP: "",
        valor: "",
        cantidad: "",
        isPriceAuto: false,
      },
    ]);

    // Resetear consumibles
    setConsumibles({
      herreria: "",
      carpinteria: "",
      pintura: "",
    });

    // Resetear extras
    setExtras({
      creditoCamioneta: { valor: "15000", porcentaje: "" },
      envio: { valor: "", porcentaje: "" },
      camposPersonalizados: [],
    });

    // Las configuraciones de plataformas NO se resetean
  };

  // Funciones auxiliares para obtener opciones en cascada
  const getCategoriaOptions = () => {
    const categorias = [...new Set(rawsMaterialData.map((mp) => mp.categoria))];
    return categorias.sort();
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
      // Buscar el ObjectId real de la materia prima
      const materiaPrimaId = encontrarMateriaPrimaId(
        item.categoriaMP,
        item.tipoMP,
        item.medidaMP,
        item.espesorMP
      );

      if (!materiaPrimaId) {
        return null; // Retornar null para filtrar después
      }

      return {
        categoria: categoria,
        materiaPrima: materiaPrimaId, // Usar ObjectId en lugar de string concatenado
        cantidad: parseFloat(item.cantidad) || 0,
        valor: parseFloat(item.valor) || 0,
        // Mantener campos de cascada para futuras referencias
        categoriaMP: item.categoriaMP || "",
        tipoMP: item.tipoMP || "",
        medidaMP: item.medidaMP || "",
        espesorMP: item.espesorMP || "",
      };
    };

    // Combinar todos los items con su categoría
    const allItems = [
      ...herreria
        .filter(
          (item) =>
            item.categoriaMP &&
            item.tipoMP &&
            item.medidaMP &&
            item.cantidad &&
            parseFloat(item.cantidad) > 0
        )
        .map((item) => limpiarItem(item, "herreria"))
        .filter(Boolean), // Filtrar items que no pudieron convertirse (sin ObjectId)
      ...carpinteria
        .filter(
          (item) =>
            item.categoriaMP &&
            item.tipoMP &&
            item.medidaMP &&
            item.cantidad &&
            parseFloat(item.cantidad) > 0
        )
        .map((item) => limpiarItem(item, "carpinteria"))
        .filter(Boolean), // Filtrar items que no pudieron convertirse
      ...pintura
        .filter(
          (item) =>
            item.categoriaMP &&
            item.tipoMP &&
            item.medidaMP &&
            item.cantidad &&
            parseFloat(item.cantidad) > 0
        )
        .map((item) => limpiarItem(item, "pintura"))
        .filter(Boolean), // Filtrar items que no pudieron convertirse
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
    };

    // Limpiar porcentajes (asegurar que sean números)
    const porcentajesLimpios = {
      herreria: parseFloat(form.porcentajesPorCategoria.herreria) || 0,
      carpinteria: parseFloat(form.porcentajesPorCategoria.carpinteria) || 0,
      pintura: parseFloat(form.porcentajesPorCategoria.pintura) || 0,
    };

    // Construir objeto con la estructura exacta que espera el backend
    const plantillaData = {
      nombre: form.nombre.trim(),
      tipoProyecto: form.tipoProyecto?.trim() || "Otro",
      items: allItems, // Array de items con ObjectIds de materiaPrima
      porcentajesPorCategoria: porcentajesLimpios,
      consumibles: consumiblesLimpios,
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
            {categoria}
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
          {items.map((item, index) => (
            <HStack
              key={index}
              spacing={2}
              p={3}
              border="1px"
              borderColor="gray.200"
              borderRadius="md"
              w="100%"
            >
              {/* Categoría */}
              <FormControl flex="3">
                <FormLabel fontSize="xs">Categoría</FormLabel>
                <Select
                  size="sm"
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
                  {getCategoriaOptions().map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </Select>
              </FormControl>

              {/* Tipo */}
              <FormControl flex="2">
                <FormLabel fontSize="xs">Tipo</FormLabel>
                <Select
                  size="sm"
                  placeholder="Tipo"
                  value={item.tipoMP}
                  isDisabled={!item.categoriaMP}
                  onChange={(e) =>
                    handleItemChange(categoria, index, "tipoMP", e.target.value)
                  }
                >
                  {getTipoOptions(item.categoriaMP).map((tipo) => (
                    <option key={tipo.value} value={tipo.value}>
                      {tipo.label}
                    </option>
                  ))}
                </Select>
              </FormControl>

              {/* Medida */}
              <FormControl flex="2">
                <FormLabel fontSize="xs">Medida</FormLabel>
                <Select
                  size="sm"
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
              </FormControl>

              {/* Espesor */}
              <FormControl flex="1.5">
                <FormLabel fontSize="xs">Espesor</FormLabel>
                <Select
                  size="sm"
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
              </FormControl>

              {/* Valor */}
              <FormControl flex="2">
                <FormLabel fontSize="xs">
                  Valor
                  {item.isPriceAuto && (
                    <Text as="span" color="green.500" fontSize="xs" ml={1}>
                      (Auto)
                    </Text>
                  )}
                </FormLabel>
                <Input
                  size="sm"
                  type="text"
                  placeholder="$1.000"
                  value={formatCurrency(item.valor)}
                  borderColor={item.isPriceAuto ? "green.300" : undefined}
                  _focus={{
                    borderColor: item.isPriceAuto ? "green.400" : "blue.400",
                    boxShadow: item.isPriceAuto
                      ? "0 0 0 1px var(--chakra-colors-green-400)"
                      : "0 0 0 1px var(--chakra-colors-blue-400)",
                  }}
                  bg={
                    item.isPriceAuto
                      ? { base: "green.50", _dark: "green.900" }
                      : undefined
                  }
                  onChange={(e) =>
                    handleItemChange(categoria, index, "valor", e.target.value)
                  }
                />
              </FormControl>

              {/* Cantidad */}
              <FormControl flex="1.5">
                <FormLabel fontSize="xs">Cantidad</FormLabel>
                <Input
                  size="sm"
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

              {/* Botón eliminar */}
              <IconButton
                icon={<FiMinus />}
                colorScheme="red"
                size="sm"
                onClick={() => removeItem(categoria, index)}
                isDisabled={items.length === 1}
                alignSelf="end"
              />
            </HStack>
          ))}

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
    <Box maxW="4xl" mx="auto" p={6}>
      <form onSubmit={handleSubmit}>
        <VStack spacing={8} align="stretch">
          {/* Botón de Reset */}
          <HStack justify="space-between" align="center">
            <Heading
              size="lg"
              color={useColorModeValue("gray.700", "gray.200")}
            >
              {PlantillasId ? "Editar Plantilla" : "Nueva Plantilla"}
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

          {/* Nombre de la plantilla */}
          <FormControl>
            <FormLabel fontSize="lg" fontWeight="bold">
              Nombre de la Plantilla
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

                <HStack spacing={4} wrap="wrap">
                  <FormControl maxW="200px">
                    <FormLabel fontSize="sm">MercadoLibre (%)</FormLabel>
                    <Input
                      name="plataforma_mercadoLibre"
                      type="number"
                      step="0.01"
                      value={porcentajesPlataformas.mercadoLibre}
                      onChange={handleChange}
                      size="sm"
                      textAlign="center"
                    />
                  </FormControl>

                  <FormControl maxW="200px">
                    <FormLabel fontSize="sm">
                      Mercado Libre 3 Cuotas (%)
                    </FormLabel>
                    <Input
                      name="plataforma_mercadoLibre3Cuotas"
                      type="number"
                      step="0.01"
                      value={porcentajesPlataformas.mercadoLibre3Cuotas}
                      onChange={handleChange}
                      size="sm"
                      textAlign="center"
                    />
                  </FormControl>

                  <FormControl maxW="200px">
                    <FormLabel fontSize="sm">Valor Nube Cuotas (%)</FormLabel>
                    <Input
                      name="plataforma_valorNubeCuotas"
                      type="number"
                      step="0.01"
                      value={porcentajesPlataformas.valorNubeCuotas}
                      onChange={handleChange}
                      size="sm"
                      textAlign="center"
                    />
                  </FormControl>

                  <FormControl maxW="200px">
                    <FormLabel fontSize="sm">Valor Nube (%)</FormLabel>
                    <Input
                      name="plataforma_valorNube"
                      type="number"
                      step="0.01"
                      value={porcentajesPlataformas.valorNube}
                      onChange={handleChange}
                      size="sm"
                      textAlign="center"
                    />
                  </FormControl>
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

                <HStack w="100%" justify="space-between" fontSize="lg">
                  <Text fontWeight="bold">
                    🛒 Precio MercadoLibre (
                    {porcentajesPlataformas.mercadoLibre}%):
                  </Text>
                  <Badge colorScheme="yellow" fontSize="lg" p={2}>
                    {formatPrice(precioMercadoLibre)}
                  </Badge>
                </HStack>

                <HStack w="100%" justify="space-between" fontSize="lg">
                  <Text fontWeight="bold">
                    💳 Precio ML 3 Cuotas (
                    {porcentajesPlataformas.mercadoLibre3Cuotas}%):
                  </Text>
                  <Badge colorScheme="purple" fontSize="lg" p={2}>
                    {formatPrice(precioML3Cuotas)}
                  </Badge>
                </HStack>

                <HStack w="100%" justify="space-between" fontSize="lg">
                  <Text fontWeight="bold">
                    ☁️ Valor Nube Cuotas (
                    {porcentajesPlataformas.valorNubeCuotas}%):
                  </Text>
                  <Badge colorScheme="cyan" fontSize="lg" p={2}>
                    {formatPrice(valorNubeCuotas)}
                  </Badge>
                </HStack>

                <HStack w="100%" justify="space-between" fontSize="lg">
                  <Text fontWeight="bold">
                    🌟 Valor Nube ({porcentajesPlataformas.valorNube}%):
                  </Text>
                  <Badge colorScheme="teal" fontSize="lg" p={2}>
                    {formatPrice(valorNube)}
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
