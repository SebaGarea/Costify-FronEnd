import { useState, useMemo, useEffect, useCallback, useRef } from "react";
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
  cantidad: 1,
  descripcion: "",
  esPersonalizado: false,
  nombrePersonalizado: "",
  valorPersonalizado: 0,
  ...overrides,
});

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

  const updateItems = useCallback(
    (updater) => {
      setItems((prev) => {
        const next =
          typeof updater === "function" ? updater(prev) : updater ?? [];
        if (next === prev) {
          return prev;
        }
        onItemsChange?.(next);
        return next;
      });
    },
    [onItemsChange]
  );

  useEffect(() => {
    setItems(controlledItems);
  }, [controlledItems]);

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

  const categoryOptions = useMemo(() => {
    const unique = new Map();
    sectionMaterials.forEach((mat) => {
      const categoria = mat?.categoria;
      if (!categoria) return;
      const key = normalizeText(categoria);
      if (!unique.has(key)) {
        unique.set(key, categoria);
      }
    });
    return Array.from(unique.values()).sort((a, b) =>
      a.localeCompare(b, "es", { sensitivity: "base" })
    );
  }, [sectionMaterials]);

  const getTipoOptions = useCallback(
    (categoriaSeleccionada) => {
      if (!categoriaSeleccionada) return [];
      const categoriaKey = normalizeText(categoriaSeleccionada);
      const unique = new Map();
      sectionMaterials.forEach((mat) => {
        if (normalizeText(mat?.categoria || "") !== categoriaKey) return;
        if (!mat?.type) return;
        const typeKey = normalizeText(mat.type);
        if (!unique.has(typeKey)) {
          unique.set(typeKey, {
            value: mat.type,
            label: getMaterialTypeLabel(mat.type),
          });
        }
      });
      return Array.from(unique.values()).sort((a, b) =>
        a.label.localeCompare(b.label, "es", { sensitivity: "base" })
      );
    },
    [sectionMaterials]
  );

  const getMedidaOptions = useCallback(
    (categoriaSeleccionada, tipoSeleccionado) => {
      if (!categoriaSeleccionada || !tipoSeleccionado) return [];
      const categoriaKey = normalizeText(categoriaSeleccionada);
      const tipoKey = normalizeText(tipoSeleccionado);
      const unique = new Map();
      sectionMaterials.forEach((mat) => {
        if (normalizeText(mat?.categoria || "") !== categoriaKey) return;
        if (normalizeText(mat?.type || "") !== tipoKey) return;
        if (!mat?.medida) return;
        const medidaKey = normalizeText(mat.medida);
        if (!unique.has(medidaKey)) {
          unique.set(medidaKey, mat.medida);
        }
      });
      return Array.from(unique.values()).sort((a, b) =>
        a.localeCompare(b, "es", { sensitivity: "base" })
      );
    },
    [sectionMaterials]
  );

  const getEspesorOptions = useCallback(
    (categoriaSeleccionada, tipoSeleccionado, medidaSeleccionada) => {
      if (!categoriaSeleccionada || !tipoSeleccionado || !medidaSeleccionada)
        return [];
      const categoriaKey = normalizeText(categoriaSeleccionada);
      const tipoKey = normalizeText(tipoSeleccionado);
      const medidaKey = normalizeText(medidaSeleccionada);
      const unique = new Map();
      sectionMaterials.forEach((mat) => {
        if (normalizeText(mat?.categoria || "") !== categoriaKey) return;
        if (normalizeText(mat?.type || "") !== tipoKey) return;
        if (normalizeText(mat?.medida || "") !== medidaKey) return;
        if (!mat?.espesor) return;
        const espesorKey = normalizeText(mat.espesor);
        if (!unique.has(espesorKey)) {
          unique.set(espesorKey, mat.espesor);
        }
      });
      return Array.from(unique.values()).sort((a, b) =>
        a.localeCompare(b, "es", { sensitivity: "base" })
      );
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
      if (!categoriaSeleccionada) return [];
      const categoriaKey = normalizeText(categoriaSeleccionada);
      const tipoKey = tipoSeleccionado ? normalizeText(tipoSeleccionado) : null;
      const medidaKey = medidaSeleccionada
        ? normalizeText(medidaSeleccionada)
        : null;
      const espesorKey = espesorSeleccionado
        ? normalizeText(espesorSeleccionado)
        : null;

      return sectionMaterials.filter((mat) => {
        if (normalizeText(mat?.categoria || "") !== categoriaKey) return false;
        if (tipoKey && normalizeText(mat?.type || "") !== tipoKey) return false;
        if (medidaKey && normalizeText(mat?.medida || "") !== medidaKey)
          return false;
        if (espesorKey && normalizeText(mat?.espesor || "") !== espesorKey)
          return false;
        return true;
      });
    },
    [sectionMaterials]
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
    updateItems((prev) => {
      let mutated = false;
      const next = prev.map((item) => {
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
      return mutated ? next : prev;
    });
  }, [items, updateItems, getEspesorOptions, pickFirstMaterial, materialsById]);

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
          materiaId: "",
          nombreMadera: "",
        };
        if (!value) return baseItem;
        const espOptions = getEspesorOptions(
          baseItem.categoria,
          baseItem.tipo,
          value
        );
        if ((espOptions || []).length > 0) {
          return baseItem;
        }
        const autoMaterial = pickFirstMaterial(
          baseItem.categoria,
          baseItem.tipo,
          value,
          ""
        );
        if (!autoMaterial) return baseItem;
        return {
          ...baseItem,
          materiaId: autoMaterial._id,
          nombreMadera: getMaterialDisplayName(autoMaterial),
        };
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
                      <NumberInput
                        min={0}
                        value={item.cantidad}
                        onChange={(_, valueNumber) =>
                          handleChange(
                            idx,
                            "cantidad",
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
                        ? { base: "repeat(1, 1fr)", lg: "repeat(16, 1fr)" }
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
                            isDisabled={
                              !item.categoria ||
                              !item.tipo ||
                              !item.medida ||
                              (showEspesorField && espesorOptions.length > 0 && !item.espesor)
                            }
                            size="sm"
                          >
                            {getMaterialOptions(
                              item.categoria,
                              item.tipo,
                              item.medida,
                              showEspesorField ? item.espesor : undefined
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
                          isDisabled={!item.tipo}
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
                    <GridItem colSpan={{ base: 12, lg: showMaterialField ? 1 : 1 }}>
                      <FormControl>
                        <FormLabel fontSize="sm">Cantidad</FormLabel>
                        <NumberInput
                          min={0}
                          value={item.cantidad}
                          onChange={(_, valueNumber) =>
                            handleChange(
                              idx,
                              "cantidad",
                              Number.isFinite(valueNumber) ? valueNumber : 0
                            )
                          }
                          size="sm"
                        >
                          <NumberInputField placeholder="0" />
                        </NumberInput>
                      </FormControl>
                    </GridItem>
                    <GridItem
                      colSpan={{
                        base: 12,
                        lg: showMaterialField ? 2 : isHerreria ? 2 : 1,
                      }}
                    >
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
                    <GridItem colSpan={{ base: 12, lg: showMaterialField ? 2 : 2 }}>
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

export default ListaCompraSeccion;
