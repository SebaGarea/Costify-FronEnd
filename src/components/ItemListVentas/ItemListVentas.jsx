import {
  Box,
  Heading,
  HStack,
  Text,
  VStack,
  useColorModeValue,
  Button,
  Textarea,
  color,
} from "@chakra-ui/react";
import { PiListPlusDuotone } from "react-icons/pi";
import { AiOutlineFileSearch } from "react-icons/ai";
import { useNavigate } from "react-router-dom";
import { useGetVentasPaginated } from "../../hooks/ventas/useGetVentasPaginated.js";
import { Loader } from "../Loader/Loader.jsx";

export const ItemListVentas = () => {
  const { items, total, page, totalPages, loading, error, setPage } =
    useGetVentasPaginated(1, 10);
  const navigate = useNavigate();
  const medioLabels = {
    mercado_libre: "Mercado Libre",
    instagram: "Instagram",
    nube: "Nube",
    whatsapp: "WhatsApp",
    otro: "Otro",
  };
  const iconColor = useColorModeValue("blue.500", "blue.300");
  const cardVentas = useColorModeValue("gray.100", "gray.800");
  const bg = useColorModeValue("gray.50", "gray.900");
  const heading = useColorModeValue("blue.600", "blue.300");
  const text = useColorModeValue("gray.700", "gray.200");
  const errorColor = useColorModeValue("red.500", "red.300");
  const border = useColorModeValue("gray.500", "gray.600");
  const filaMonetariaBg = useColorModeValue("gray.50", "gray.700");
  const descBg = useColorModeValue("white", "gray.800");
  // Defensa: ordenar en cliente por si el cache responde fuera de orden
  const ventasOrdenadas = Array.isArray(items)
    ? [...items].sort((a, b) => {
        const ca = new Date(a.createdAt || a.fecha || 0).getTime();
        const cb = new Date(b.createdAt || b.fecha || 0).getTime();
        if (cb !== ca) return cb - ca; // más nuevo primero
        // desempate por fecha explícita si existe
        const fa = new Date(a.fecha || 0).getTime();
        const fb = new Date(b.fecha || 0).getTime();
        if (fb !== fa) return fb - fa;
        // último recurso: _id descendente
        return String(b._id).localeCompare(String(a._id));
      })
    : [];

  if (loading) return <Loader />;
  if (error) return <Text color={errorColor}>Error: {error}</Text>;

  return (
    <Box p={6} bg={bg} minH="100vh">
      <HStack mb={6} justifyContent="space-around">
        <Heading mb={6} color={heading}>
          📊 Gestión de Ventas
        </Heading>
        <Button
          textAlign="center"
          onClick={() => navigate("/ventas/itemAdd")}
          rightIcon={<PiListPlusDuotone size={20} color={iconColor} />}
        >
          Agregar venta
        </Button>
      </HStack>
      <VStack spacing={4} align="stretch">
        {ventasOrdenadas.length === 0 ? (
          <Text textAlign="center" color={text}>
            No hay ventas registradas
          </Text>
        ) : (
          ventasOrdenadas.map((venta) => {
            let plantillaId = null;
            if (venta.producto && venta.producto.planillaCosto) {
              plantillaId =
                typeof venta.producto.planillaCosto === "object"
                  ? venta.producto.planillaCosto._id
                  : venta.producto.planillaCosto;
            }
            return (
              <Box
                key={venta._id}
                p={{ base: 3, md: 5 }}
                borderWidth="1px"
                borderRadius="xl"
                bg={cardVentas}
                borderColor={border}
                shadow="md"
                transition="box-shadow 0.2s"
                _hover={{ shadow: "lg", borderColor: heading }}
                maxW="900px"
                minW={"300px"}
                width={"100vw"}
                mx="auto"
              >
                {/* Primera fila: datos principales */}
                <HStack
                  spacing={2}
                  alignItems="center"
                  flexWrap="wrap"
                  mb={2}
                  justifyContent={{ base: "flex-start", md: "space-between" }}
                >
                  <Text fontWeight="bold" color={heading} minW="90px">
                    {new Date(venta.fecha).toLocaleDateString()}
                  </Text>
                  <Text color={text} minW="120px" fontSize="md">
                    {venta.cliente}
                  </Text>
                  <Text color={text} minW="120px" fontSize="md">
                    {medioLabels[venta.medio] ?? venta.medio}
                  </Text>
                  <HStack spacing={1} minW="160px">
                    <Text color={text} fontSize="md">
                      {venta.productoNombre ??
                        (venta.producto
                          ? `${venta.producto.nombre ?? ""} ${
                              venta.producto.modelo ?? ""
                            }`.trim()
                          : "")}
                    </Text>
                    {plantillaId && (
                      <Box ml={1}>
                        <AiOutlineFileSearch
                          style={{ cursor: "pointer" }}
                          onClick={() =>
                            navigate(`/plantillas/plantillaAdd/${plantillaId}`)
                          }
                          title="Ver plantilla de costo"
                          size={20}
                          color={iconColor}
                        />
                      </Box>
                    )}
                  </HStack>
                  <Text color={text} minW="80px" fontSize="md">
                    x{venta.cantidad}
                  </Text>
                </HStack>
                {/* Descripción debajo en Textarea de solo lectura */}
                <Box mt={2} w="100%">
                  <Text
                    fontWeight="semibold"
                    color={heading}
                    fontSize="sm"
                    mb={1}
                  >
                    Descripción
                  </Text>
                  <Textarea
                    value={venta.descripcion || venta.descripcionVenta || ""}
                    isReadOnly
                    size="sm"
                    minH="60px"
                    maxH="160px"
                    resize="vertical"
                    bg={descBg}
                    borderColor={border}
                    _readOnly={{ opacity: 1, cursor: "default" }}
                    placeholder="Sin descripción"
                  />
                </Box>
                {/* Segunda fila: valores monetarios */}
                <HStack
                  spacing={4}
                  alignItems="center"
                  flexWrap="wrap"
                  justifyContent={{ base: "flex-start", md: "flex-end" }}
                  bg={filaMonetariaBg}
                  p={2}
                  borderRadius="md"
                >
                  <Text color={text} fontSize="sm">
                    <b>Envío:</b> ${venta.valorEnvio}
                  </Text>
                  <Text color={text} fontSize="sm">
                    <b>Seña:</b> ${venta.seña}
                  </Text>
                  <Text color={text} fontSize="sm">
                    <b>Total:</b> ${venta.valorTotal}
                  </Text>
                  <Text color={heading} fontWeight="bold" fontSize="md">
                    Restan: ${venta.restan}
                  </Text>
                </HStack>
              </Box>
            );
          })
        )}
        {/* Controles de paginación */}
        <HStack justifyContent="space-between" mt={4}>
          <Text color={text}>
            Página {page} de {totalPages} — Total: {total}
          </Text>
          <HStack>
            <Button
              onClick={() => setPage(Math.max(1, page - 1))}
              isDisabled={page <= 1}
            >
              Anterior
            </Button>
            <Button
              onClick={() => setPage(Math.min(totalPages, page + 1))}
              isDisabled={page >= totalPages}
            >
              Siguiente
            </Button>
          </HStack>
        </HStack>
      </VStack>
    </Box>
  );
};
