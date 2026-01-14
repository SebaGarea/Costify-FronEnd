import {
  Box,
  Center,
  useColorModeValue,
  Heading,
  Text,
  Stack,
  Image,
  SimpleGrid,
  HStack,
  Button,
  MenuButton,
  MenuList,
  MenuItem,
  Menu,
  Spacer,
  Badge,
  VStack,
  Divider,
} from "@chakra-ui/react";
import { FiChevronDown, FiPlus } from "react-icons/fi";
import { RiArrowRightLine } from "react-icons/ri";
import { Link } from "react-router-dom";
import { useState } from "react";
const BASE_URL = import.meta.env.VITE_API_URL;
const resolveImageUrl = (imagenes) => {
  if (!imagenes) return "";
  const first = Array.isArray(imagenes) ? imagenes[0] : imagenes;
  if (!first) return "";
  return first.startsWith("http") ? first : `${BASE_URL}${first}`;
};

export const ItemListContainer = ({ products }) => {
  const [selectedCatalogo, setSelectedCatalogo] = useState(null);
  const [selectedModelo, setSelectedModelo] = useState(null);
  const colorBg = useColorModeValue("white", "gray.800");
  const colorBgBox = useColorModeValue("gray.100", "gray.700");

  // Catálogos únicos
  const catalogosUnicos = [
    ...new Set(products.map((p) => p.catalogo).filter(Boolean)),
  ];

  // Modelos únicos según catálogo seleccionado
  const modelosUnicos = selectedCatalogo
    ? [
        ...new Set(
          products
            .filter((p) => p.catalogo === selectedCatalogo)
            .map((p) => p.modelo)
            .filter(Boolean)
        ),
      ]
    : [];

  // Filtrar productos por catálogo y modelo
  const filteredProducts = products.filter((p) => {
    if (selectedCatalogo && selectedModelo) {
      return p.catalogo === selectedCatalogo && p.modelo === selectedModelo;
    }
    if (selectedCatalogo) {
      return p.catalogo === selectedCatalogo;
    }
    return true;
  });

  return (
    <>
      <Box mb={2} p={2} bg={colorBgBox} borderRadius="lg">
        <HStack spacing={4}>
          {/* Dropdown Catálogo */}
          <Menu>
            <MenuButton
              textTransform="uppercase"
              as={Button}
              rightIcon={<FiChevronDown />}
            >
              {selectedCatalogo || "Catálogo"}
            </MenuButton>
            <MenuList>
              {catalogosUnicos.map((cat) => (
                <MenuItem
                  key={cat}
                  onClick={() => {
                    setSelectedCatalogo(cat);
                    setSelectedModelo(null); // Reset modelo al cambiar catálogo
                  }}
                  justifyContent="center"
                  textTransform="uppercase"
                >
                  {cat}
                </MenuItem>
              ))}
            </MenuList>
          </Menu>

          {/* Dropdown Modelo (dependiente de catálogo) */}
          <Menu isDisabled={!selectedCatalogo}>
            <MenuButton
              textTransform="uppercase"
              as={Button}
              rightIcon={<FiChevronDown />}
            >
              {selectedModelo || "Modelo"}
            </MenuButton>
            <MenuList>
              {modelosUnicos.length === 0 ? (
                <MenuItem disabled>Sin modelos</MenuItem>
              ) : (
                modelosUnicos.map((modelo) => (
                  <MenuItem
                    key={modelo}
                    onClick={() => setSelectedModelo(modelo)}
                    justifyContent="center"
                    textTransform="uppercase"
                  >
                    {modelo}
                  </MenuItem>
                ))
              )}
            </MenuList>
          </Menu>

          {(selectedCatalogo || selectedModelo) && (
            <Button
              colorScheme="red"
              variant="outline"
              onClick={() => {
                setSelectedCatalogo(null);
                setSelectedModelo(null);
              }}
            >
              Borrar Filtros
            </Button>
          )}
          <Spacer />

          <Button
            as={Link}
            to={"/productos/itemAdd"}
            leftIcon={<FiPlus color="#67e8f9" size={"25"} strokeWidth={4} />}
            mr={15}
          >
            Agregar Producto
          </Button>
        </HStack>
      </Box>

      <Center py={12}>
        <SimpleGrid columns={{ base: 1, sm: 2, md: 3, lg: 4 }} spacing={8}>
          {filteredProducts.map((product) => (
            <Box
              key={product._id}
              role={"group"}
              p={6}
              maxW={"330px"}
              w={"full"}
              bg={colorBg}
              boxShadow={"2xl"}
              rounded={"lg"}
              pos={"relative"}
              zIndex={1}
            >
              <Box
                rounded={"lg"}
                mt={0}
                pos={"relative"}
                height={"230px"}
                overflow={"hidden"}
                _after={{
                  transition: "all .3s ease",
                  content: '""',
                  w: "full",
                  h: "full",
                  pos: "absolute",
                  top: 0,
                  left: 0,
                  backgroundImage: `url(${resolveImageUrl(product.imagenes)})`,
                  filter: "blur(15px)",
                  zIndex: -1,
                }}
                _groupHover={{
                  _after: {
                    filter: "blur(20px)",
                  },
                }}
              >
                <Image
                  rounded={"lg"}
                  height={230}
                  width={282}
                  objectFit={"cover"}
                  src={resolveImageUrl(product.imagenes)}
                  alt={product.nombre}
                />
              </Box>
              <Stack pt={10} align={"center"} spacing={4}>
                <Text
                  fontSize={"md"}
                  textTransform={"uppercase"}
                  fontWeight={500}
                  textAlign="center"
                >
                  {product.nombre}
                </Text>
                
                {/* Información de la plantilla asociada */}
                {product.planillaCosto ? (
                  <VStack spacing={3} w="full">
                    <Badge colorScheme="blue" fontSize="xs" px={2} py={1}>
                      Plantilla: {product.planillaCosto.nombre}
                    </Badge>
                    
                    {product.planillaCosto.tipoProyecto && (
                      <Badge colorScheme="purple" fontSize="xs" px={2} py={1}>
                        {product.planillaCosto.tipoProyecto}
                      </Badge>
                    )}
                    
                    <VStack spacing={1} w="full">
                      <HStack justify="space-between" w="full">
                        <Text fontSize="xs" color="gray.600">Costo Total:</Text>
                        <Text fontSize="xs" fontWeight="bold" color="green.600">
                          ${Number(product.planillaCosto.costoTotal || 0).toLocaleString()}
                        </Text>
                      </HStack>
                      
                      <HStack justify="space-between" w="full">
                        <Text fontSize="xs" color="gray.600">Precio Plantilla:</Text>
                        <Text fontSize="xs" fontWeight="bold" color="blue.600">
                          ${Number(product.planillaCosto.precioFinal || 0).toLocaleString()}
                        </Text>
                      </HStack>
                      
                      <HStack justify="space-between" w="full">
                        <Text fontSize="xs" color="gray.600">Ganancia Plantilla:</Text>
                        <Text fontSize="xs" fontWeight="bold" color="orange.600">
                          ${Number((product.planillaCosto.precioFinal || 0) - (product.planillaCosto.costoTotal || 0)).toLocaleString()}
                        </Text>
                      </HStack>
                    </VStack>
                    
                    <Divider />
                  </VStack>
                ) : (
                  <Badge colorScheme="gray" fontSize="xs" px={2} py={1}>
                    Sin plantilla asociada
                  </Badge>
                )}
                
                <Heading fontSize={"sm"} fontFamily={"body"} fontWeight={200} textAlign="center">
                  {product.descripcion.length > 60
                    ? product.descripcion.slice(0, 60) + "..."
                    : product.descripcion}
                </Heading>
                
                <Stack direction={"row"} align={"center"}>
                  <Text fontWeight={800} fontSize={"xl"} color="green.500">
                    ${Number(product.precio).toLocaleString()}
                  </Text>
                  <Text ml={2} color={"gray.600"} fontSize="sm">
                    Stock: {product.stock}
                  </Text>
                </Stack>
                <HStack>
                  <Button
                    as={Link}
                    to={`/productos/${product._id}`}
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
                <Text m={2} color={"gray.600"}>
                  Id: {product._id}
                </Text>
              </Stack>
            </Box>
          ))}
        </SimpleGrid>
      </Center>
    </>
  );
};
