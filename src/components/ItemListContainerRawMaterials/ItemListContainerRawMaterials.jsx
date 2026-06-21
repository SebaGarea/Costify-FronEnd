import {
  AlertDialog,
  AlertDialogBody,
  AlertDialogCloseButton,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogOverlay,
  Box,
  Button,
  Flex,
  Grid,
  GridItem,
  Heading,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  Spinner,
  Stack,
  Text,
  useColorModeValue,
  useDisclosure,
} from "@chakra-ui/react";
import { FiChevronDown, FiPlus, FiUploadCloud, FiDownload } from "react-icons/fi";
import { RiArrowRightLine } from "react-icons/ri";
import { Link } from "react-router-dom";
import { useCategoryMp } from "../../hooks/materiasPrimas";
import { useRef } from "react";
import { getMaterialTypeLabel } from "../../constants/materialTypes";

export const ItemListContainerRawMaterials = ({
  rawMaterials = [],
  pagination,
  filters = {},
  filtersMeta = {},
  onPageChange,
  onFiltersChange,
  isLoading,
  onExport,
  isExporting = false,
  onDeleteAll,
  isDeletingAll,
}) => {
  const { categoriesMp } = useCategoryMp();
  const toolbarBg = useColorModeValue("gray.100", "gray.800");
  const cardBg = useColorModeValue("white", "gray.800");
  const border = useColorModeValue("gray.200", "gray.700");
  const hoverBorder = useColorModeValue("teal.500", "teal.300");
  const muted = useColorModeValue("gray.600", "gray.400");
  const deleteDialog = useDisclosure();
  const cancelRef = useRef();
  const canBulkDelete = typeof onDeleteAll === "function";
  const scrollableMenuProps = {
    maxH: "260px",
    overflowY: "auto",
    overscrollBehavior: "contain",
  };

  const sanitizedMaterials = Array.isArray(rawMaterials) ? rawMaterials.filter(Boolean) : [];
  const fallbackLimit = Number.isFinite(Number(pagination?.limit)) ? Math.max(1, Number(pagination.limit)) : 10;
  const pageLimit = fallbackLimit || 10;

  const totalItems = pagination?.total ?? sanitizedMaterials.length;
  const totalPages = pagination?.totalPages ?? Math.max(1, Math.ceil(totalItems / pageLimit));
  const currentPage = pagination?.page ?? 1;

  const shouldChunkLocally = sanitizedMaterials.length > pageLimit;
  const startIndex = shouldChunkLocally ? (currentPage - 1) * pageLimit : 0;
  const endIndex = startIndex + pageLimit;
  const materialsToRender = sanitizedMaterials.slice(startIndex, endIndex);

  const selectedCategory = filters.category ?? null;
  const selectedType = filters.type ?? null;
  const selectedMedida = filters.medida ?? null;
  const selectedNombreMadera = filters.nombreMadera ?? null;

  const availableTypes = filtersMeta.availableTypes ?? [];
  const availableMedidas = filtersMeta.availableMedidas ?? [];
  const availableNombresMadera = filtersMeta.availableNombresMadera ?? [];

  const formatPrice = (value) => {
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) return "Sin precio";

    const truncated = Math.trunc(parsed * 100) / 100;
    const hasDecimals = Math.abs(truncated % 1) > 0;
    const localeOptions = hasDecimals
      ? { minimumFractionDigits: 2, maximumFractionDigits: 2 }
      : { minimumFractionDigits: 0, maximumFractionDigits: 0 };

    const formatted = truncated.toLocaleString("es-AR", localeOptions);
    return `$${formatted}`;
  };

  const formatUpdatedAt = (value) => {
    if (!value) return "Sin registro";
    try {
      return new Date(value).toLocaleString("es-AR", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "Sin registro";
    }
  };

  const handleCategoryChange = (category) => {
    onFiltersChange?.({ ...filters, category, type: null, medida: null });
  };

  const handleTypeChange = (type) => {
    onFiltersChange?.({ ...filters, type, nombreMadera: null, medida: null });
  };

  const handleMedidaChange = (medida) => {
    onFiltersChange?.({ ...filters, medida });
  };

  const handleNombreMaderaChange = (nombreMadera) => {
    onFiltersChange?.({ ...filters, nombreMadera, type: null, medida: null });
  };

  const handleClearFilters = () => {
    onFiltersChange?.({ ...filters, category: null, type: null, medida: null, nombreMadera: null });
  };

  const goPrev = () => {
    if (currentPage > 1) {
      onPageChange?.(currentPage - 1);
    }
  };

  const goNext = () => {
    if (currentPage < totalPages) {
      onPageChange?.(currentPage + 1);
    }
  };

  const detailLabelColor = useColorModeValue("gray.600", "gray.300");
  const detailValueColor = useColorModeValue("teal.700", "teal.200");

  const renderDetail = (label, value, tnum = false) => (
    <Text fontSize="sm" color={detailLabelColor}>
      {label}: <Text as="span" fontWeight="semibold" color={detailValueColor} className={tnum ? "tnum" : undefined}>{value}</Text>
    </Text>
  );

  return (
    <Stack spacing={6} align="stretch">
      <Box bg={toolbarBg} borderRadius="xl" borderWidth="1px" borderColor={border} p={3}>
        {/* Todo en una fila en desktop, responsive en mobile */}
        <Flex 
          direction={{ base: "column", md: "row" }} 
          gap={3} 
          align={{ base: "stretch", md: "center" }}
          flexWrap={{ base: "nowrap", md: "wrap" }}
        >
          {/* Filtros */}
          <Menu matchWidth>
            <MenuButton as={Button} rightIcon={<FiChevronDown />} textTransform="capitalize" w={{ base: "full", md: "auto" }} minW={{ base: "auto", md: "140px" }}>
              {selectedCategory || "Categoría"}
            </MenuButton>
            <MenuList {...scrollableMenuProps}>
              {categoriesMp.map((cat) => (
                <MenuItem key={cat.nombre} textTransform="capitalize" onClick={() => handleCategoryChange(cat.nombre)}>
                  {cat.nombre}
                </MenuItem>
              ))}
            </MenuList>
          </Menu>

          <Menu isDisabled={!selectedCategory} matchWidth>
            <MenuButton as={Button} rightIcon={<FiChevronDown />} textTransform="capitalize" w={{ base: "full", md: "auto" }} minW={{ base: "auto", md: "140px" }}>
              {selectedType || "Tipo"}
            </MenuButton>
            <MenuList {...scrollableMenuProps}>
              {availableTypes.length === 0 ? (
                <MenuItem disabled>Sin tipos</MenuItem>
              ) : (
                availableTypes.map((tipo) => (
                  <MenuItem key={tipo} textTransform="capitalize" onClick={() => handleTypeChange(tipo)}>
                    {tipo}
                  </MenuItem>
                ))
              )}
            </MenuList>
          </Menu>

          {/* Dropdown Nombre de madera (solo si la categoría es Madera) */}
          {selectedCategory?.toLowerCase() === "madera" && (
            <Menu matchWidth>
              <MenuButton as={Button} rightIcon={<FiChevronDown />} textTransform="capitalize" w={{ base: "full", md: "auto" }} minW={{ base: "auto", md: "140px" }}>
                {selectedNombreMadera || "Nombre Madera"}
              </MenuButton>
              <MenuList {...scrollableMenuProps}>
                {availableNombresMadera.length === 0 ? (
                  <MenuItem disabled>Sin nombres</MenuItem>
                ) : (
                  availableNombresMadera.map((nombre) => (
                    <MenuItem key={nombre} textTransform="capitalize" onClick={() => handleNombreMaderaChange(nombre)}>
                      {nombre}
                    </MenuItem>
                  ))
                )}
              </MenuList>
            </Menu>
          )}

          <Menu isDisabled={!selectedType && !selectedNombreMadera} matchWidth>
            <MenuButton as={Button} rightIcon={<FiChevronDown />} textTransform="capitalize" w={{ base: "full", md: "auto" }} minW={{ base: "auto", md: "140px" }}>
              {selectedMedida || "Medida"}
            </MenuButton>
            <MenuList {...scrollableMenuProps}>
              {availableMedidas.length === 0 ? (
                <MenuItem disabled>Sin medidas</MenuItem>
              ) : (
                availableMedidas.map((medida) => (
                  <MenuItem key={medida} textTransform="capitalize" onClick={() => handleMedidaChange(medida)}>
                    {medida}
                  </MenuItem>
                ))
              )}
            </MenuList>
          </Menu>

          {/* Botón borrar filtros inline */}
          {(selectedCategory || selectedType || selectedMedida || selectedNombreMadera) && (
            <Button variant="outline" colorScheme="red" onClick={handleClearFilters} w={{ base: "full", md: "auto" }}>
              Borrar filtros
            </Button>
          )}

          {/* Botones de acciones */}
          <Button
            as={Link}
            to="/materias-primas/itemAdd"
            colorScheme="teal"
            leftIcon={<FiPlus />}
            w={{ base: "full", md: "auto" }}
          >
            Agregar materia prima
          </Button>
          <Button 
            as={Link} 
            to="/materias-primas/import" 
            variant="outline" 
            leftIcon={<FiUploadCloud />}
            w={{ base: "full", md: "auto" }}
          >
            Subir Excel
          </Button>
          <Button
            variant="outline"
            leftIcon={<FiDownload />}
            onClick={onExport}
            isLoading={isExporting}
            isDisabled={isLoading || typeof onExport !== "function"}
            w={{ base: "full", md: "auto" }}
          >
            Exportar Excel
          </Button>
          <Button
            colorScheme="red"
            variant="outline"
            onClick={deleteDialog.onOpen}
            isDisabled={!canBulkDelete || isLoading || isDeletingAll || sanitizedMaterials.length === 0}
            w={{ base: "full", md: "auto" }}
            ml={{ base: 0, md: "auto" }}
          >
            Eliminar todo
          </Button>
        </Flex>
      </Box>

      <Box py={4} px={{ base: 0, md: 2 }}>
        {isLoading ? (
          <Flex py={12} justify="center">
            <Spinner size="xl" />
          </Flex>
        ) : materialsToRender.length === 0 ? (
          <Flex py={12} direction="column" align="center" textAlign="center" gap={2}>
            <Heading size="sm">No hay materias primas</Heading>
            <Text color={muted}>Ajustá los filtros o cargá una nueva materia prima para empezar.</Text>
          </Flex>
        ) : (
          <Grid
            templateColumns={{
              base: "1fr",
              sm: "repeat(2, 1fr)",
              lg: "repeat(3, 1fr)",
              xl: "repeat(4, 1fr)",
            }}
            gap={4}
          >
            {materialsToRender.map((mp) => {
              const typeLabel = getMaterialTypeLabel(mp?.type) || mp?.type || "Sin tipo";
              return (
                <GridItem key={mp?._id}>
                  <Stack
                    bg={cardBg}
                    borderRadius="xl"
                    p={4}
                    spacing={3}
                    borderWidth="1px"
                    borderColor={border}
                    h="full"
                    transition="border-color 0.15s ease, transform 0.15s ease"
                    _hover={{ borderColor: hoverBorder, transform: "translateY(-2px)" }}
                  >
                    <Box>
                      <Heading size="sm" noOfLines={2} title={mp?.nombre || "Sin nombre"}>
                        {mp?.nombre || "Sin nombre"}
                      </Heading>
                      <Text fontSize="sm" color={muted} textTransform="capitalize">
                        {mp?.categoria || "Sin categoría"}
                      </Text>
                    </Box>

                    <Grid templateColumns="repeat(2, 1fr)" gapX={4} gapY={1}>
                      {renderDetail("Stock", mp?.stock ?? 0, true)}
                      {renderDetail("Precio", formatPrice(mp?.precio), true)}
                      {renderDetail("Tipo", typeLabel)}
                      {renderDetail("Medida", mp?.medida || "Sin medida")}
                      {renderDetail("Espesor", mp?.espesor || "N/A")}
                      {renderDetail("Celda", mp?.celdaExcel || "-")}
                      {renderDetail("ID", mp?._id ? `…${mp._id.slice(-8)}` : "-")}
                    </Grid>

                    <Stack spacing={2} mt="auto">
                      <Text fontSize="xs" color={muted} noOfLines={1}>
                        Actualizado: {formatUpdatedAt(mp?.updatedAt)}
                      </Text>
                      <Button
                        w="full"
                        size="sm"
                        as={Link}
                        to={`/materias-primas/${mp?._id}`}
                        variant="outline"
                        colorScheme="teal"
                        rightIcon={<RiArrowRightLine />}
                      >
                        Ver detalle
                      </Button>
                    </Stack>
                  </Stack>
                </GridItem>
              );
            })}
          </Grid>
        )}
      </Box>

      <Flex justify="center" align="center" gap={4} flexWrap="wrap">
        <Button onClick={goPrev} isDisabled={currentPage <= 1 || isLoading}>
          Anterior
        </Button>
        <Text textAlign="center">
          Página {currentPage} de {totalPages} ({totalItems} resultados)
        </Text>
        <Button onClick={goNext} isDisabled={currentPage >= totalPages || isLoading}>
          Siguiente
        </Button>
      </Flex>

      <AlertDialog isOpen={deleteDialog.isOpen} leastDestructiveRef={cancelRef} onClose={deleteDialog.onClose} isCentered>
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              Eliminar todas las materias primas
            </AlertDialogHeader>
            <AlertDialogCloseButton />
            <AlertDialogBody>
              Esta acción eliminará definitivamente todos los registros de materias primas. ¿Deseás continuar?
            </AlertDialogBody>
            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={deleteDialog.onClose}>
                Cancelar
              </Button>
              <Button
                colorScheme="red"
                ml={3}
                isLoading={isDeletingAll}
                onClick={async () => {
                  if (!canBulkDelete) return;
                  try {
                    await onDeleteAll();
                    deleteDialog.onClose();
                  } catch (error) {
                    console.error("Error bulk delete", error);
                  }
                }}
              >
                Eliminar
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </Stack>
  );
};
