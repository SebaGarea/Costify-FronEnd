import { useState, useMemo, useEffect, useCallback, useRef, memo } from "react";
import {
  Box,
  Heading,
  Stack,
  Button,
  Text,
  Input,
  NumberInput,
  NumberInputField,
  Select,
  IconButton,
  Grid,
  GridItem,
  FormControl,
  FormLabel,
  Flex,
  useColorModeValue,
} from "@chakra-ui/react";
import { AddIcon, DeleteIcon } from "@chakra-ui/icons";
import { getMaterialTypeLabel } from "../constants/materialTypes";

const currencyFormatter = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  maximumFractionDigits: 0,
});

const normalizeText = (value = "") =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();

const getMedidaSortKey = (value = "") => {
  const match = value.match(/^(\s*)(\d+[.,]?\d*)/);
  if (!match) return Number.POSITIVE_INFINITY;
  const numeric = parseFloat(match[2].replace(",", "."));
  return Number.isFinite(numeric) ? numeric : Number.POSITIVE_INFINITY;
};

const buildId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

const getMaterialDisplayName = (material) =>
  material?.nombreMadera?.trim() ||
  material?.nombre?.trim() ||
  material?.codigo?.trim() ||
  "";

const buildEmptyItem = (overrides = {}) => ({
  id: buildId(),
  categoria: "",
  tipo: "",
  medida: "",
  espesor: "",
  materiaId: "",
  nombreMadera: "",
  cantidad: "1",
  descripcion: "",
  esPersonalizado: false,
  nombrePersonalizado: "",
  valorPersonalizado: 0,
  ...overrides,
});

const formatQuantityValue = (value) => {
  if (value === null || value === undefined) return "";
  if (typeof value === "number") {
    return Number.isFinite(value) ? String(value) : "";
  }
  return String(value);
};

const normalizeQuantityInput = (value) => {
  if (value === null || value === undefined) return "";
  const raw = String(value).replace(/,/g, ".");
  if (!raw.trim()) return "";
  const [integerPartRaw, decimalPartRaw] = raw.split(".", 2);
  const sanitizedInteger = (integerPartRaw ?? "").replace(/[^0-9]/g, "");
  if (decimalPartRaw === undefined) {
    return sanitizedInteger;
  }
  const sanitizedDecimal = decimalPartRaw.replace(/[^0-9]/g, "");
  const baseInteger = sanitizedInteger || "0";
  if (!sanitizedDecimal) {
    return `${baseInteger}.`;
  }
  return `${baseInteger}.${sanitizedDecimal}`;
};

