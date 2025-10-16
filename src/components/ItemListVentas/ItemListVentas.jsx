import {
  Box,
  Heading,
  HStack,
  Text,
  VStack,
  useColorModeValue,
  Button,
  IconButton,
  Textarea,
  AlertDialog,
  AlertDialogOverlay,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogBody,
  AlertDialogFooter,
} from "@chakra-ui/react";
import { PiListPlusDuotone } from "react-icons/pi";
import { AiOutlineFileSearch } from "react-icons/ai";
import { FiEdit2, FiRefreshCw, FiCheck } from "react-icons/fi";
import { MdDeleteForever } from "react-icons/md";
import { FaTruck } from "react-icons/fa";
import { useEffect, useRef, useState } from "react";
import { useDeleteVenta } from "../../hooks/ventas/useDeleteVenta.js";
import { useNavigate } from "react-router-dom";
import { useGetVentasPaginated } from "../../hooks/ventas/useGetVentasPaginated.js";
import { useUpdateVentas } from "../../hooks/ventas/useUpdateVentas.js";
import { Loader } from "../Loader/Loader.jsx";

export const ItemListVentas = () => {
  const { items, total, page, totalPages, loading, error, setPage } =
    useGetVentasPaginated(1, 10);
  const [ventas, setVentas] = useState([]);
  const navigate = useNavigate();
  const { removeVenta, loading: deleting } = useDeleteVenta();
  const { updateVenta } = useUpdateVentas();
  const [deletingId, setDeletingId] = useState(null);
  const [isOpen, setIsOpen] = useState(false);
  const cancelRef = useRef();
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
  const fmtDateUTC = (d) => {
    try {
      if (!d) return "";
      return new Date(d).toLocaleDateString(undefined, { timeZone: "UTC" });
    } catch {
      return "";
    }
  };

  useEffect(() => {
    if (Array.isArray(items)) {
      setVentas(items);
    }
  }, [items]);

  const ventasOrdenadas = Array.isArray(ventas)
    ? [...ventas].sort((a, b) => {
        const ca = new Date(a.createdAt || a.fecha || 0).getTime();
        const cb = new Date(b.createdAt || b.fecha || 0).getTime();
        if (cb !== ca) return cb - ca;

        const fa = new Date(a.fecha || 0).getTime();
        const fb = new Date(b.fecha || 0).getTime();
        if (fb !== fa) return fb - fa;

        return String(b._id).localeCompare(String(a._id));
      })
    : [];

  const patchVentaLocal = (idVenta, patch) => {
    if (!patch || typeof patch !== "object") return;
    setVentas((prev) =>
      prev.map((v) => {
        if (v._id !== idVenta) return v;

        const merged = { ...v, ...patch };

        if (Object.prototype.hasOwnProperty.call(patch, "producto")) {
          if (patch.producto && typeof patch.producto === "object") {
            merged.producto = { ...(v.producto || {}), ...patch.producto };
          } else {
            merged.producto = v.producto;
          }
        }

        return merged;
      })
    );
  };

  const handleToggleEstado = async (venta, nextEstado) => {
    const prevEstado = venta.estado;

    patchVentaLocal(venta._id, { estado: nextEstado });
    try {
      const result = await updateVenta(venta._id, { estado: nextEstado });
      const serverPatch =
        result && typeof result === "object"
          ? result.venta && typeof result.venta === "object"
            ? result.venta
            : result
          : null;
      if (serverPatch) {
        patchVentaLocal(venta._id, serverPatch);
      }
    } catch (e) {
      patchVentaLocal(venta._id, { estado: prevEstado });
      console.error("Error actualizando estado de venta:", e);
    }
  };

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
                <HStack justifyContent="space-between" mb={2}>
                  <Text fontSize="sm" color={text}>
                    {venta.productoNombre || venta.producto?.nombre || ""}
                  </Text>
                  <HStack spacing={2}>
                    {venta.estado === "finalizada" && (
                      <Text
                        fontSize="xs"
                        color="green.700"
                        bg="green.100"
                        px={2}
                        py={0.5}
                        borderRadius="md"
                      >
                        Finalizada
                      </Text>
                    )}
                    {venta.estado === "en_proceso" && (
                      <Text
                        fontSize="xs"
                        color="orange.800"
                        bg="orange.100"
                        px={2}
                        py={0.5}
                        borderRadius="md"
                      >
                        En proceso
                      </Text>
                    )}
                    {venta.estado === "despachada" && (
                      <Text
                        fontSize="xs"
                        color="blue.700"
                        bg="blue.100"
                        px={2}
                        py={0.5}
                        borderRadius="md"
                      >
                        Despachada
                      </Text>
                    )}
                  </HStack>
                </HStack>

                <HStack
                  spacing={2}
                  alignItems="center"
                  flexWrap="wrap"
                  mb={2}
                  justifyContent={{ base: "flex-start", md: "space-between" }}
                >
                  <Text fontWeight="bold" color={heading} minW="90px">
                    {fmtDateUTC(venta.fecha)}
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
                    <Text color={text} minW="80px" fontSize="md">
                      x{venta.cantidad}
                    </Text>
                    <Text color={text} minW="140px" fontSize="sm">
                      <b>Fecha límite:</b>{" "}
                      {venta.fechaLimite
                        ? fmtDateUTC(venta.fechaLimite)
                        : "null"}
                    </Text>
                  </HStack>
                </HStack>
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

                <HStack
                  spacing={4}
                  alignItems="center"
                  flexWrap="wrap"
                  bg={filaMonetariaBg}
                  p={1}
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
                  <HStack spacing={2} ml={4}>
                    <IconButton
                      aria-label="Editar venta"
                      icon={<FiEdit2 />}
                      colorScheme="green"
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        navigate(`/ventas/itemAdd/${venta._id}`);
                      }}
                    />

                    <IconButton
                      aria-label="Eliminar venta"
                      icon={<MdDeleteForever />}
                      colorScheme="red"
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setDeletingId(venta._id);
                        setIsOpen(true);
                      }}
                    />
                  </HStack>
                  <HStack justifyContent={"flex-end"}>
                    <IconButton
                      type="button"
                      aria-label="Marcar como en proceso"
                      icon={<FiRefreshCw />}
                      colorScheme={
                        venta.estado === "en_proceso" ? "orange" : "gray"
                      }
                      variant={
                        venta.estado === "en_proceso" ? "solid" : "ghost"
                      }
                      size="sm"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        const next =
                          venta.estado === "en_proceso"
                            ? "pendiente"
                            : "en_proceso";
                        handleToggleEstado(venta, next);
                      }}
                    />
                    <IconButton
                      aria-label="Marcar como finalizada"
                      icon={<FiCheck />}
                      colorScheme={
                        venta.estado === "finalizada" ? "green" : "gray"
                      }
                      variant={
                        venta.estado === "finalizada" ? "solid" : "ghost"
                      }
                      size="sm"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        const next =
                          venta.estado === "finalizada"
                            ? "pendiente"
                            : "finalizada";
                        handleToggleEstado(venta, next);
                      }}
                    />

                    <IconButton
                      aria-label="Marcar como despachada"
                      icon={<FaTruck />}
                      colorScheme={
                        venta.estado === "despachada" ? "green" : "gray"
                      }
                      variant={
                        venta.estado === "despachada" ? "solid" : "ghost"
                      }
                      size="sm"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        const next =
                          venta.estado === "despachada"
                            ? "pendiente"
                            : "despachada";
                        handleToggleEstado(venta, next);
                      }}
                    />
                  </HStack>
                </HStack>
              </Box>
            );
          })
        )}
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
        <AlertDialog
          isOpen={isOpen}
          leastDestructiveRef={cancelRef}
          onClose={() => {
            setIsOpen(false);
            setDeletingId(null);
          }}
          isCentered
        >
          <AlertDialogOverlay>
            <AlertDialogContent>
              <AlertDialogHeader fontSize="lg" fontWeight="bold">
                Eliminar venta
              </AlertDialogHeader>

              <AlertDialogBody>
                ¿Estás seguro de que quieres eliminar esta venta? Esta acción no
                se puede deshacer.
              </AlertDialogBody>

              <AlertDialogFooter>
                <Button ref={cancelRef} onClick={() => setIsOpen(false)}>
                  Cancelar
                </Button>
                <Button
                  colorScheme="red"
                  onClick={async () => {
                    try {
                      await removeVenta(deletingId);
                      setIsOpen(false);
                      setDeletingId(null);

                      setVentas((prev) =>
                        prev.filter((v) => v._id !== deletingId)
                      );
                    } catch (err) {
                      console.error("Error eliminando:", err);
                    }
                  }}
                  ml={3}
                  isLoading={deleting}
                >
                  Sí, eliminar
                </Button>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialogOverlay>
        </AlertDialog>
      </VStack>
    </Box>
  );
};
