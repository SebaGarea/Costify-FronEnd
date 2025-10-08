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
  Wrap,
  WrapItem,
} from "@chakra-ui/react";
import { AiOutlineFileSearch } from "react-icons/ai";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { useGetAllVentas } from "../../hooks/ventas/useGetAllVentas.js";
import { Loader } from "../Loader/Loader.jsx";
import {
  useItems,
  useUpdateVentas,
} from "../../hooks/index.js";

const mediosVenta = [
  { value: "mercado_libre", label: "Mercado Libre" },
  { value: "instagram", label: "Instagram" },
  { value: "nube", label: "Nube" },
  { value: "whatsapp", label: "WhatsApp" },
  { value: "otro", label: "Otro" },
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
  // const card = useColorModeValue("white", "gray.800");
  const border = useColorModeValue("gray.200", "gray.600");
  const input = useColorModeValue("gray.50", "gray.700");
  const label = useColorModeValue("gray.600", "gray.300");
  const focus = useColorModeValue("blue.500", "blue.300");
  const hoverBg = useColorModeValue("gray.100", "gray.700");

  if (loading) return <Loader />;
  if (error) return <Text color={errorColor}>Error: {error}</Text>;

  return (
    <Box p={6} bg={bg} minH="100vh">
      <HStack mb={6} justifyContent="space-between">
        <Heading mb={6} color={heading}>
          📊 Gestión de Ventas
        </Heading>
      </HStack>
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
              <Wrap spacing={2} align="center" width="100%">
                {/* Fecha */}
                <WrapItem flex="1 1 120px" minW="120px" maxW="180px">
                  <FormControl width="100%">
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
                </WrapItem>
                {/* Cliente */}
                <WrapItem flex="1 1 120px" minW="120px" maxW="180px">
                  <FormControl width="100%">
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
                      w="100%"
                      minW="100px"
                      borderColor={border}
                      _focus={{
                        borderColor: focus,
                        boxShadow: `0 0 0 1px ${focus}`,
                      }}
                    />
                  </FormControl>
                </WrapItem>
                {/* Medio de Venta */}
                <WrapItem flex="1 1 120px" minW="120px" maxW="180px">
                  <FormControl width="100%">
                    <FormLabel fontSize="sm" mb={1} color={label}>
                      Medio de Venta
                    </FormLabel>
                    <Select
                      textAlign="center"
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
                </WrapItem>
                {/* Producto */}
                <WrapItem flex="2 1 220px" minW="180px" maxW="320px">
                  <FormControl width="100%" position="relative">
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
                          flex="1"
                          w="100%"
                          minW="140px"
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
                                  `${p.nombre ?? ""} ${
                                    p.modelo ?? ""
                                  }`.trim() === texto.trim()
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
                                  (
                                    searchProducto[venta._id] ?? ""
                                  ).toLowerCase()
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
                </WrapItem>
                {/* Cantidad */}
                <WrapItem flex="1 1 80px" minW="80px" maxW="120px">
                  <FormControl width="100%">
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
                        editingValues[venta._id]?.cantidad ??
                        venta.cantidad ??
                        ""
                      }
                      bg={input}
                      color={text}
                      borderColor={border}
                      fontSize="sm"
                      w="100%"
                      minW="60px"
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
                </WrapItem>
                {/* Descripcion */}
                <WrapItem flex="2 1 180px" minW="120px" maxW="250px">
                  <FormControl width="100%">
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
                        await updateVenta(venta._id, {
                          descripcionVenta: texto,
                        });
                      }}
                      resize={"vertical"}
                      w="100%"
                      minW="120px"
                      minH={"40px"}
                    />
                  </FormControl>
                </WrapItem>
                {/* Valor Envio */}
                <WrapItem flex="1 1 100px" minW="80px" maxW="120px">
                  <FormControl width="100%">
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
                      <InputLeftAddon textAlign="start" w={8} children="$" />
                      <Input
                        type="number"
                        w="100%"
                        minW="60px"
                        value={
                          editingValues[venta._id]?.valorEnvio ??
                          venta.valorEnvio ??
                          ""
                        }
                        autoComplete="off"
                        onChange={(e) => {
                          const valorEnvio = Number(e.target.value || 0);
                          setEditingValues((prev) => {
                            const valorTotalActual = Number(
                              prev[venta._id]?.valorTotal ??
                                venta.valorTotal ??
                                0
                            );
                            const señaActual = Number(
                              prev[venta._id]?.seña ?? venta.seña ?? 0
                            );
                            return {
                              ...prev,
                              [venta._id]: {
                                ...prev[venta._id],
                                valorEnvio: e.target.value,
                                restan: (
                                  valorTotalActual +
                                  valorEnvio -
                                  señaActual
                                ).toFixed(2),
                              },
                            };
                          });
                        }}
                        onBlur={async (e) => {
                          const valorEnvio = Number(e.target.value || 0);
                          const valorTotalActual = Number(
                            editingValues[venta._id]?.valorTotal ??
                              venta.valorTotal ??
                              0
                          );
                          const señaActual = Number(
                            editingValues[venta._id]?.seña ?? venta.seña ?? 0
                          );
                          await updateVenta(venta._id, {
                            valorEnvio,
                            restan: valorTotalActual + valorEnvio - señaActual,
                          });
                        }}
                      />
                    </InputGroup>
                  </FormControl>
                </WrapItem>
                {/* Valor Seña */}
                <WrapItem flex="1 1 100px" minW="80px" maxW="120px">
                  <FormControl width="100%">
                    <FormLabel
                      fontSize="sm"
                      mb={1}
                      color={label}
                      textAlign={"center"}
                      maxW={"200px"}
                    >
                      Seña
                    </FormLabel>
                    <InputGroup>
                      <InputLeftAddon textAlign="start" w={8} children="$" />
                      <Input
                        type="number"
                        w="100%"
                        minW="60px"
                        value={
                          editingValues[venta._id]?.seña ?? venta.seña ?? ""
                        }
                        autoComplete="off"
                        onChange={(e) => {
                          const seña = Number(e.target.value || 0);
                          setEditingValues((prev) => {
                            const valorTotalActual = Number(
                              prev[venta._id]?.valorTotal ??
                                venta.valorTotal ??
                                0
                            );
                            const valorEnvioActual = Number(
                              prev[venta._id]?.valorEnvio ??
                                venta.valorEnvio ??
                                0
                            );
                            return {
                              ...prev,
                              [venta._id]: {
                                ...prev[venta._id],
                                seña: e.target.value,
                                restan: (
                                  valorTotalActual +
                                  valorEnvioActual -
                                  seña
                                ).toFixed(2),
                              },
                            };
                          });
                        }}
                        onBlur={async (e) => {
                          const seña = Number(e.target.value || 0);
                          const valorTotalActual = Number(
                            editingValues[venta._id]?.valorTotal ??
                              venta.valorTotal ??
                              0
                          );
                          const valorEnvioActual = Number(
                            editingValues[venta._id]?.valorEnvio ??
                              venta.valorEnvio ??
                              0
                          );
                          await updateVenta(venta._id, {
                            seña,
                            restan: valorTotalActual + valorEnvioActual - seña,
                          });
                        }}
                      />
                    </InputGroup>
                  </FormControl>
                </WrapItem>
                {/* Valor Total */}
                <WrapItem flex="1 1 100px" minW="80px" maxW="120px">
                  <FormControl width="100%">
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
                      <InputLeftAddon textAlign="start" w={8} children="$" />
                      <Input
                        type="number"
                        w="100%"
                        minW="60px"
                        value={
                          editingValues[venta._id]?.valorTotal ??
                          venta.valorTotal ??
                          ""
                        }
                        autoComplete="off"
                        onChange={(e) => {
                          const valorTotal = Number(e.target.value || 0);
                          setEditingValues((prev) => {
                            const señaActual = Number(
                              prev[venta._id]?.seña ?? venta.seña ?? 0
                            );
                            const valorEnvioActual = Number(
                              prev[venta._id]?.valorEnvio ??
                                venta.valorEnvio ??
                                0
                            );
                            return {
                              ...prev,
                              [venta._id]: {
                                ...prev[venta._id],
                                valorTotal: e.target.value,
                                restan: (
                                  valorTotal +
                                  valorEnvioActual -
                                  señaActual
                                ).toFixed(2),
                              },
                            };
                          });
                        }}
                        onBlur={async (e) => {
                          const valorTotal = Number(e.target.value || 0);
                          const señaActual = Number(
                            editingValues[venta._id]?.seña ?? venta.seña ?? 0
                          );
                          const valorEnvioActual = Number(
                            editingValues[venta._id]?.valorEnvio ??
                              venta.valorEnvio ??
                              0
                          );
                          await updateVenta(venta._id, {
                            valorTotal,
                            restan: valorTotal + valorEnvioActual - señaActual,
                          });
                        }}
                      />
                    </InputGroup>
                  </FormControl>
                </WrapItem>
                {/* Valor Restan */}
                <WrapItem flex="1 1 100px" minW="80px" maxW="120px">
                  <FormControl width="100%">
                    <FormLabel
                      fontSize="sm"
                      mb={1}
                      color={label}
                      textAlign={"center"}
                      maxW={"200px"}
                    >
                      Restan
                    </FormLabel>
                    <InputGroup>
                      <InputLeftAddon textAlign="start" w={8} children="$" />
                      <Input
                        isReadOnly
                        type="number"
                        w="100%"
                        minW="60px"
                        value={
                          editingValues[venta._id]?.restan ?? venta.restan ?? ""
                        }
                        autoComplete="off"
                      />
                    </InputGroup>
                  </FormControl>
                </WrapItem>
              </Wrap>

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
