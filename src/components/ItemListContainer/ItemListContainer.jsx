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
import { Link, useSearchParams } from "react-router-dom";
const BASE_URL = import.meta.env.VITE_API_URL;
const resolveImageUrl = (imagenes) => {
  if (!imagenes) return "";
  const first = Array.isArray(imagenes) ? imagenes[0] : imagenes;
  if (!first) return "";
  return first.startsWith("http") ? first : `${BASE_URL}${first}`;
};

const ITEMS_PER_PAGE = 10;

export const ItemListContainer = ({ products }) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedCatalogo = searchParams.get("catalogo") || null;
  const selectedModelo = searchParams.get("modelo") || null;
  const currentPage = parseInt(searchParams.get("pagina") || "1", 10);
  const orden = searchParams.get("orden") || "recientes";

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

  const colorBg = useColorModeValue("white", "gray.800");
  const colorBgBox = useColorModeValue("gray.100", "gray.700");

  const catalogosUnicos = [
    ...new Set(products.map((p) => p.catalogo).filter(Boolean)),
  ].sort((a, b) => a.localeCompare(b, "es", { sensitivity: "base" }));

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

  const filteredProducts = products.filter((p) => {
    if (selectedCatalogo && selectedModelo) {
      return p.catalogo === selectedCatalogo && p.modelo === selectedModelo;
    }
    if (selectedCatalogo) {
      return p.catalogo === selectedCatalogo;
    }
    return true;
  });

  const sortedProducts = [...filteredProducts].sort((a, b) => {
    // Stock 0 siempre al final
    const asinStock = (a.stock ?? 0) === 0;
    const bsinStock = (b.stock ?? 0) === 0;
    if (asinStock !== bsinStock) return asinStock ? 1 : -1;

    switch (orden) {
      case "nombre-az":
        return (a.nombre || "").localeCompare(b.nombre || "", "es", { sensitivity: "base" });
      case "precio-asc": {
        const pa = Number(a.planillaCosto?.precioFinal ?? a.precioActual ?? a.precio ?? 0);
        const pb = Number(b.planillaCosto?.precioFinal ?? b.precioActual ?? b.precio ?? 0);
        return pa - pb;
      }
      case "precio-desc": {
        const pa = Number(a.planillaCosto?.precioFinal ?? a.precioActual ?? a.precio ?? 0);
        const pb = Number(b.planillaCosto?.precioFinal ?? b.precioActual ?? b.precio ?? 0);
        return pb - pa;
      }
      case "stock-desc":
        return (b.stock ?? 0) - (a.stock ?? 0);
      case "recientes":
      default:
        return b._id > a._id ? 1 : -1;
    }
  });

  const totalPages = Math.max(1, Math.ceil(sortedProducts.length / ITEMS_PER_PAGE));
  const paginatedProducts = sortedProducts.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  return (
    <>
      <Box mb={2} p={2} bg={colorBgBox} borderRadius="lg">
        <Stack direction={{ base: "column", md: "row" }} spacing={{ base: 2, md: 4 }} align={{ base: "stretch", md: "center" }}>
          {/* Dropdown Catálogo */}
          <Menu>
            <MenuButton
              textTransform="uppercase"
              as={Button}
              rightIcon={<FiChevronDown />}
              size={{ base: "sm", md: "md" }}
            >
              {selectedCatalogo || "Catálogo"}
            </MenuButton>
            <MenuList>
              {catalogosUnicos.map((cat) => (
                <MenuItem
                  key={cat}
                  onClick={() => {
                    updateParams({ catalogo: cat, modelo: null, pagina: null });
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
              size={{ base: "sm", md: "md" }}
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
                    onClick={() => { updateParams({ modelo, pagina: null }); }}
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
                updateParams({ catalogo: null, modelo: null, pagina: null });
              }}
              size={{ base: "sm", md: "md" }}
            >
              Borrar Filtros
            </Button>
          )}

          <Spacer display={{ base: "none", md: "block" }} />

          {/* Dropdown Ordenar por */}
          <Menu>
            <MenuButton
              as={Button}
              rightIcon={<FiChevronDown />}
              size={{ base: "sm", md: "md" }}
              variant="outline"
            >
              {{
                "recientes": "Más recientes",
                "nombre-az": "Nombre A-Z",
                "precio-asc": "Precio ↑",
                "precio-desc": "Precio ↓",
                "stock-desc": "Mayor stock",
              }[orden]}
            </MenuButton>
            <MenuList>
              {[
                { value: "recientes", label: "Más recientes" },
                { value: "nombre-az", label: "Nombre A-Z" },
                { value: "precio-asc", label: "Precio: menor a mayor" },
                { value: "precio-desc", label: "Precio: mayor a menor" },
                { value: "stock-desc", label: "Mayor stock primero" },
              ].map((op) => (
                <MenuItem
                  key={op.value}
                  onClick={() => updateParams({ orden: op.value === "recientes" ? null : op.value, pagina: null })}
                  fontWeight={orden === op.value ? "bold" : "normal"}
                >
                  {op.label}
                </MenuItem>
              ))}
            </MenuList>
          </Menu>

          <Button
            as={Link}
            to={"/productos/itemAdd"}
            leftIcon={<FiPlus color="#67e8f9" size={"25"} strokeWidth={4} />}
            size={{ base: "sm", md: "md" }}
            width={{ base: "100%", md: "auto" }}
          >
            Agregar Producto
          </Button>
        </Stack>
      </Box>

      <Center py={12}>
        <SimpleGrid columns={{ base: 1, sm: 2, md: 3, lg: 4 }} spacing={8}>
          {paginatedProducts.map((product) => {
            const planilla = product?.planillaCosto ?? null;
            const costoPlanilla = Number(planilla?.costoTotal ?? 0);
            const precioPlanilla = Number(planilla?.precioFinal ?? 0);
            const gananciaPlanilla = precioPlanilla - costoPlanilla;
            const displayedPrice = Number(
              planilla?.precioFinal ?? product?.precioActual ?? product?.precio ?? 0
            );

            return (
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
                {planilla ? (
                  <VStack spacing={3} w="full">
                    <Badge colorScheme="blue" fontSize="xs" px={2} py={1}>
                      Plantilla: {planilla.nombre}
                    </Badge>
                    
                    {planilla.tipoProyecto && (
                      <Badge colorScheme="purple" fontSize="xs" px={2} py={1}>
                        {planilla.tipoProyecto}
                      </Badge>
                    )}
                    
                    <VStack spacing={1} w="full">
                      <HStack justify="space-between" w="full">
                        <Text fontSize="xs" color="gray.600">Costo Total:</Text>
                        <Text fontSize="xs" fontWeight="bold" color="green.600">
                          ${costoPlanilla.toLocaleString()}
                        </Text>
                      </HStack>
                      
                      <HStack justify="space-between" w="full">
                        <Text fontSize="xs" color="gray.600">Precio Plantilla:</Text>
                        <Text fontSize="xs" fontWeight="bold" color="blue.600">
                          ${precioPlanilla.toLocaleString()}
                        </Text>
                      </HStack>
                      
                      <HStack justify="space-between" w="full">
                        <Text fontSize="xs" color="gray.600">Ganancia Plantilla:</Text>
                        <Text fontSize="xs" fontWeight="bold" color="orange.600">
                          ${gananciaPlanilla.toLocaleString()}
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
                    ${displayedPrice.toLocaleString()}
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
            );
          })}
        </SimpleGrid>
      </Center>

      {totalPages > 1 && (
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
    </>
  );
};