const ListaCompraSeccion = ({
  title,
  categorySlug,
  rawMaterials = [],
  onSubtotalChange,
  colorConfig = {},
  filterConfig,
  items: controlledItems = [],
  onItemsChange,
  showMaterialField = false,
  materialFieldLabel = "Materia prima",
}) => {
  const [items, setItems] = useState(controlledItems);
  const skipSyncRef = useRef(false);

  const updateItems = useCallback((updater) => {
    setItems((prev) => {
      const next =
        typeof updater === "function" ? updater(prev) : updater ?? [];
      return next === prev ? prev : next;
    });
  }, []);

  useEffect(() => {
    setItems((prev) => {
      if (prev === controlledItems) {
        return prev;
      }
      skipSyncRef.current = true;
      return controlledItems;
    });
  }, [controlledItems]);

  useEffect(() => {
    if (skipSyncRef.current) {
      skipSyncRef.current = false;
      return;
    }
    onItemsChange?.(items);
  }, [items, onItemsChange]);

  const noteBg = useColorModeValue(
    colorConfig.bg?.light ?? "yellow.50",
    colorConfig.bg?.dark ?? colorConfig.bg?.light ?? "yellow.800"
  );
  const noteBorder = useColorModeValue(
    colorConfig.border?.light ?? "yellow.200",
    colorConfig.border?.dark ?? colorConfig.border?.light ?? "yellow.500"
  );
  const headingColor = useColorModeValue(
    colorConfig.heading?.light ?? "gray.800",
    colorConfig.heading?.dark ?? "white"
  );
  const amountColor = useColorModeValue(
    colorConfig.accent?.light ?? "teal.600",
    colorConfig.accent?.dark ?? "teal.200"
  );
  const innerCardBg = useColorModeValue("white", "gray.900");
  const buttonScheme = colorConfig.buttonScheme ?? "teal";

  const materialsById = useMemo(() => {
    const map = new Map();
    rawMaterials.forEach((mat) => {
      if (mat?._id) {
        map.set(mat._id, mat);
      }
    });
    return map;
  }, [rawMaterials]);

  const sectionMaterials = useMemo(() => {
    const normalizedFilterList = (filterConfig?.categories || []).map((value) =>
      normalizeText(value)
    );

    return rawMaterials.filter((mat) => {
      const normalized = normalizeText(mat?.categoria || "");
      if (!normalized) return false;

      if (filterConfig?.mode === "include") {
        return normalizedFilterList.some((target) =>
          normalized.includes(target)
        );
      }

      if (filterConfig?.mode === "exclude") {
        return !normalizedFilterList.some((target) =>
          normalized.includes(target)
        );
      }

      if (!categorySlug) return true;
      if (normalized === categorySlug) return true;
      return normalized.includes(categorySlug);
    });
  }, [rawMaterials, categorySlug, filterConfig]);

  const materialIndex = useMemo(() => {
    const categorias = new Map();
    const tiposByCategoria = new Map();
    const medidasByCatTipo = new Map();
    const espesoresByCatTipoMedida = new Map();
    const materialesByCatTipoMedida = new Map();
    const materialesByCatTipoMedidaEspesor = new Map();

    const ensureMap = (map, key, build) => {
      if (!map.has(key)) {
        map.set(key, build());
      }
      return map.get(key);
    };

    sectionMaterials.forEach((mat) => {
      const categoria = mat?.categoria || "";
      const categoriaKey = normalizeText(categoria);
      if (!categoriaKey) return;
      categorias.set(categoriaKey, categoria);

      const typeValue = mat?.type || "";
      const typeKey = normalizeText(typeValue);
      if (typeKey) {
        const tiposMap = ensureMap(tiposByCategoria, categoriaKey, () => new Map());
        if (!tiposMap.has(typeKey)) {
          tiposMap.set(typeKey, {
            value: typeValue,
            label: getMaterialTypeLabel(typeValue),
          });
        }
      }

      const medidaValue = mat?.medida || "";
      const medidaKey = normalizeText(medidaValue);
      const espesorValue = mat?.espesor || "";
      const espesorKey = normalizeText(espesorValue);

      if (typeKey && medidaKey) {
        const medidaMap = ensureMap(
          medidasByCatTipo,
          `${categoriaKey}||${typeKey}`,
          () => new Map()
        );
        if (!medidaMap.has(medidaKey)) {
          medidaMap.set(medidaKey, medidaValue);
        }
      }

      if (typeKey && medidaKey && espesorKey) {
        const espesorMap = ensureMap(
          espesoresByCatTipoMedida,
          `${categoriaKey}||${typeKey}||${medidaKey}`,
          () => new Map()
        );
        if (!espesorMap.has(espesorKey)) {
          espesorMap.set(espesorKey, espesorValue);
        }
      }

      if (typeKey && medidaKey) {
        const listKey = `${categoriaKey}||${typeKey}||${medidaKey}`;
        ensureMap(materialesByCatTipoMedida, listKey, () => []).push(mat);
        if (espesorKey) {
          const listKeyEspesor = `${listKey}||${espesorKey}`;
          ensureMap(materialesByCatTipoMedidaEspesor, listKeyEspesor, () => []).push(mat);
        }
      }
    });

    const toSortedArray = (map, sorter) =>
      Array.from(map.values()).sort(sorter);

    const sortedCategorias = Array.from(categorias.values()).sort((a, b) =>
      a.localeCompare(b, "es", { sensitivity: "base" })
    );

    const sortedTiposByCategoria = new Map();
    tiposByCategoria.forEach((value, key) => {
      sortedTiposByCategoria.set(
        key,
        toSortedArray(value, (a, b) =>
          a.label.localeCompare(b.label, "es", { sensitivity: "base" })
        )
      );
    });

    const sortedMedidasByCatTipo = new Map();
    medidasByCatTipo.forEach((value, key) => {
      sortedMedidasByCatTipo.set(
        key,
        toSortedArray(value, (a, b) =>
          a.localeCompare(b, "es", { sensitivity: "base" })
        )
      );
    });

    const sortedEspesoresByCatTipoMedida = new Map();
    espesoresByCatTipoMedida.forEach((value, key) => {
      sortedEspesoresByCatTipoMedida.set(
        key,
        toSortedArray(value, (a, b) =>
          a.localeCompare(b, "es", { sensitivity: "base" })
        )
      );
    });

    return {
      categorias: sortedCategorias,
      tiposByCategoria: sortedTiposByCategoria,
      medidasByCatTipo: sortedMedidasByCatTipo,
      espesoresByCatTipoMedida: sortedEspesoresByCatTipoMedida,
      materialesByCatTipoMedida,
      materialesByCatTipoMedidaEspesor,
    };
  }, [sectionMaterials]);

  const categoryOptions = useMemo(
    () => materialIndex.categorias,
    [materialIndex]
  );

  const getTipoOptions = useCallback(
    (categoriaSeleccionada) => {
      if (!categoriaSeleccionada) return [];
      const categoriaKey = normalizeText(categoriaSeleccionada);
      return materialIndex.tiposByCategoria.get(categoriaKey) || [];
    },
    [materialIndex]
  );

  const getMedidaOptions = useCallback(
    (categoriaSeleccionada, tipoSeleccionado) => {
      if (!categoriaSeleccionada || !tipoSeleccionado) return [];
      const categoriaKey = normalizeText(categoriaSeleccionada);
      const tipoKey = normalizeText(tipoSeleccionado);
      return (
        materialIndex.medidasByCatTipo.get(`${categoriaKey}||${tipoKey}`) || []
      );
    },
    [materialIndex]
  );

  const getEspesorOptions = useCallback(
    (categoriaSeleccionada, tipoSeleccionado, medidaSeleccionada) => {
      if (!categoriaSeleccionada || !tipoSeleccionado || !medidaSeleccionada) {
        return [];
      }
      const categoriaKey = normalizeText(categoriaSeleccionada);
      const tipoKey = normalizeText(tipoSeleccionado);
      const medidaKey = normalizeText(medidaSeleccionada);
      return (
        materialIndex.espesoresByCatTipoMedida.get(
          `${categoriaKey}||${tipoKey}||${medidaKey}`
        ) || []
      );
    },
    [materialIndex]
  );

  const getMaterialOptionsByCatTipo = useCallback(
    (categoriaSeleccionada, tipoSeleccionado) => {
      if (!categoriaSeleccionada || !tipoSeleccionado) return [];
      
      // Traer directamente desde sectionMaterials filtrando por categoria y tipo
      const materialesFiltered = sectionMaterials.filter((mat) => {
        const matCategoria = normalizeText(mat?.categoria || "");
        const matTipo = normalizeText(mat?.type || "");
        const selectedCategoria = normalizeText(categoriaSeleccionada);
        const selectedTipo = normalizeText(tipoSeleccionado);
        
        return matCategoria === selectedCategoria && matTipo === selectedTipo;
      });
      
      // Eliminar duplicados por _id
      const uniqueMaterials = Array.from(
        new Map(materialesFiltered.map((m) => [m._id, m])).values()
      );
      
      return uniqueMaterials;
    },
    [sectionMaterials]
  );

  const getMaterialOptions = useCallback(
    (
      categoriaSeleccionada,
      tipoSeleccionado,
      medidaSeleccionada,
      espesorSeleccionado
    ) => {
      if (!categoriaSeleccionada || !tipoSeleccionado || !medidaSeleccionada) return [];
      const categoriaKey = normalizeText(categoriaSeleccionada);
      const tipoKey = normalizeText(tipoSeleccionado);
      const medidaKey = normalizeText(medidaSeleccionada);
      const baseKey = `${categoriaKey}||${tipoKey}||${medidaKey}`;
      if (espesorSeleccionado) {
        const espesorKey = normalizeText(espesorSeleccionado);
        return materialIndex.materialesByCatTipoMedidaEspesor.get(
          `${baseKey}||${espesorKey}`
        ) || [];
      }
      return materialIndex.materialesByCatTipoMedida.get(baseKey) || [];
    },
    [materialIndex]
  );

  const pickFirstMaterial = useCallback(
    (categoria, tipo, medida, espesor) => {
      if (!categoria || !tipo || !medida) return null;
      const [firstMatch] = getMaterialOptions(
        categoria,
        tipo,
        medida,
        espesor
      );
      return firstMatch || null;
    },
    [getMaterialOptions]
  );

  useEffect(() => {
    let mutated = false;
    const next = items.map((item) => {
      if (!item) return item;
      if (item.esPersonalizado) return item;
      if (item.materiaId) {
        if (!item.nombreMadera) {
          const mat = materialsById.get(item.materiaId);
          if (mat) {
            mutated = true;
            return {
              ...item,
              nombreMadera: getMaterialDisplayName(mat),
            };
          }
        }
        return item;
      }
      if (!item.categoria || !item.tipo || !item.medida) return item;
      const espOptions = getEspesorOptions(
        item.categoria,
        item.tipo,
        item.medida
      );
      if (espOptions.length > 0 && !item.espesor) {
        return item;
      }
      const autoMaterial = pickFirstMaterial(
        item.categoria,
        item.tipo,
        item.medida,
        item.espesor
      );
      if (!autoMaterial) return item;
      mutated = true;
      return {
        ...item,
        materiaId: autoMaterial._id,
        nombreMadera: getMaterialDisplayName(autoMaterial),
      };
    });

    if (!mutated) {
      return;
    }
    setItems(next);
  }, [items, getEspesorOptions, pickFirstMaterial, materialsById]);

  const getMaterialPrice = (materiaId) => {
    const material = materialsById.get(materiaId);
    const parsed = Number(material?.precio ?? 0);
    return Number.isFinite(parsed) ? parsed : 0;
  };

  const getUnitPrice = (item) => {
    if (item?.esPersonalizado) {
      const manualValue = Number(item?.valorPersonalizado ?? 0);
      return Number.isFinite(manualValue) ? manualValue : 0;
    }
    return getMaterialPrice(item?.materiaId);
  };

  const subtotal = useMemo(
    () =>
      items.reduce((acc, item) => {
        const cantidad = Number(item.cantidad) || 0;
        return acc + getUnitPrice(item) * cantidad;
      }, 0),
    [items, materialsById]
  );

  const lastReportedSubtotal = useRef(null);

  useEffect(() => {
    if (lastReportedSubtotal.current === subtotal) return;
    lastReportedSubtotal.current = subtotal;
    onSubtotalChange?.(subtotal);
  }, [subtotal, onSubtotalChange]);

  const handleAdd = () => {
    updateItems((prev) => [...prev, buildEmptyItem()]);
  };

  const handleAddManual = () => {
    updateItems((prev) => [
      ...prev,
      buildEmptyItem({ esPersonalizado: true }),
    ]);
  };

  const handleCategoryChange = (idx, value) => {
    updateItems((prev) =>
      prev.map((item, index) =>
        index === idx
          ? {
              ...item,
              categoria: value,
              tipo: "",
              medida: "",
              espesor: "",
              materiaId: "",
              nombreMadera: "",
            }
          : item
      )
    );
  };

  const handleTipoChange = (idx, value) => {
    updateItems((prev) =>
      prev.map((item, index) =>
        index === idx
          ? {
              ...item,
              tipo: value,
              medida: "",
              espesor: "",
              materiaId: "",
              nombreMadera: "",
            }
          : item
      )
    );
  };

  const handleMedidaChange = (idx, value) => {
    updateItems((prev) =>
      prev.map((item, index) => {
        if (index !== idx) return item;
        const baseItem = {
          ...item,
          medida: value,
          espesor: "",
          // Preservar materiaId y nombreMadera si ya están seleccionados
        };
        if (!value) {
          return {
            ...baseItem,
            materiaId: "",
            nombreMadera: "",
          };
        }
        return baseItem;
      })
    );
  };

  const handleEspesorChange = (idx, value) => {
    updateItems((prev) =>
      prev.map((item, index) => {
        if (index !== idx) return item;
        const autoMaterial = pickFirstMaterial(
          item.categoria,
          item.tipo,
          item.medida,
          value
        );
        return {
          ...item,
          espesor: value,
          materiaId: autoMaterial?._id ?? "",
          nombreMadera: autoMaterial
            ? getMaterialDisplayName(autoMaterial)
            : item.nombreMadera,
        };
      })
    );
  };

  const handleMaterialSelect = (idx, materialId) => {
    updateItems((prev) =>
      prev.map((item, index) => {
        if (index !== idx) return item;
        if (!materialId) {
          return {
            ...item,
            materiaId: "",
            nombreMadera: "",
          };
        }
        const material = materialsById.get(materialId);
        return {
          ...item,
          materiaId: materialId,
          nombreMadera: getMaterialDisplayName(material),
        };
      })
    );
  };

  const handleChange = (idx, field, value) => {
    updateItems((prev) =>
      prev.map((item, index) =>
        index === idx ? { ...item, [field]: value } : item
      )
    );
  };

  const handleRemove = (idx) => {
    updateItems((prev) => prev.filter((_, index) => index !== idx));
  };

  const lineTotal = (item) => {
    const cantidad = Number(item.cantidad) || 0;
    return getUnitPrice(item) * cantidad;
  };

  const isHerreria = categorySlug === "herreria";

  return (
    <Box
      p={5}
      borderRadius="2xl"
      borderWidth="1px"
      borderColor={noteBorder}
      bg={noteBg}
      boxShadow="xl"
      minH="360px"
    >
      <Heading
        size="md"
        mb={4}
        fontFamily="'Space Grotesk', 'DM Sans', sans-serif"
        color={headingColor}
      >
        {title}
      </Heading>
      <Stack spacing={4}>
        {items.map((item, idx) => {
          const espesorOptions =
            item.medida && item.categoria && item.tipo
              ? getEspesorOptions(item.categoria, item.tipo, item.medida)
              : [];
          const showEspesorField = (espesorOptions || []).length > 0;
          const quantityValue = formatQuantityValue(item.cantidad);

          return (
            <Box key={item.id} p={4} borderRadius="xl" bg={innerCardBg} boxShadow="lg">
            <Stack spacing={3}>
              {item.esPersonalizado ? (
                <Grid templateColumns={{ base: "repeat(1, 1fr)", lg: "repeat(12, 1fr)" }} gap={2} alignItems="flex-end">
                  <GridItem colSpan={{ base: 12, lg: 4 }}>
                    <FormControl>
                      <FormLabel fontSize="sm">Nombre del material</FormLabel>
                      <Input
                        placeholder="Ej: Tornillo especial"
                        value={item.nombrePersonalizado}
                        onChange={(e) =>
                          handleChange(idx, "nombrePersonalizado", e.target.value)
                        }
                        size="sm"
                      />
                    </FormControl>
                  </GridItem>
                  <GridItem colSpan={{ base: 12, lg: 4 }}>
                    <FormControl>
                      <FormLabel fontSize="sm">Valor unitario</FormLabel>
                      <NumberInput
                        min={0}
                        value={item.valorPersonalizado || 0}
                        onChange={(_, valueNumber) =>
                          handleChange(
                            idx,
                            "valorPersonalizado",
                            Number.isFinite(valueNumber) ? valueNumber : 0
                          )
                        }
                        size="sm"
                      >
                        <NumberInputField placeholder="0" />
                      </NumberInput>
                    </FormControl>
                  </GridItem>
                  <GridItem colSpan={{ base: 12, lg: 2 }}>
                    <FormControl>
                      <FormLabel fontSize="sm">Cantidad</FormLabel>
                      <Input
                        type="text"
                        inputMode="decimal"
                        pattern="[0-9]*[.,]?[0-9]*"
                        placeholder="0"
                        size="sm"
                        value={quantityValue}
                        onChange={(event) =>
                          handleChange(
                            idx,
                            "cantidad",
                            normalizeQuantityInput(event.target.value)
                          )
                        }
                      />
                    </FormControl>
                  </GridItem>
                  <GridItem colSpan={{ base: 12, lg: 2 }}>
                    <FormControl>
                      <FormLabel fontSize="sm">Sub-total</FormLabel>
                      <Flex gap={2} align="center">
                        <Input
                          value={currencyFormatter.format(lineTotal(item))}
                          readOnly
                          placeholder="$0"
                          size="sm"
                          flex="1"
                        />
                        <IconButton
                          aria-label="Eliminar"
                          icon={<DeleteIcon />}
                          colorScheme="red"
                          size="sm"
                          variant="ghost"
                          onClick={() => handleRemove(idx)}
                        />
                      </Flex>
                    </FormControl>
                  </GridItem>
                </Grid>
              ) : (
                <>
                  <Grid
                    templateColumns={
                      showMaterialField
                        ? { base: "repeat(1, 1fr)", lg: "repeat(18, 1fr)" }
                        : isHerreria
                        ? { base: "repeat(1, 1fr)", lg: "repeat(14, 1fr)" }
                        : { base: "repeat(1, 1fr)", lg: "repeat(12, 1fr)" }
                    }
                    gap={2}
                    alignItems="flex-end"
                  >
                    <GridItem colSpan={{ base: 12, lg: 2 }}>
                      <FormControl>
                        <FormLabel fontSize="sm">Categoría</FormLabel>
                        <Select
                          placeholder="Categoría"
                          value={item.categoria}
                          onChange={(e) => handleCategoryChange(idx, e.target.value)}
                          isDisabled={!categoryOptions.length}
                          size="sm"
                        >
                          {categoryOptions.map((option) => (
                            <option key={option} value={option}>
                              {typeof option === "string"
                                ? option.toUpperCase()
                                : option}
                            </option>
                          ))}
                        </Select>
                      </FormControl>
                    </GridItem>
                    <GridItem colSpan={{ base: 12, lg: 2 }}>
                      <FormControl>
                        <FormLabel fontSize="sm">Tipo</FormLabel>
                        <Select
                          placeholder="Tipo"
                          value={item.tipo}
                          onChange={(e) => handleTipoChange(idx, e.target.value)}
                          isDisabled={!item.categoria}
                          size="sm"
                        >
                          {getTipoOptions(item.categoria).map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </Select>
                      </FormControl>
                    </GridItem>
                    {showMaterialField && (
                      <GridItem colSpan={{ base: 12, lg: 3 }}>
                        <FormControl>
                          <FormLabel fontSize="sm">{materialFieldLabel}</FormLabel>
                          <Select
                            placeholder="Seleccioná un material"
                            value={item.materiaId}
                            onChange={(e) => handleMaterialSelect(idx, e.target.value)}
                            isDisabled={!item.categoria || !item.tipo}
                            size="sm"
                          >
                            {getMaterialOptionsByCatTipo(
                              item.categoria,
                              item.tipo
                            ).map((mat) => (
                              <option key={mat._id} value={mat._id}>
                                {getMaterialDisplayName(mat) || "Material"}
                              </option>
                            ))}
                          </Select>
                        </FormControl>
                      </GridItem>
                    )}
                    <GridItem colSpan={{ base: 12, lg: 2 }}>
                      <FormControl>
                        <FormLabel fontSize="sm">Medida</FormLabel>
                        <Select
                          placeholder="Medida"
                          value={item.medida}
                          onChange={(e) => handleMedidaChange(idx, e.target.value)}
                          isDisabled={!item.tipo || (showMaterialField && !item.materiaId)}
                          size="sm"
                        >
                          {getMedidaOptions(item.categoria, item.tipo).map((option) => (
                            <option key={option} value={option}>
                              {option}
                            </option>
                          ))}
                        </Select>
                      </FormControl>
                    </GridItem>
                    {showEspesorField && (
                      <GridItem colSpan={{ base: 12, lg: 2 }}>
                        <FormControl>
                          <FormLabel fontSize="sm">Espesor</FormLabel>
                          <Select
                            placeholder="Espesor"
                            value={item.espesor}
                            onChange={(e) => handleEspesorChange(idx, e.target.value)}
                            isDisabled={!item.medida}
                            size="sm"
                          >
                            {espesorOptions.map((option) => (
                              <option key={option} value={option}>
                                {option}
                              </option>
                            ))}
                          </Select>
                        </FormControl>
                      </GridItem>
                    )}
                    <GridItem colSpan={{ base: 12, lg: 1 }}>
                      <FormControl>
                        <FormLabel fontSize="sm">Cantidad</FormLabel>
                        <Input
                          type="text"
                          inputMode="decimal"
                          pattern="[0-9]*[.,]?[0-9]*"
                          placeholder="0"
                          size="sm"
                          value={quantityValue}
                          onChange={(event) =>
                            handleChange(
                              idx,
                              "cantidad",
                              normalizeQuantityInput(event.target.value)
                            )
                          }
                        />
                      </FormControl>
                    </GridItem>
                    <GridItem colSpan={{ base: 12, lg: showMaterialField ? 2 : 2 }}>
                      <FormControl>
                        <FormLabel fontSize="sm">Valor</FormLabel>
                        <Input
                          value={currencyFormatter.format(getUnitPrice(item) || 0)}
                          readOnly
                          placeholder="$0"
                          size="sm"
                        />
                      </FormControl>
                    </GridItem>
                    <GridItem colSpan={{ base: 12, lg: showMaterialField ? 3 : 2 }}>
                      <FormControl>
                        <FormLabel fontSize="sm">Sub-total</FormLabel>
                        <Flex gap={2} align="center">
                          <Input
                            value={currencyFormatter.format(lineTotal(item))}
                            readOnly
                            placeholder="$0"
                            size="sm"
                            flex="1"
                          />
                          <IconButton
                            aria-label="Eliminar"
                            icon={<DeleteIcon />}
                            colorScheme="red"
                            size="sm"
                            variant="ghost"
                            onClick={() => handleRemove(idx)}
                          />
                        </Flex>
                      </FormControl>
                    </GridItem>
                  </Grid>
                </>
              )}

            </Stack>
          </Box>
          );
        })}
        {!items.length && (
          <Text fontSize="sm" color="gray.600">
            Agregá ítems para esta sección (también podés crear uno manual).
          </Text>
        )}
        <Stack direction={{ base: "column", sm: "row" }} spacing={3}>
          <Button
            leftIcon={<AddIcon />}
            onClick={handleAdd}
            colorScheme={buttonScheme}
            variant="solid"
            isDisabled={!sectionMaterials.length}
          >
            Agregar ítem
          </Button>
          <Button
            leftIcon={<AddIcon />}
            onClick={handleAddManual}
            colorScheme={buttonScheme}
            variant="outline"
          >
            Agregar ítem manual
          </Button>
        </Stack>
      </Stack>
      <Text mt={6} fontWeight="bold" fontSize="lg" textAlign="right" color={amountColor}>
        Subtotal: {currencyFormatter.format(subtotal)}
      </Text>
      {!sectionMaterials.length && (
        <Text mt={2} fontSize="xs" color="gray.600" textAlign="right">
          No hay materias primas registradas para esta categoría.
        </Text>
      )}
    </Box>
  );
};

export default memo(ListaCompraSeccion);
