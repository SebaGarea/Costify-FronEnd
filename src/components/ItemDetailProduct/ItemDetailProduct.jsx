import React, { useMemo, useState } from "react";
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
  Badge,
  Divider,
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
  Wrap,
  WrapItem,
} from "@chakra-ui/react";
import { FcMoneyTransfer, FcSettings } from "react-icons/fc";
import { GoArrowLeft } from "react-icons/go";
import { MdDeleteForever } from "react-icons/md";
import { useDeleteProduct } from "../../hooks/index.js";
import { Link, useNavigate } from "react-router-dom";
import {
  getMercadoLibrePrices,
  getNubePrices,
  loadPlataformasConfigFromStorage,
} from "../../constants/platformPricing.js";

const formatPrice = (value) => {
  const amount = Number(value) || 0;
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: amount % 1 === 0 ? 0 : 2,
    minimumFractionDigits: amount % 1 === 0 ? 0 : 2,
  }).format(amount);
};

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

  const plataformasConfig = useMemo(
    () => loadPlataformasConfigFromStorage(),
    []
  );
  const precioCalculado = useMemo(
    () =>
      Number(
        products?.precioActual ??
          products?.planillaCosto?.precioFinal ??
          products?.precio ??
          0
      ),
    [products]
  );
  const montoObjetivo = precioCalculado;
  const mercadoLibrePrices = useMemo(
    () => getMercadoLibrePrices(montoObjetivo, plataformasConfig),
    [montoObjetivo, plataformasConfig]
  );
  const nubePricing = useMemo(
    () => getNubePrices(montoObjetivo, plataformasConfig),
    [montoObjetivo, plataformasConfig]
  );
  const {
    basePercent: nubeBasePercent,
    cuotasExtraPercent: nubeCuotasExtraPercent,
    totalCuotasPercent: nubeCuotasTotalPercent,
    valorBase: valorNube,
    valorCuotas: valorNubeCuotas,
  } = nubePricing;
  const plataformaCardBg = useColorModeValue("gray.50", "gray.800");
  const plataformaCardBorder = useColorModeValue("gray.200", "gray.600");
  const plataformaHeadingColor = useColorModeValue("teal.600", "teal.200");
  const plataformaMutedColor = useColorModeValue("gray.600", "gray.400");
  const plataformaInnerBg = useColorModeValue("white", "gray.900");

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
                ${precioCalculado.toLocaleString()}
                <Box as="span" ml={4}>
                  <FcMoneyTransfer />
                </Box>
              </Flex>
            </Box>
            {/* <Box
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
            </Box> */}
          </Box>
          <Stack spacing={3} align="center">
            <Button
              as={plantillaLink ? Link : undefined}
              to={plantillaLink ?? undefined}
              rounded={"15px"}
              w={{ base: "100%", md: "75%" }}
              size={"ls"}
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
            <Button
              as={Link}
              to={`/productos/update/${products._id}`}
              rightIcon={<FcSettings size={20} />}
              rounded={"15px"}
              w={{ base: "100%", md: "75%" }}
              size={"ls"}
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
            <Button
              rightIcon={<MdDeleteForever size={24} />}
              rounded={"15px"}
              w={{ base: "100%", md: "75%" }}
              size={"ls"}
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
          </Stack>
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
      <Box mt={{ base: 1, md: 3 }} mb={{ base: 10, md: 16 }}>
        <Heading
          as="h3"
          size="lg"
          textAlign="center"
          color={plataformaHeadingColor}
        >
          Precios por Plataforma
        </Heading>
        <Text
          textAlign="center"
          fontSize="sm"
          color={plataformaMutedColor}
          mt={1}
        >
          Calculado con la configuración actual de comisiones
        </Text>
        <Stack
          direction={{ base: "column", lg: "row" }}
          spacing={6}
          mt={6}
          align="stretch"
        >
          <Box
            flex="1"
            borderWidth="1px"
            borderColor={plataformaCardBorder}
            borderRadius="lg"
            bg={plataformaCardBg}
            p={5}
          >
            <Flex justify="space-between" align="center" mb={4}>
              <Text fontWeight="bold" fontSize="lg">
                Mercado Libre
              </Text>
              <Badge colorScheme="teal" fontSize="0.8em">
                Base {mercadoLibrePrices[0]?.basePercent ?? 0}%
              </Badge>
            </Flex>
            <Wrap spacing={4}>
              {mercadoLibrePrices.map((plan) => (
                <WrapItem key={plan.key}>
                  <Box
                    borderWidth="1px"
                    borderColor={plataformaCardBorder}
                    borderRadius="md"
                    bg={plataformaInnerBg}
                    p={3}
                    minW="220px"
                  >
                    <Text fontWeight="semibold" fontSize="sm">
                      {plan.label}
                    </Text>
                    <Text fontSize="xs" color={plataformaMutedColor} mt={1}>
                      Comisión {plan.comisionTotalPercent}% (Base {plan.basePercent}% + Cuotas {plan.extraPercent}%)
                    </Text>
                    <Badge
                      colorScheme={plan.badgeColor}
                      fontSize="0.85em"
                      px={3}
                      py={1}
                      mt={3}
                      w="fit-content"
                    >
                      {formatPrice(plan.precio)}
                    </Badge>
                  </Box>
                </WrapItem>
              ))}
            </Wrap>
          </Box>
          <Box
            flex="1"
            borderWidth="1px"
            borderColor={plataformaCardBorder}
            borderRadius="lg"
            bg={plataformaCardBg}
            p={5}
          >
            <Text fontWeight="bold" fontSize="lg" mb={4}>
              Tienda Nube
            </Text>
            <Stack direction={{ base: "column", md: "row" }} spacing={4}>
              <Box
                flex="1"
                borderWidth="1px"
                borderColor={plataformaCardBorder}
                borderRadius="md"
                bg={plataformaInnerBg}
                p={3}
              >
                <Text fontWeight="semibold">Venta base</Text>
                <Text fontSize="xs" color={plataformaMutedColor} mt={1}>
                  Comisión {nubeBasePercent}%
                </Text>
                <Badge colorScheme="teal" fontSize="0.85em" px={3} py={1} mt={3}>
                  {formatPrice(valorNube)}
                </Badge>
              </Box>
              <Box
                flex="1"
                borderWidth="1px"
                borderColor={plataformaCardBorder}
                borderRadius="md"
                bg={plataformaInnerBg}
                p={3}
              >
                <Text fontWeight="semibold">Venta con cuotas</Text>
                <Text fontSize="xs" color={plataformaMutedColor} mt={1}>
                  Comisión {nubeCuotasTotalPercent}% (Base {nubeBasePercent}% + Cuotas {nubeCuotasExtraPercent}%)
                </Text>
                <Badge colorScheme="cyan" fontSize="0.85em" px={3} py={1} mt={3}>
                  {formatPrice(valorNubeCuotas)}
                </Badge>
              </Box>
            </Stack>
          </Box>
        </Stack>
      </Box>
    </Container>
  );
};
