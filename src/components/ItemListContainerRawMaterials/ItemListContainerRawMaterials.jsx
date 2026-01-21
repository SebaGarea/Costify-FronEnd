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
  HStack,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  Spacer,
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
  const toolbarBg = useColorModeValue("gray.100", "gray.700");
  const cardBg = useColorModeValue("white", "gray.800");
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

  const availableTypes = filtersMeta.availableTypes ?? [];
  const availableMedidas = filtersMeta.availableMedidas ?? [];

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
    onFiltersChange?.({ category, type: null, medida: null });
  };

  const handleTypeChange = (type) => {
    onFiltersChange?.({ type, medida: null });
  };

  const handleMedidaChange = (medida) => {
    onFiltersChange?.({ medida });
  };

  const handleClearFilters = () => {
    onFiltersChange?.({ category: null, type: null, medida: null });
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

  return (
    <Stack spacing={6} align="stretch">
      <Box bg={toolbarBg} borderRadius="lg" p={3}>
        <Stack direction={{ base: "column", lg: "row" }} spacing={4} align={{ base: "stretch", lg: "center" }}>
          <HStack spacing={3} flexWrap="wrap">
            <Menu>
              <MenuButton as={Button} rightIcon={<FiChevronDown />} textTransform="uppercase">
                {selectedCategory || "Categoría"}
              </MenuButton>
              <MenuList {...scrollableMenuProps}>
                {categoriesMp.map((cat) => (
                  <MenuItem key={cat.nombre} textTransform="uppercase" onClick={() => handleCategoryChange(cat.nombre)}>
                    {cat.nombre}
                  </MenuItem>
                ))}
              </MenuList>
            </Menu>

            <Menu isDisabled={!selectedCategory}>
              <MenuButton as={Button} rightIcon={<FiChevronDown />} textTransform="uppercase">
                {selectedType || "Tipo"}
              </MenuButton>
              <MenuList {...scrollableMenuProps}>
                {availableTypes.length === 0 ? (
                  <MenuItem disabled>Sin tipos</MenuItem>
                ) : (
                  availableTypes.map((tipo) => (
                    <MenuItem key={tipo} textTransform="uppercase" onClick={() => handleTypeChange(tipo)}>
                      {tipo}
                    </MenuItem>
                  ))
                )}
              </MenuList>
            </Menu>

            <Menu isDisabled={!selectedType}>
              <MenuButton as={Button} rightIcon={<FiChevronDown />} textTransform="uppercase">
                {selectedMedida || "Medida"}
              </MenuButton>
              <MenuList {...scrollableMenuProps}>
                {availableMedidas.length === 0 ? (
                  <MenuItem disabled>Sin medidas</MenuItem>
                ) : (
                  availableMedidas.map((medida) => (
                    <MenuItem key={medida} textTransform="uppercase" onClick={() => handleMedidaChange(medida)}>
                      {medida}
                    </MenuItem>
                  ))
                )}
              </MenuList>
            </Menu>

            {(selectedCategory || selectedType || selectedMedida) && (
              <Button variant="outline" colorScheme="red" onClick={handleClearFilters}>
                Borrar filtros
              </Button>
            )}
          </HStack>

          <Spacer />

          <HStack spacing={3} justify={{ base: "flex-start", lg: "flex-end" }}>
            <Button
              as={Link}
              to="/materias-primas/itemAdd"
              leftIcon={<FiPlus color="#67e8f9" size="20" strokeWidth={3} />}
            >
              Agregar Materia Prima
            </Button>
            <Button as={Link} to="/materias-primas/import" variant="outline" leftIcon={<FiUploadCloud />}>
              Subir Excel
            </Button>
            <Button
              variant="outline"
              leftIcon={<FiDownload />}
              onClick={onExport}
              isLoading={isExporting}
              isDisabled={isLoading || typeof onExport !== "function"}
            >
              Exportar Excel
            </Button>
            <Button
              colorScheme="red"
              variant="outline"
              onClick={deleteDialog.onOpen}
              isDisabled={!canBulkDelete || isLoading || isDeletingAll || sanitizedMaterials.length === 0}
            >
              Eliminar todo
            </Button>
          </HStack>
        </Stack>
      </Box>

      <Box>
        {isLoading ? (
          <Flex justify="center" py={12}>
            <Spinner size="xl" />
          </Flex>
        ) : materialsToRender.length === 0 ? (
          <Flex justify="center" py={12}>
            <Text fontSize="lg" color="gray.400">
              No hay materias primas registradas.
            </Text>
          </Flex>
        ) : (
          <Grid
            templateColumns={{ base: "repeat(auto-fit, minmax(270px, 1fr))", xl: "repeat(4, 1fr)" }}
            gap={{ base: 4, md: 6 }}
            alignItems="stretch"
          >
            {materialsToRender.map((mp) => (
              <GridItem key={mp._id}>
                <Stack bg={cardBg} borderRadius="lg" boxShadow="xl" p={6} spacing={3} h="full">
                  <Heading size="md" textAlign="center">
                    {mp.nombre}
                  </Heading>
                  <Text fontSize="sm" color="gray.500" textAlign="center">
                    {mp.categoria}
                  </Text>
                  <Stack spacing={1} fontSize="sm" color="gray.600">
                    <Text>Stock: {mp.stock}</Text>
                    <Text>Tipo: {getMaterialTypeLabel(mp.type)}</Text>
                    <Text>Medida: {mp.medida}</Text>
                    <Text>Espesor: {mp.espesor || "N/A"}</Text>
                    <Text>Celda Excel: {mp.celdaExcel || "-"}</Text>
                    <Text color="gray.200">Precio: {formatPrice(mp.precio)}</Text>
                    <Text fontSize="xs" color="gray.500">
                      Última actualización: {formatUpdatedAt(mp.updatedAt)}
                    </Text>
                    <Text>ID Mongo: {mp._id}</Text>
                  </Stack>
                  <Button as={Link} to={`/materias-primas/${mp._id}`} variant="outline" colorScheme="teal" rightIcon={<RiArrowRightLine />}>
                    Ver Detalle
                  </Button>
                </Stack>
              </GridItem>
            ))}
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

      <AlertDialog
        isOpen={deleteDialog.isOpen}
        leastDestructiveRef={cancelRef}
        onClose={deleteDialog.onClose}
        isCentered
      >
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

/* =======================================================================
   Legacy implementation preserved for reference (no longer in use)
   -----------------------------------------------------------------------

import {
  Box,
  Center,
  useColorModeValue,
  Heading,
  Text,
  Stack,
  SimpleGrid,
  Button,
  HStack,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Spacer,
  Spinner,
  VStack,
} from "@chakra-ui/react";
import { FiChevronDown, FiPlus, FiUploadCloud } from "react-icons/fi";
import { useCategoryMp } from "../../hooks/materiasPrimas";
import { Link } from "react-router-dom";
import { RiArrowRightLine } from "react-icons/ri";

export const ItemListContainerRawMaterials = ({
  rawMaterials,
  pagination,
  filters,
  filtersMeta,
  onPageChange,
  onFiltersChange,
  isLoading,
}) => {
  const { categoriesMp } = useCategoryMp();
  const colorBg = useColorModeValue("white", "gray.800");
  const colorBgBox = useColorModeValue("gray.100", "gray.700");
  const pageLimit = pagination?.limit || rawMaterials.length;
  const materialsToRender = rawMaterials.slice(0, pageLimit);
  if (process.env.NODE_ENV === "development") {
    console.debug("Materias primas recibidas:", rawMaterials.length, "- Renderizadas:", materialsToRender.length);
  }

  const formatPrice = (value) => {
    const parsed = Number(value);
    if (Number.isNaN(parsed)) return "Sin precio";
    const formatted = new Intl.NumberFormat("es-AR", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(parsed);
    return `$${formatted}`;
  };

  const selectedCategory = filters?.category || null;
  const selectedType = filters?.type || null;
  const selectedMedida = filters?.medida || null;
  const availableTypes = filtersMeta?.availableTypes || [];
  const availableMedidas = filtersMeta?.availableMedidas || [];
  const currentPage = pagination?.page || 1;
  const totalPages = pagination?.totalPages || 1;
  const totalItems = pagination?.total ?? rawMaterials.length;

  const handleCategoryChange = (category) => {
    onFiltersChange?.({ category, type: null, medida: null });
  };

  const handleTypeChange = (type) => {
    onFiltersChange?.({ type, medida: null });
  };

  const handleMedidaChange = (medida) => {
    onFiltersChange?.({ medida });
  };

  const handleClearFilters = () => {
    onFiltersChange?.({ category: null, type: null, medida: null });
  };

  const handlePrev = () => {
    if (currentPage > 1) {
      onPageChange?.(currentPage - 1);
    }
  };

  const handleNext = () => {
    if (currentPage < totalPages) {
      onPageChange?.(currentPage + 1);
    }
  };

  return (
    <VStack spacing={6} align="stretch">
      <Box p={2} bg={colorBgBox} borderRadius="lg">
        <HStack spacing={4}>
          <Menu>
            <MenuButton textTransform="uppercase" as={Button} rightIcon={<FiChevronDown />}>
              {selectedCategory || "Categoría"}
            </MenuButton>
            <MenuList>
              {categoriesMp.map((cat) => (
                <MenuItem
                  justifyContent="center"
                  textTransform="uppercase"
                  key={cat.nombre}
                  onClick={() => handleCategoryChange(cat.nombre)}
                >
                  {cat.nombre}
                </MenuItem>
              ))}
            </MenuList>
          </Menu>

          <Menu isDisabled={!selectedCategory}>
            <MenuButton textTransform="uppercase" as={Button} rightIcon={<FiChevronDown />}>
              {selectedType || "Tipo"}
            </MenuButton>
            <MenuList>
              {availableTypes.length === 0 ? (
                <MenuItem disabled>Sin tipos</MenuItem>
              ) : (
                availableTypes.map((tipo) => (
                  <MenuItem
                    justifyContent="center"
                    textTransform="uppercase"
                    key={tipo}
                    onClick={() => handleTypeChange(tipo)}
                  >
                    {tipo}
                  </MenuItem>
                ))
              )}
            </MenuList>
          </Menu>

          <Menu isDisabled={!selectedType}>
            <MenuButton textTransform="uppercase" as={Button} rightIcon={<FiChevronDown />}>
              {selectedMedida || "Medida"}
            </MenuButton>
            <MenuList>
              {availableMedidas.length === 0 ? (
                <MenuItem disabled>Sin medidas</MenuItem>
              ) : (
                availableMedidas.map((medida) => (
                  <MenuItem
                    justifyContent="center"
                    textTransform="uppercase"
                    key={medida}
                    onClick={() => handleMedidaChange(medida)}
                  >
                    {medida}
                  </MenuItem>
                ))
              )}
            </MenuList>
          </Menu>

          {(selectedCategory || selectedType || selectedMedida) && (
            <Button colorScheme="red" variant="outline" onClick={handleClearFilters}>
              Borrar Filtros
            </Button>
          )}

          <Spacer />

          <Button
            as={Link}
            to={"/materias-primas/itemAdd"}
            leftIcon={<FiPlus color="#67e8f9" size={"25"} strokeWidth={4} />}
            mr={15}
          >
            Agregar Materia Prima
          </Button>
          <Button
            as={Link}
            to={"/materias-primas/import"}
            variant="outline"
            leftIcon={<FiUploadCloud />}
          >
            Subir Excel de producto
          </Button>
        </HStack>
      </Box>

      <Box py={4} px={{ base: 0, md: 2 }}>
        {isLoading ? (
          <Center py={10}>
            <Spinner size="xl" />
          </Center>
        ) : materialsToRender.length === 0 ? (
          <Center py={10}>
            <Text fontSize="lg" color="gray.500" textAlign="center">
              No hay materias primas registradas.
            </Text>
          </Center>
        ) : (
          <SimpleGrid
            spacing={{ base: 4, md: 6 }}
            minChildWidth={{ base: "260px", md: "280px" }}
            justifyItems="stretch"
            maxW="7xl"
            mx="auto"
            alignContent="start"
            gridAutoRows="auto"
          >
            {materialsToRender.map((mp) => (
              <Box
                key={mp._id}
                p={6}
                w="full"
                bg={colorBg}
                boxShadow={"2xl"}
                rounded={"lg"}
              >
                <Stack align={"center"}>
                  <Heading fontSize={"md"} fontWeight={500}>
                    {mp.nombre}
                  </Heading>
                  <Text color={"gray.500"} fontSize={"sm"}>
                    {mp.categoria}
                  </Text>
                  <Text fontSize={"sm"} color={"gray.600"}>
                    Stock: {mp.stock}
                  </Text>
                  <Text fontSize={"sm"} color={"gray.600"}>
                    Tipo: {mp.type}
                  </Text>
                  <Text fontSize={"sm"} color={"gray.600"}>
                    Medida: {mp.medida}
                  </Text>
                  <Text fontSize={"sm"} color={"gray.600"}>
                    Espesor: {mp.espesor || "N/A"}
                  </Text>
                  <Text fontSize={"sm"} color={"gray.600"}>
                    Celda Excel: {mp.celdaExcel || "-"}
                  </Text>
                  <Text fontSize={"sm"} color={"gray.300"}>
                    Precio: {formatPrice(mp.precio)}
                  </Text>
                  <Text fontSize={"sm"} color={"gray.600"}>
                    ID MONGO: {mp._id}
                  </Text>
                  <HStack>
                    <Button
                      as={Link}
                      to={`/materias-primas/${mp._id}`}
                      colorScheme="teal"
                      variant="outline"
                      m={2}
                    >
                      Ver Detalle
                      <Box as="span" ml={2}>
                        <RiArrowRightLine />
                      </Box>
                    </Button>
                  </HStack>
                </Stack>
              </Box>
            ))}
          </SimpleGrid>
        )}
      </Box>

      <HStack justify="center" spacing={4}>
        <Button onClick={handlePrev} isDisabled={currentPage <= 1 || isLoading}>
          Anterior
        </Button>
        <Text>
          Página {currentPage} de {totalPages} ({totalItems} resultados)
        </Text>
        <Button onClick={handleNext} isDisabled={currentPage >= totalPages || isLoading}>
          Siguiente
        </Button>
      </HStack>
    </VStack>
  );
};

*/
