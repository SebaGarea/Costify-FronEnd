import React, { useState } from "react";
import {
  Box,
  Container,
  Stack,
  Text,
  Image,
  Flex,
  VStack,
  Button,
  Heading,
  SimpleGrid,
  StackDivider,
  useColorModeValue,
  Center,
  HStack,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Alert,
  Toast,
  useToast,
} from "@chakra-ui/react";
import { FcMoneyTransfer, FcSettings } from "react-icons/fc";
import { GoArrowLeft } from "react-icons/go";
import { MdDeleteForever } from "react-icons/md";
import { useDeleteProduct } from "../../hooks/index.js";
import { Link, useNavigate } from "react-router-dom";

export const ItemDetailProduct = ({ products }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const imagenes =
    products.imagenes && Array.isArray(products.imagenes)
      ? products.imagenes
      : products.imagenes
      ? [products.imagenes]
      : [];

  const BASE_URL = import.meta.env.VITE_API_URL;
  const resolveImageUrl = (imgPath) => {
    if (!imgPath) return "";
    return imgPath.startsWith("http") ? imgPath : `${BASE_URL}${imgPath}`;
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev === 0 ? imagenes.length - 1 : prev - 1));
  };
  const handleNext = () => {
    setCurrentIndex((prev) => (prev === imagenes.length - 1 ? 0 : prev + 1));
  };
  const handleSelect = (idx) => {
    setCurrentIndex(idx);
  };

  const toast = useToast();

  const navigate = useNavigate();
  const { deleteProduct, loading } = useDeleteProduct();
  const { isOpen, onOpen, onClose } = useDisclosure();

  const plantillaId =
    typeof products?.planillaCosto === "string"
      ? products.planillaCosto
      : products?.planillaCosto?._id ?? null;
  const plantillaLink = plantillaId
    ? `/plantillas/plantillaAdd/${plantillaId}`
    : null;

  const handleDelete = async () => {
    const ok = await deleteProduct(products._id);
    if (ok) {
      toast({
        title: "Producto Eliminado.",
        description: "El producto fue eliminado correctamente.",
        status: "warning",
        duration: 2000,
        isClosable: true,
      });
      setTimeout(() => {
        navigate("/productos");
      }, 1000);
    } else {
      toast({
        title: "El Producto no se pudo ELIMINAR.",
        description: "El producto NO se pudo ELIMINAR..",
        status: "error",
        duration: 2000,
        isClosable: true,
      });
    }
  };

  return (
    <Container maxW={"7xl"}>
      <Box>
        <Button leftIcon={<GoArrowLeft />} as={Link} to={"/productos"}>
          Volver a Productos
        </Button>
      </Box>
      <SimpleGrid
        columns={{ base: 1, lg: 2 }}
        spacing={{ base: 8, md: 10 }}
        py={{ base: 18, md: 24 }}
      >
        <Flex direction="column" align="center">
          {imagenes.length > 0 && (
            <>
              <Image
                rounded={"md"}
                alt={"product image"}
                src={resolveImageUrl(imagenes[currentIndex])}
                fit={"cover"}
                align={"center"}
                w={"100%"}
                h={{ base: "100%", sm: "400px", lg: "500px" }}
                mb={2}
              />
              {imagenes.length > 1 && (
                <HStack justify="center" spacing={2} mb={2}>
                  <Button size="sm" onClick={handlePrev}>
                    &lt;
                  </Button>
                  <Text fontSize="sm">
                    {currentIndex + 1} / {imagenes.length}
                  </Text>
                  <Button size="sm" onClick={handleNext}>
                    &gt;
                  </Button>
                </HStack>
              )}
              {imagenes.length > 1 && (
                <HStack justify="center" spacing={1}>
                  {imagenes.map((img, idx) => (
                    <Image
                      key={img}
                      src={resolveImageUrl(img)}
                      alt={`miniatura-${idx}`}
                      boxSize="40px"
                      objectFit="cover"
                      border={
                        idx === currentIndex
                          ? "2px solid #3182ce"
                          : "1px solid #ccc"
                      }
                      borderRadius="md"
                      cursor="pointer"
                      onClick={() => handleSelect(idx)}
                      opacity={idx === currentIndex ? 1 : 0.6}
                      transition="opacity 0.2s"
                    />
                  ))}
                </HStack>
              )}
            </>
          )}
        </Flex>
        <Stack spacing={{ base: 6, md: 10 }}>
          <Box as={"header"}>
            <Heading
              textAlign="center"
              lineHeight={1.1}
              fontWeight={600}
              fontSize={{ base: "2xl", sm: "4xl", lg: "5xl" }}
            >
              {products.nombre}
            </Heading>
            <Box
              textAlign="center"
              color={useColorModeValue("gray.900", "gray.100")}
              fontWeight={200}
              fontSize={"xl"}
              mt={3}
              textTransform={"uppercase"}
              as="span"
              display="block"
            >
              {products.modelo}
            </Box>
            <Box
              textAlign="center"
              color={useColorModeValue("gray.900", "gray.100")}
              fontWeight={400}
              fontSize={"2xl"}
              mt={3}
              as="span"
              display="block"
            >
              <Flex alignItems="center" justifyContent="center" display="inline-flex">
                ${products.precio}
                <Box as="span" ml={4}>
                  <FcMoneyTransfer />
                </Box>
              </Flex>
            </Box>
            <Box
              textAlign="center"
              color={useColorModeValue("gray.900", "gray.100")}
              fontWeight={400}
              fontSize={"2xl"}
              mt={3}
              as="span"
              display="block"
            >
              <Flex alignItems="center" justifyContent="center" display="inline-flex">
                {products.stock} unidades en Stock
              </Flex>
            </Box>
          </Box>
          <Stack
            spacing={{ base: 4, sm: 6 }}
            direction={"column"}
            divider={
              <StackDivider
                borderColor={useColorModeValue("gray.200", "gray.600")}
              />
            }
          >
            <VStack spacing={{ base: 4, sm: 6 }}>
              <Text
                color={useColorModeValue("gray.500", "gray.400")}
                fontSize={"2xl"}
                fontWeight={"300"}
              >
                {products.descripcion}
              </Text>
            </VStack>
          </Stack>
          <Center>
            <Button
              as={plantillaLink ? Link : undefined}
              to={plantillaLink ?? undefined}
              rounded={"15px"}
              w={"75%"}
              mt={1}
              size={"md"}
              py={"2"}
              bg={useColorModeValue("gray.900", "gray.300")}
              color={useColorModeValue("white", "gray.900")}
              textTransform={"uppercase"}
              _hover={{
                transform: "translateY(2px)",
                boxShadow: "lg",
              }}
              isDisabled={!plantillaLink}
              title={
                plantillaLink
                  ? "Ver plantilla de costos"
                  : "Este producto no tiene una plantilla asociada"
              }
            >
              Ver Planilla
            </Button>
          </Center>
          <Center>
            <Button
              as={Link}
              to={`/productos/update/${products._id}`}
              rightIcon={<FcSettings size={20} />}
              rounded={"15px"}
              w={"75%"}
              mt={1}
              size={"md"}
              py={"2"}
              bg={useColorModeValue("gray.900", "gray.300")}
              color={useColorModeValue("white", "gray.900")}
              textTransform={"uppercase"}
              _hover={{
                transform: "translateY(2px)",
                boxShadow: "lg",
              }}
            >
              Modificar Producto
            </Button>
          </Center>
          <Center>
            <Button
              rightIcon={<MdDeleteForever size={24} />}
              rounded={"15px"}
              w={"75%"}
              mt={1}
              size={"md"}
              py={"2"}
              bg={"red.700"}
              color={"black"}
              textTransform={"uppercase"}
              _hover={{
                transform: "translateY(2px)",
                boxShadow: "lg",
              }}
              isLoading={loading}
              onClick={onOpen}
            >
              Eliminar Producto
            </Button>
          </Center>
          <Modal isOpen={isOpen} onClose={onClose} isCentered>
            <ModalOverlay />
            <ModalContent>
              <ModalHeader>¿Eliminar producto?</ModalHeader>
              <ModalBody>
                ¿Estás seguro de que quieres eliminar este producto? Esta acción
                no se puede deshacer.
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
        </Stack>
      </SimpleGrid>
    </Container>
  );
};
