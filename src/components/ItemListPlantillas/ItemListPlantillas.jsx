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
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
  useDisclosure,
  useToast,
  Input,
  InputGroup,
  InputLeftElement,
  VStack,
} from "@chakra-ui/react";
import { FiChevronDown, FiPlus, FiEdit2, FiTrash2, FiSearch, FiCopy } from "react-icons/fi";

import React, { useRef, useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Loader } from "../Loader/Loader.jsx";
import { RiArrowRightLine } from "react-icons/ri";

import { useGetAllPlantillas, useDeletePlantilla, useDuplicatePlantilla, useGetTiposProyectoUnicos, useRenameTipoProyecto } from "../../hooks/index.js";

const ITEMS_PER_PAGE = 10;

export const ItemListPlantillas = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const updateParams = (updates) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      Object.entries(updates).forEach(([key, value]) => {
        if (value === null || value === undefined) {
          next.delete(key);
        } else {
          next.set(key, String(value));
        }
      });
      return next;
    }, { replace: true });
  };

  const filtros = {
    tipoProyecto: searchParams.get("tipo") || "todos",
    search: searchParams.get("busqueda") || "",
  };

  const [searchInput, setSearchInput] = useState(searchParams.get("busqueda") || "");
  const currentPage = parseInt(searchParams.get("pagina") || "1", 10);

  const {
    plantillasData,
    loading: loadingGetAll,
    error: errorGetAll,
    refetch
  } = useGetAllPlantillas(filtros);

  const { deletePlantilla, loading: isDeleting, error: deleteError } = useDeletePlantilla();
  const { duplicatePlantilla, loading: isDuplicating, error: duplicateError } = useDuplicatePlantilla();
  const { renameTipo, loading: isRenaming } = useRenameTipoProyecto();

  const [tipoToRename, setTipoToRename] = useState(null);
  const [nuevoNombreTipo, setNuevoNombreTipo] = useState("");
  const {
    isOpen: isRenameOpen,
    onOpen: onRenameOpen,
    onClose: onRenameClose,
  } = useDisclosure();
  const renameCancelRef = useRef();
  
  // Hook para obtener tipos de proyecto únicos
  const { tiposProyecto, loading: loadingTipos, refetch: refetchTipos } = useGetTiposProyectoUnicos();

  const { isOpen, onOpen, onClose } = useDisclosure();
  const [plantillaToDelete, setPlantillaToDelete] = useState(null);
  const cancelRef = useRef();

  const {
    isOpen: isDuplicateOpen,
    onOpen: onDuplicateOpen,
    onClose: onDuplicateClose,
  } = useDisclosure();
  const [plantillaToDuplicate, setPlantillaToDuplicate] = useState(null);
  const [duplicateName, setDuplicateName] = useState("");
  const duplicateCancelRef = useRef();
  const toast = useToast();

  const colorBg = useColorModeValue("white", "gray.800");
  const colorBgBox = useColorModeValue("gray.100", "gray.700");

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      updateParams({ busqueda: searchInput || null, pagina: null });
    }, 1000);
    return () => clearTimeout(timeoutId);
  }, [searchInput]);

  // Refrescar tipos de proyecto cuando el usuario regresa a esta página
  useEffect(() => {
    const handleFocus = () => {
      refetchTipos();
    };

    window.addEventListener('focus', handleFocus);
    
    return () => {
      window.removeEventListener('focus', handleFocus);
    };
  }, [refetchTipos]);

  // Opciones dinámicas para tipos de proyecto (solo los únicos de BD)
  const tiposProyectoOptions = [
    { value: 'todos', label: 'Todos los tipos' },
    ...tiposProyecto.map(tipo => ({ value: tipo, label: tipo }))
  ];

  // Funciones para manejar los filtros
  const handleTipoProyectoSelect = (tipoProyecto) => {
    updateParams({ tipo: tipoProyecto === "todos" ? null : tipoProyecto, pagina: null });
  };



  const handleSearchChange = (event) => {
    setSearchInput(event.target.value);
  };

  const handleClearFilters = () => {
    setSearchInput('');
    updateParams({ tipo: null, busqueda: null, pagina: null });
  };

  const handleRenameClick = (tipo) => {
    setTipoToRename(tipo);
    setNuevoNombreTipo(tipo);
    onRenameOpen();
  };

  const handleConfirmRename = async () => {
    if (!tipoToRename) return;
    const nombre = nuevoNombreTipo.trim();
    if (!nombre) {
      toast({ title: "Nombre requerido", status: "warning", duration: 2000, isClosable: true });
      return;
    }
    const count = await renameTipo(tipoToRename, nombre);
    if (count !== null) {
      toast({
        title: "Tipo renombrado",
        description: `"${tipoToRename}" → "${nombre}" (${count} plantilla${count !== 1 ? "s" : ""} actualizadas)`,
        status: "success",
        duration: 3000,
        isClosable: true,
      });
      if (filtros.tipoProyecto === tipoToRename) {
        updateParams({ tipo: nombre });
      }
      refetchTipos();
      refetch();
    } else {
      toast({ title: "Error al renombrar", status: "error", duration: 3000, isClosable: true });
    }
    setTipoToRename(null);
    onRenameClose();
  };

  // Función para abrir modal de confirmación
  const handleDeleteClick = (plantilla) => {
    setPlantillaToDelete(plantilla);
    onOpen();
  };

  const handleDuplicateClick = (plantilla) => {
    setPlantillaToDuplicate(plantilla);
    setDuplicateName(`${plantilla.nombre} (copia)`);
    onDuplicateOpen();
  };

  // Función para confirmar eliminación
  const handleConfirmDelete = async () => {
    if (!plantillaToDelete) return;
    
    const success = await deletePlantilla(plantillaToDelete._id);
    
    if (success) {
      toast({
        title: "Plantilla eliminada",
        description: `La plantilla "${plantillaToDelete.nombre}" ha sido eliminada exitosamente.`,
        status: "success",
        duration: 3000,
        isClosable: true,
      });
      refetch(); // Recargar la lista
      refetchTipos(); // Refrescar tipos de proyecto
    } else {
      toast({
        title: "Error al eliminar",
        description: deleteError || "Hubo un problema al eliminar la plantilla. Por favor, intenta de nuevo.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
    
    setPlantillaToDelete(null);
    onClose();
  };

  const handleConfirmDuplicate = async () => {
    if (!plantillaToDuplicate) return;

    const nombre = (duplicateName || "").trim();
    if (!nombre) {
      toast({
        title: "Nombre requerido",
        description: "Ingresá un nombre para la plantilla duplicada.",
        status: "warning",
        duration: 2500,
        isClosable: true,
      });
      return;
    }

    const created = await duplicatePlantilla(plantillaToDuplicate._id, { nombre });

    if (created) {
      toast({
        title: "Plantilla duplicada",
        description: `Se creó "${created.nombre}" a partir de "${plantillaToDuplicate.nombre}".`,
        status: "success",
        duration: 3000,
        isClosable: true,
      });
      onDuplicateClose();
      setPlantillaToDuplicate(null);
      setDuplicateName("");

      if (created?._id) {
        navigate(`/plantillas/plantillaAdd/${created._id}`);
      } else {
        refetch();
        refetchTipos();
      }
    } else {
      toast({
        title: "Error al duplicar",
        description: duplicateError || "Hubo un problema al duplicar la plantilla. Por favor, intenta de nuevo.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  };

  if (loadingGetAll && plantillasData.length === 0) {
    return <Loader />;
  }

  if (errorGetAll) {
    return (
      <Center py={12}>
        <Text color="red.500">Error: {errorGetAll}</Text>
      </Center>
    );
  }

  const sortedPlantillas = [...plantillasData].sort((a, b) => (b._id > a._id ? 1 : -1));
  const totalPages = Math.max(1, Math.ceil(sortedPlantillas.length / ITEMS_PER_PAGE));
  const paginatedPlantillas = sortedPlantillas.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  return (
    <>
      <Box mb={2} p={4} bg={colorBgBox} borderRadius="lg">
        <VStack spacing={4} align="stretch">
          <Stack direction={{ base: "column", md: "row" }} spacing={{ base: 2, md: 4 }} align={{ base: "stretch", md: "center" }}>
            {/* Dropdown Tipo de Proyecto */}
            <Menu>
              <MenuButton
                textTransform="uppercase"
                as={Button}
                rightIcon={<FiChevronDown />}
                isLoading={loadingTipos}
                size={{ base: "sm", md: "md" }}
              >
                {filtros.tipoProyecto === 'todos' ? 'Tipo de Proyecto' : filtros.tipoProyecto}
              </MenuButton>
              <MenuList>
                {tiposProyectoOptions.slice(1).map((option) => (
                  <MenuItem
                    key={option.value}
                    onClick={() => handleTipoProyectoSelect(option.value)}
                    justifyContent="center"
                    textTransform="uppercase"
                  >
                    {option.label}
                  </MenuItem>
                ))}
              </MenuList>
            </Menu>

            {/* Campo de búsqueda */}
            <InputGroup size={{ base: "sm", md: "md" }} maxW={{ base: "100%", md: "300px" }}>
              <InputLeftElement pointerEvents="none">
                <FiSearch color="gray.300" />
              </InputLeftElement>
              <Input
                placeholder="Buscar por nombre o etiquetas..."
                value={searchInput}
                onChange={handleSearchChange}
              />
            </InputGroup>

            {/* Botones contextuales cuando hay tipo seleccionado */}
            {filtros.tipoProyecto !== 'todos' && (
              <Button
                colorScheme="blue"
                variant="outline"
                leftIcon={<FiEdit2 />}
                onClick={() => handleRenameClick(filtros.tipoProyecto)}
                size={{ base: "sm", md: "md" }}
              >
                Editar nombre proyecto
              </Button>
            )}

            {(filtros.tipoProyecto !== 'todos' || searchInput !== '') && (
              <Button
                colorScheme="red"
                variant="outline"
                onClick={handleClearFilters}
                size={{ base: "sm", md: "md" }}
              >
                Borrar Filtros
              </Button>
            )}

            <Spacer display={{ base: "none", md: "block" }} />

            {/* Botón Agregar Plantillas */}
            <Button
              as={Link}
              to={"/plantillas/plantillaAdd"}
              leftIcon={<FiPlus color="#67e8f9" size={"25"} strokeWidth={4} />}
              size={{ base: "sm", md: "md" }}
              width={{ base: "100%", md: "auto" }}
            >
              Agregar Plantillas
            </Button>
          </Stack>
        </VStack>
      </Box>

      {/* Indicador de resultados */}
      <Box mb={4} textAlign="center">
        <Text fontSize="sm" color="gray.600">
          {plantillasData.length === 0
            ? "No se encontraron plantillas con los filtros aplicados"
            : `Se encontraron ${plantillasData.length} plantilla${plantillasData.length !== 1 ? 's' : ''}`
          }
        </Text>
      </Box>

      <Center py={12}>
        {plantillasData.length === 0 ? (
          <VStack spacing={4}>
            <Text fontSize="lg" color="gray.500">
              No hay plantillas para mostrar
            </Text>
            <Button
              as={Link}
              to={"/plantillas/plantillaAdd"}
              colorScheme="blue"
              leftIcon={<FiPlus />}
            >
              Crear tu primera plantilla
            </Button>
          </VStack>
        ) : (
          <SimpleGrid columns={{ base: 1, sm: 2, md: 3, lg: 4 }} spacing={8}>
            {paginatedPlantillas.map((plantilla) => (
            <Box
              key={plantilla._id}
              p={6}
              maxW={"330px"}
              w={"full"}
              bg={colorBg}
              boxShadow={"2xl"}
              rounded={"lg"}
            >
              <Stack align={"center"} spacing={3}>
                {/* Nombre */}
                <Heading fontSize={"md"} fontWeight={500} textAlign="center">
                  {plantilla.nombre}
                </Heading>

                {/* Tipo de proyecto */}
                {plantilla.tipoProyecto && (
                  <Text
                    fontSize={"sm"}
                    borderBottom={"1px"}
                    color="gray.500"
                    px={3}
                    py={1}
                    borderRadius="md"
                    fontWeight="medium"
                    textAlign="center"
                  >
                    {plantilla.tipoProyecto}
                  </Text>
                )}

                {/* Costo */}
                {plantilla.costoTotal && (
                  <Text fontSize={"sm"} color={"green.600"} fontWeight="bold">
                    Costo: ${Number(plantilla.costoTotal).toLocaleString()}
                  </Text>
                )}

                {/* Precio final */}
                {plantilla.precioFinal && (
                  <Text fontSize={"sm"} color={"blue.600"} fontWeight="bold">
                    Precio Final: ${Number(plantilla.precioFinal).toLocaleString()}
                  </Text>
                )}

                {/* ID */}
                <Text fontSize={"xs"} color={"gray.500"}>
                  ID: {plantilla._id.slice(-8)}
                </Text>

                <HStack spacing={2} w="full">
                  <Stack w="full" spacing={2}>
                    <Button
                      as={Link}
                      to={`/plantillas/plantillaAdd/${plantilla._id}`}
                      colorScheme="teal"
                      variant="outline"
                      size="sm"
                      leftIcon={<FiEdit2 />}
                      width="full"
                    >
                      Ver/Modificar
                      <Box as="span" ml={1}>
                        <RiArrowRightLine />
                      </Box>
                    </Button>

                    <HStack spacing={2} w="full">
                      <Button
                        colorScheme="blue"
                        variant="outline"
                        size="sm"
                        onClick={() => handleDuplicateClick(plantilla)}
                        leftIcon={<FiCopy />}
                        flex={1}
                      >
                        Duplicar
                      </Button>

                      <Button
                        colorScheme="red"
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteClick(plantilla)}
                        leftIcon={<FiTrash2 />}
                        flex={1}
                      >
                        Eliminar
                      </Button>
                    </HStack>
                  </Stack>
                </HStack>
              </Stack>
            </Box>
            ))}
          </SimpleGrid>
        )}
      </Center>

      {totalPages > 1 && plantillasData.length > 0 && (
        <HStack justify="center" spacing={4} pb={8}>
          <Button
            onClick={() => updateParams({ pagina: currentPage - 1 })}
            isDisabled={currentPage === 1}
            size="sm"
          >
            Anterior
          </Button>
          <Text fontSize="sm">
            Página {currentPage} de {totalPages}
          </Text>
          <Button
            onClick={() => updateParams({ pagina: currentPage + 1 })}
            isDisabled={currentPage === totalPages}
            size="sm"
          >
            Siguiente
          </Button>
        </HStack>
      )}

      {/* Modal de confirmación para eliminar */}
      <AlertDialog
        isOpen={isOpen}
        leastDestructiveRef={cancelRef}
        onClose={onClose}
      >
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              Eliminar Plantilla
            </AlertDialogHeader>

            <AlertDialogBody>
              ¿Estás seguro de que deseas eliminar la plantilla{" "}
              <Text as="span" fontWeight="bold" color="red.500">
                "{plantillaToDelete?.nombre}"
              </Text>
              ? Esta acción no se puede deshacer.
            </AlertDialogBody>

            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={onClose}>
                Cancelar
              </Button>
              <Button
                colorScheme="red"
                onClick={handleConfirmDelete}
                ml={3}
                isLoading={isDeleting}
                loadingText="Eliminando..."
              >
                Eliminar
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>

      {/* Modal de confirmación para duplicar */}
      <AlertDialog
        isOpen={isDuplicateOpen}
        leastDestructiveRef={duplicateCancelRef}
        onClose={onDuplicateClose}
      >
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              Duplicar Plantilla
            </AlertDialogHeader>

            <AlertDialogBody>
              <Text mb={2}>
                Vas a duplicar la plantilla{" "}
                <Text as="span" fontWeight="bold">
                  "{plantillaToDuplicate?.nombre}"
                </Text>
                . Elegí el nombre para la copia:
              </Text>
              <Input
                value={duplicateName}
                onChange={(e) => setDuplicateName(e.target.value)}
                placeholder="Nombre de la nueva plantilla"
                autoFocus
              />
            </AlertDialogBody>

            <AlertDialogFooter>
              <Button ref={duplicateCancelRef} onClick={onDuplicateClose}>
                Cancelar
              </Button>
              <Button
                colorScheme="blue"
                onClick={handleConfirmDuplicate}
                ml={3}
                isLoading={isDuplicating}
                loadingText="Duplicando..."
              >
                Duplicar
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>

      {/* Modal para renombrar tipo de proyecto */}
      <AlertDialog
        isOpen={isRenameOpen}
        leastDestructiveRef={renameCancelRef}
        onClose={onRenameClose}
      >
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              Renombrar Tipo de Proyecto
            </AlertDialogHeader>
            <AlertDialogBody>
              <Text mb={2}>
                Renombrá{" "}
                <Text as="span" fontWeight="bold">
                  "{tipoToRename}"
                </Text>
                . El cambio se aplicará a todas las plantillas con ese tipo.
              </Text>
              <Input
                value={nuevoNombreTipo}
                onChange={(e) => setNuevoNombreTipo(e.target.value)}
                placeholder="Nuevo nombre"
                autoFocus
                onKeyDown={(e) => { if (e.key === "Enter") handleConfirmRename(); }}
              />
            </AlertDialogBody>
            <AlertDialogFooter>
              <Button ref={renameCancelRef} onClick={onRenameClose}>
                Cancelar
              </Button>
              <Button
                colorScheme="blue"
                onClick={handleConfirmRename}
                ml={3}
                isLoading={isRenaming}
                loadingText="Renombrando..."
              >
                Renombrar
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </>
  );
};
