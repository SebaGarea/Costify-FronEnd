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
import { FiChevronDown, FiPlus, FiEdit2, FiTrash2, FiSearch } from "react-icons/fi";

import React, { useRef, useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Loader } from "../Loader/Loader.jsx";
import { RiArrowRightLine } from "react-icons/ri";

import { useGetAllPlantillas, useDeletePlantilla, useGetTiposProyectoUnicos } from "../../hooks/index.js";

export const ItemListPlantillas = () => {
  // Estados para filtros
  const [filtros, setFiltros] = useState({
    tipoProyecto: 'todos',
    search: ''
  });

  // Estado local para el input de búsqueda (sin debounce)
  const [searchInput, setSearchInput] = useState('');

  const {
    plantillasData,
    loading: loadingGetAll,
    error: errorGetAll,
    refetch
  } = useGetAllPlantillas(filtros);

  const { deletePlantilla, loading: isDeleting, error: deleteError } = useDeletePlantilla();
  
  // Hook para obtener tipos de proyecto únicos
  const { tiposProyecto, loading: loadingTipos, refetch: refetchTipos } = useGetTiposProyectoUnicos();

  const { isOpen, onOpen, onClose } = useDisclosure();
  const [plantillaToDelete, setPlantillaToDelete] = useState(null);
  const cancelRef = useRef();
  const toast = useToast();

  const colorBg = useColorModeValue("white", "gray.800");
  const colorBgBox = useColorModeValue("gray.100", "gray.700");

  // Debounce para la búsqueda
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setFiltros(prev => ({ ...prev, search: searchInput }));
    }, 1000); // 1 segundo de delay

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
    setFiltros(prev => ({ ...prev, tipoProyecto }));
  };



  const handleSearchChange = (event) => {
    setSearchInput(event.target.value);
  };

  const handleClearFilters = () => {
    setSearchInput('');
    setFiltros({
      tipoProyecto: 'todos',
      search: ''
    });
  };

  // Función para abrir modal de confirmación
  const handleDeleteClick = (plantilla) => {
    setPlantillaToDelete(plantilla);
    onOpen();
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

  if (loadingGetAll) {
    return <Loader />;
  }

  if (errorGetAll) {
    return (
      <Center py={12}>
        <Text color="red.500">Error: {errorGetAll}</Text>
      </Center>
    );
  }

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

            {/* Botón para limpiar filtros */}
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
            {plantillasData.map((plantilla) => (
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
                  <Button
                    as={Link}
                    to={`/plantillas/plantillaAdd/${plantilla._id}`}
                    colorScheme="teal"
                    variant="outline"
                    size="sm"
                    leftIcon={<FiEdit2 />}
                    flex={1}
                  >
                    Ver/Modificar
                    <Box as="span" ml={1}>
                      <RiArrowRightLine />
                    </Box>
                  </Button>
                  
                  <Button
                    colorScheme="red"
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteClick(plantilla)}
                    leftIcon={<FiTrash2 />}
                  >
                    Eliminar
                  </Button>
                </HStack>
              </Stack>
            </Box>
            ))}
          </SimpleGrid>
        )}
      </Center>

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
    </>
  );
};
