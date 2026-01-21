import {
  Box,
  Container,
  Text,
  Flex,
  VStack,
  Button,
  Heading,
  useColorModeValue,
  HStack,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useToast,
  Grid,
  GridItem,
  Card,
  CardBody,
  Badge,
  Divider,
} from "@chakra-ui/react";

import { FcMoneyTransfer, FcSettings } from "react-icons/fc";
import { GoArrowLeft } from "react-icons/go";
import { MdDeleteForever } from "react-icons/md";
import { Link, useNavigate } from "react-router-dom";
import { useDeleteMp } from "../../hooks/index.js";

export const ItemDetailRawMaterials = ({ RawMaterials }) => {
  const toast = useToast();
  const navigate = useNavigate();
  const { deleteMp, loading } = useDeleteMp();

  const formatTimestamp = (value) => {
    if (!value) return "";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    return date.toLocaleString("es-AR");
  };

  const detailFields = [
    { label: "Categoría", value: RawMaterials.categoria },
    { label: "Tipo", value: RawMaterials.type },
    { label: "Nombre de madera", value: RawMaterials.nombreMadera },
    { label: "Medida", value: RawMaterials.medida },
    { label: "Espesor", value: RawMaterials.espesor },
    { label: "Precio", value: RawMaterials.precio },
    { label: "Stock", value: RawMaterials.stock },
    { label: "Celda Excel", value: RawMaterials.celdaExcel },
    { label: "Última actualización", value: formatTimestamp(RawMaterials.updatedAt) },
  ].filter((field) => field.value !== undefined && field.value !== null && field.value !== "");

  const { isOpen, onOpen, onClose } = useDisclosure();

  const handleDelete = async () => {
    console.log("ID a elimar", RawMaterials._id);

    if (!RawMaterials._id) {
      toast({
        title: "Error",
        description: "ID de materia prima no encontrado",
        status: "error",
        duration: 2000,
        isClosable: true,
      });
      return;
    }

    const ok = await deleteMp(RawMaterials._id);
    if (ok) {
      toast({
        title: "Materia Prima Eliminada.",
        description: "La Materia Prima fue eliminado correctamente.",
        status: "warning",
        duration: 2000,
        isClosable: true,
      });
      setTimeout(() => {
        navigate("/materias-primas");
      }, 1000);
    } else {
      toast({
        title: "La Materia Prima no se pudo ELIMINAR.",
        description: "La Materia Prima NO se pudo ELIMINAR..",
        status: "error",
        duration: 2000,
        isClosable: true,
      });
    }
  };

  return (
    <Container maxW="7xl" minH="100vh" py={8}>
      {/* Botón de volver */}
      <Box mb={8}>
        <Button leftIcon={<GoArrowLeft />} as={Link} to={"/materias-primas"}>
          Volver a Materias Primas
        </Button>
      </Box>

      {/* Layout horizontal */}
      <Flex minH="60vh" align="center" justify="center">
        <Card
          maxW="1200px"
          w="100%"
          boxShadow="2xl"
          bg={useColorModeValue("white", "gray.800")}
        >
          <CardBody p={8}>
            <Grid
              templateColumns={{ base: "1fr", lg: "2fr 1fr" }}
              gap={8}
              alignItems="center"
            >
              {/* Información principal - Lado izquierdo */}
              <GridItem>
                <VStack spacing={6} align="start">
                  <Box w="100%">
                    <Flex align="center" justify="space-between" mb={4}>
                      <Heading
                        fontSize={{ base: "3xl", md: "4xl", lg: "5xl" }}
                        fontWeight={400}
                        color={useColorModeValue("gray.800", "white")}
                      >
                        {RawMaterials.nombre}
                      </Heading>
                      <Badge
                        colorScheme="blue"
                        fontSize="lg"
                        px={4}
                        py={2}
                        borderRadius="full"
                      >
                        {RawMaterials.categoria}
                      </Badge>
                    </Flex>

                    {/* Precio destacado */}
                    <HStack spacing={3} mb={6}>
                      <Text fontSize="4xl" fontWeight="bold" color="green.500">
                        ${RawMaterials.precio}
                      </Text>
                      <FcMoneyTransfer size={40} />
                    </HStack>

                    {detailFields.length > 0 && (
                      <Grid
                        templateColumns={{ base: "1fr", md: "repeat(2, 1fr)" }}
                        gap={4}
                        w="100%"
                        mb={6}
                      >
                        {detailFields.map((field) => (
                          <Box key={field.label}>
                            <Text fontSize="sm" color="gray.500" fontWeight="bold" mb={1}>
                              {field.label.toUpperCase()}
                            </Text>
                            <Text fontSize="md" fontWeight={500}>
                              {field.value}
                            </Text>
                          </Box>
                        ))}
                      </Grid>
                    )}
                  </Box>

                  <Divider />

                  {/* Detalles en grid horizontal */}
                  <Grid
                    templateColumns={{ base: "1fr", md: "repeat(3, 1fr)" }}
                    gap={6}
                    w="100%"
                  >
                    <Box>
                      <Text
                        fontSize="sm"
                        color="gray.500"
                        fontWeight="bold"
                        mb={1}
                      >
                        TIPO
                      </Text>
                      <Text fontSize="lg" fontWeight={500}>
                        {RawMaterials.type}
                      </Text>
                    </Box>

                    <Box>
                      <Text
                        fontSize="sm"
                        color="gray.500"
                        fontWeight="bold"
                        mb={1}
                      >
                        MEDIDA
                      </Text>
                      <Text fontSize="lg" fontWeight={500}>
                        {RawMaterials.medida}
                      </Text>
                    </Box>

                    <Box>
                      <Text
                        fontSize="sm"
                        color="gray.500"
                        fontWeight="bold"
                        mb={1}
                      >
                        STOCK
                      </Text>
                      <Badge
                        colorScheme={
                          RawMaterials.stock > 10
                            ? "green"
                            : RawMaterials.stock > 0
                            ? "yellow"
                            : "red"
                        }
                        fontSize="lg"
                        px={3}
                        py={1}
                      >
                        {RawMaterials.stock} unidades
                      </Badge>
                    </Box>
                  </Grid>
                </VStack>
              </GridItem>

              {/* Botones de acción - Lado derecho */}
              <GridItem>
                <VStack spacing={4} w="100%">
                  <Button
                    as={Link}
                    to={`/materias-primas/update/${RawMaterials._id}`}
                    rightIcon={<FcSettings size={20} />}
                    w="100%"
                    size="lg"
                    bg={useColorModeValue("gray.600", "gray.400")}
                    color="white"
                    _hover={{
                      transform: "translateY(-2px)",
                      boxShadow: "lg",
                      bg: useColorModeValue("gray.700", "gray.500"),
                    }}
                    transition="all 0.2s"
                  >
                    Modificar
                  </Button>

                  <Button
                    rightIcon={<MdDeleteForever size={24} />}
                    w="100%"
                    size="lg"
                    bg="red.500"
                    color="white"
                    _hover={{
                      transform: "translateY(-2px)",
                      boxShadow: "lg",
                      bg: "red.600",
                    }}
                    transition="all 0.2s"
                    isLoading={loading}
                    onClick={onOpen}
                  >
                    Eliminar
                  </Button>
                </VStack>
              </GridItem>
            </Grid>
          </CardBody>
        </Card>
      </Flex>

      {/* Modal de confirmación */}
      <Modal isOpen={isOpen} onClose={onClose} isCentered>
        <ModalOverlay bg="blackAlpha.300" backdropFilter="blur(10px)" />
        <ModalContent>
          <ModalHeader>¿Eliminar Materia Prima?</ModalHeader>
          <ModalBody>
            ¿Estás seguro de que quieres eliminar{" "}
            <strong>{RawMaterials.nombre}</strong>? Esta acción no se puede
            deshacer.
          </ModalBody>
          <ModalFooter>
            <Button
              colorScheme="red"
              mr={3}
              onClick={async () => {
                await handleDelete();
                onClose();
              }}
            >
              Sí, eliminar
            </Button>
            <Button variant="ghost" onClick={onClose}>
              Cancelar
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Container>
  );
};
