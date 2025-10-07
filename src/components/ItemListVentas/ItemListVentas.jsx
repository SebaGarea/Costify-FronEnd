import {
  Box,
  FormControl,
  FormLabel,
  Heading,
  HStack,
  Text,
  Input,
  VStack,
  useColorModeValue,
  Select,
  Textarea,
  InputGroup,
  InputLeftAddon,
} from "@chakra-ui/react";
import { AiOutlineFileSearch } from "react-icons/ai";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { useGetAllVentas } from "../../hooks/ventas/useGetAllVentas.js";
import { Loader } from "../Loader/Loader.jsx";
import { useItems, useUpdateVentas } from "../../hooks/index.js";

const mediosVenta = [
  { value: "mercado_libre", label: "Mercado Libre" },
  { value: "instagram", label: "Instagram" },
  { value: "nube", label: "Nube" },
  { value: "whatsapp", label: "WhatsApp" },
];

export const ItemListVentas = () => {
  const { ventasData, loading, error } = useGetAllVentas();
  const { productsData } = useItems();
  const { updateVenta } = useUpdateVentas();

  const navigate = useNavigate();

  const [editingValues, setEditingValues] = useState({});
  const [searchProducto, setSearchProducto] = useState({});
  const [showSuggestions, setShowSuggestions] = useState({});

  // 🎨 modo claro/oscuro
  const bg = useColorModeValue("gray.50", "gray.900");
  const heading = useColorModeValue("blue.600", "blue.300");
  const text = useColorModeValue("gray.700", "gray.200");
  const errorColor = useColorModeValue("red.500", "red.300");
  const card = useColorModeValue("white", "gray.800");
  const border = useColorModeValue("gray.200", "gray.600");
  const input = useColorModeValue("gray.50", "gray.700");
  const label = useColorModeValue("gray.600", "gray.300");
  const focus = useColorModeValue("blue.500", "blue.300");
  const hoverBg = useColorModeValue("gray.100", "gray.700");

  if (loading) return <Loader />;
  if (error) return <Text color={errorColor}>Error: {error}</Text>;

  return (
    <Box  p={6} bg={bg} minH="100vh">
      <Heading mb={6} color={heading}>
        📊 Gestión de Ventas
      </Heading>

      <VStack spacing={4} align="stretch">
        {ventasData.length === 0 ? (
          <Text textAlign="center" color={text}>
            No hay ventas registradas
          </Text>
        ) : (
          ventasData.map((venta) => (
            <Box
              
              key={venta._id}
              p={3}
              borderWidth="1px"
              borderRadius="lg"
              bg={bg}
              borderColor={border}
              shadow="md"
              _hover={{
                shadow: "lg",
                transform: "translateY(-2px)",
                transition: "all 0.2s",
              }}
            >
              <HStack spacing={1} align="center">
                ------
                {/* Fecha */}
                <FormControl width={"140px"}>
                  <FormLabel fontSize="sm" mb={1} color={label}>
                    Fecha
                  </FormLabel>
                  <Input
                    type="date"
                    value={new Date(venta.fecha).toISOString().split("T")[0]}
                    readOnly
                    textAlign="center"
                    bg={input}
                    color={text}
                    borderColor={border}
                    fontSize="sm"
                    _focus={{
                      borderColor: focus,
                      boxShadow: `0 0 0 1px ${focus}`,
                    }}
                  />
                </FormControl>
                ------
                {/* Cliente */}
                <FormControl width="auto" maxW="150px">
                  <FormLabel fontSize="sm" mb={1} color={label}>
                    Cliente
                  </FormLabel>
                  <Input
                    value={editingValues[venta._id]?.cliente ?? venta.cliente}
                    onChange={async (e) => {
                      const nuevoValor = e.target.value;
                      setEditingValues((prev) => ({
                        ...prev,
                        [venta._id]: {
                          ...prev[venta._id],
                          cliente: nuevoValor,
                        },
                      }));
                      await updateVenta(venta._id, { cliente: nuevoValor });
                    }}
                    bg={input}
                    color={text}
                    width="160px"
                    borderColor={border}
                    _focus={{
                      borderColor: focus,
                      boxShadow: `0 0 0 1px ${focus}`,
                    }}
                  />
                </FormControl>
                ------
                {/* Medio de Venta */}
                <FormControl width="auto" maxW="150px mr-2">
                  <FormLabel fontSize="sm" mb={1} color={label}>
                    Medio de Venta
                  </FormLabel>
                  <Select
                    textAlign={"center"}
                    width={"155px"}
                    value={editingValues[venta._id]?.medio ?? venta.medio}
                    onChange={async (e) => {
                      const nuevoValor = e.target.value;
                      setEditingValues((prev) => ({
                        ...prev,
                        [venta._id]: {
                          ...prev[venta._id],
                          medio: nuevoValor,
                        },
                      }));
                      await updateVenta(venta._id, { medio: nuevoValor });
                    }}
                    ml={2.5}
                    bg={input}
                    color={text}
                    borderColor={border}
                    _focus={{
                      borderColor: focus,
                      boxShadow: `0 0 0 1px ${focus}`,
                    }}
                  >
                    {mediosVenta.map((medio) => (
                      <option key={medio.value} value={medio.value}>
                        {medio.label}
                      </option>
                    ))}
                  </Select>
                </FormControl>
                ------
                {/* Producto */}
                <FormControl
                  width="auto"
                  maxW="500px"
                  mr={2}
                  position="relative"
                >
                  <FormLabel
                    position={"relative"}
                    fontSize="sm"
                    mb={1}
                    color={label}
                    textAlign="start"
                  >
                    Producto
                  </FormLabel>
                  <Box position="relative">
                    <HStack spacing={2} align="center">
                      <Textarea
                        value={
                          editingValues[venta._id]?.productoNombre ??
                          venta.productoNombre ??
                          (venta.producto
                            ? `${venta.producto.nombre ?? ""} ${
                                venta.producto.modelo ?? ""
                              }`.trim()
                            : "") ??
                          ""
                        }
                        autoComplete="off"
                        bg={input}
                        color={text}
                        borderColor={border}
                        fontSize="sm"
                        width={"180px"}
                        minWidth="120px"
                        maxWidth="250px"
                        resize={"vertical"}
                        minH={"40px"}
                        _focus={{
                          borderColor: focus,
                          boxShadow: `0 0 0 1px ${focus}`,
                        }}
                        onFocus={() =>
                          setShowSuggestions((prev) => ({
                            ...prev,
                            [venta._id]: true,
                          }))
                        }
                        onChange={(e) => {
                          const texto = e.target.value;
                          setSearchProducto((prev) => ({
                            ...prev,
                            [venta._id]: texto,
                          }));
                          setEditingValues((prev) => ({
                            ...prev,
                            [venta._id]: {
                              ...prev[venta._id],
                              productoNombre: texto,
                            },
                          }));
                        }}
                        onBlur={async (e) => {
                          setTimeout(async () => {
                            setShowSuggestions((prev) => ({
                              ...prev,
                              [venta._id]: false,
                            }));
                            const texto = e.target.value;
                            const productoCoincide = productsData.find(
                              (p) =>
                                `${p.nombre ?? ""} ${p.modelo ?? ""}`.trim() ===
                                texto.trim()
                            );
                            await updateVenta(venta._id, {
                              productoNombre: texto,
                              producto: productoCoincide
                                ? productoCoincide._id
                                : null,
                            });
                          }, 150);
                        }}
                      />
                      {/* Lupa Icon  */}
                      {(() => {
                        const inputActual =
                          editingValues[venta._id]?.productoNombre ??
                          venta.productoNombre ??
                          (venta.producto
                            ? `${venta.producto.nombre ?? ""} ${
                                venta.producto.modelo ?? ""
                              }
                              }`.trim()
                            : "");
                        const productoCoincide = productsData.find(
                          (p) =>
                            `${p.nombre ?? ""} ${p.modelo ?? ""}`.trim() ===
                            inputActual.trim()
                        );
                        if (
                          productoCoincide &&
                          productoCoincide.planillaCosto
                        ) {
                          const plantillaId =
                            typeof productoCoincide.planillaCosto === "object"
                              ? productoCoincide.planillaCosto._id
                              : productoCoincide.planillaCosto;
                          return (
                            <Box ml={1}>
                              <AiOutlineFileSearch
                                style={{ cursor: "pointer" }}
                                onClick={() =>
                                  navigate(
                                    `/plantillas/plantillaAdd/${plantillaId}`
                                  )
                                }
                                title="Ver plantilla de costo"
                                size={22}
                                color={focus}
                              />
                            </Box>
                          );
                        }
                        return null;
                      })()}
                    </HStack>
                    {showSuggestions[venta._id] && (
                      <Box
                        position="absolute"
                        top="100%"
                        left={0}
                        width="250px"
                        bg={input}
                        borderWidth="2px"
                        borderStyle="solid"
                        borderColor={focus}
                        borderRadius="md"
                        boxShadow="xl"
                        zIndex={10}
                        maxH="200px"
                        overflowY="auto"
                        mt={1}
                        p={1}
                      >
                        {productsData
                          .filter((producto) =>
                            producto.nombre
                              .toLowerCase()
                              .includes(
                                (searchProducto[venta._id] ?? "").toLowerCase()
                              )
                          )
                          .map((producto) => (
                            <Box
                              key={producto._id}
                              onClick={async () => {
                                const nombreModelo = `${
                                  producto.nombre ?? ""
                                } ${producto.modelo ?? ""}`.trim();
                                setEditingValues((prev) => ({
                                  ...prev,
                                  [venta._id]: {
                                    ...prev[venta._id],
                                    productoNombre: nombreModelo,
                                    producto: producto._id,
                                  },
                                }));
                                setShowSuggestions((prev) => ({
                                  ...prev,
                                  [venta._id]: false,
                                }));
                                await updateVenta(venta._id, {
                                  productoNombre: nombreModelo,
                                  producto: producto._id,
                                });
                              }}
                              cursor="pointer"
                              px={2}
                              py={1}
                              _hover={{ bg: hoverBg }}
                            >
                              {producto.nombre} {producto.modelo}
                            </Box>
                          ))}
                      </Box>
                    )}
                  </Box>
                </FormControl>
                ------
                {/* Cantidad */}
                <FormControl width="auto" maxW="150px">
                  <FormLabel
                    fontSize="sm"
                    mb={1}
                    color={label}
                    textAlign={"start"}
                  >
                    Cantidad
                  </FormLabel>
                  <Input
                    type="number"
                    value={
                      editingValues[venta._id]?.cantidad ?? venta.cantidad ?? ""
                    }
                    bg={input}
                    color={text}
                    borderColor={border}
                    fontSize="sm"
                    width="60px"
                    textAlign={"center"}
                    _focus={{
                      borderColor: focus,
                      boxShadow: `0 0 0 1px ${focus}`,
                    }}
                    onChange={async (e) => {
                      const nuevoValor = e.target.value;
                      setEditingValues((prev) => ({
                        ...prev,
                        [venta._id]: {
                          ...prev[venta._id],
                          cantidad: nuevoValor,
                        },
                      }));
                      await updateVenta(venta._id, {
                        cantidad: nuevoValor,
                      });
                    }}
                  />
                </FormControl>
                ------
                {/*Descripcion Local */}
                <FormControl>
                  <FormLabel
                    fontSize="sm"
                    mb={1}
                    color={label}
                    textAlign={"center"}
                  >
                    Descripcion
                  </FormLabel>
                  <Textarea
                    type="textarea"
                    value={
                      editingValues[venta._id]?.descripcionVenta ??
                      venta.descripcionVenta ??
                      ""
                    }
                    onChange={(e) => {
                      const texto = e.target.value;
                      setEditingValues((prev) => ({
                        ...prev,
                        [venta._id]: {
                          ...prev[venta._id],
                          descripcionVenta: texto,
                        },
                      }));
                    }}
                    onBlur={async (e) => {
                      const texto = e.target.value;
                      await updateVenta(venta._id, { descripcionVenta: texto });
                    }}
                    resize={"vertical"}
                    minH={"40px"}
                    width={"250px"}
                  />
                </FormControl>
                ------
                {/*Valor Envio */}
                <FormControl ml={1}>
                  <FormLabel
                    fontSize="sm"
                    mb={1}
                    color={label}
                    textAlign={"center"}
                    maxW={"200px"}
                  >
                    Envio
                  </FormLabel>
                  <InputGroup>
                    <InputLeftAddon textAlign={"start"} w={2} children="$" />
                    <Input
                      maxW={"100px"}
                      type="number"
                      value={
                        editingValues[venta._id]?.valorEnvio ??
                        venta.valorEnvio ??
                        ""
                      }
                      autoComplete="off"
                      onChange={(e) => {
                        const valor = e.target.value;
                        setEditingValues((prev) => ({
                          ...prev,
                          [venta._id]: {
                            ...prev[venta._id],
                            valorEnvio: valor,
                          },
                        }));
                      }}
                      onBlur={async (e) => {
                        const valor = e.target.value;
                        await updateVenta(venta._id, { valorEnvio: valor });
                      }}
                    />
                  </InputGroup>
                </FormControl>
                ------
                {/*Valor Total */}
                <FormControl>
                  <FormLabel
                    fontSize="sm"
                    mb={1}
                    color={label}
                    textAlign={"center"}
                    maxW={"200px"}
                  >
                    Total
                  </FormLabel>
                  <InputGroup>
                    <InputLeftAddon textAlign={"start"} w={2} children="$" />
                    <Input
                      maxW={"100px"}
                      type="number"
                      value={
                        editingValues[venta._id]?.valorTotal ??
                        venta.valorTotal ??
                        ""
                      }
                      autoComplete="off"
                      onChange={(e) => {
                        const valor = e.target.value;
                        setEditingValues((prev) => ({
                          ...prev,
                          [venta._id]: {
                            ...prev[venta._id],
                            valorTotal: valor,
                          },
                        }));
                      }}
                      onBlur={async (e) => {
                        const valor = e.target.value;
                        await updateVenta(venta._id, { valorTotal: valor });
                      }}
                    />
                  </InputGroup>
                </FormControl>
              </HStack>

              {/* Espaciador para evitar solapamiento */}
              {showSuggestions[venta._id] &&
                productsData.filter((producto) =>
                  producto.nombre
                    .toLowerCase()
                    .includes((searchProducto[venta._id] ?? "").toLowerCase())
                ).length > 0 && <Box height="200px" pointerEvents="none" />}
            </Box>
          ))
        )}
      </VStack>
    </Box>
  );
};
