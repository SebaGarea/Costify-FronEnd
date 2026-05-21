import { useEffect, useMemo, useState } from "react";
import {
  Badge,
  Box,
  Button,
  Divider,
  Flex,
  FormControl,
  FormLabel,
  HStack,
  Heading,
  Icon,
  IconButton,
  Input,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Stack,
  Text,
  Textarea,
  useColorModeValue,
  useToast,
} from "@chakra-ui/react";
import { FaPlus, FaTruck, FaClipboardList, FaCalendarAlt } from "react-icons/fa";
import { MdDeleteForever, MdModeEdit } from "react-icons/md";
import { Link as RouterLink } from "react-router-dom";
import { useAuth } from "../../hooks/auth/useAuth.jsx";
import { useAddEvento } from "../../hooks/eventosCalendario/useAddEvento.js";
import { useUpdateEvento } from "../../hooks/eventosCalendario/useUpdateEvento.js";
import { useDeleteEvento } from "../../hooks/eventosCalendario/useDeleteEvento.js";

const toDateInputValue = (date) => {
  if (!date) return "";
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return "";
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
};

const formatFechaLarga = (date) => {
  if (!date) return "";
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return "";
  const label = d.toLocaleDateString("es-AR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  return label.charAt(0).toUpperCase() + label.slice(1);
};

const initialFormState = (date) => ({
  title: "",
  description: "",
  fecha: toDateInputValue(date) || toDateInputValue(new Date()),
  hora: "",
});

export const DayEventsModal = ({
  isOpen,
  onClose,
  date,
  items = [],
  onChanged,
}) => {
  const { user } = useAuth();
  const toast = useToast();
  const { addEvento, loading: adding } = useAddEvento();
  const { editEvento, loading: editing } = useUpdateEvento();
  const { removeEvento, loading: removing } = useDeleteEvento();

  const [form, setForm] = useState(() => initialFormState(date));
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    if (isOpen) {
      setForm(initialFormState(date));
      setEditingId(null);
    }
  }, [isOpen, date]);

  const ventaItems = useMemo(() => items.filter((i) => i.type === "venta"), [items]);
  const tareaItems = useMemo(() => items.filter((i) => i.type === "tarea"), [items]);
  const eventoItems = useMemo(() => items.filter((i) => i.type === "evento"), [items]);

  const sectionTitleColor = useColorModeValue("teal.600", "teal.200");
  const itemBg = useColorModeValue("gray.50", "gray.700");
  const itemBorder = useColorModeValue("gray.200", "gray.600");
  const mutedText = useColorModeValue("gray.600", "gray.400");
  const ventaAccent = useColorModeValue("red.500", "red.300");
  const tareaAccent = useColorModeValue("orange.500", "orange.300");
  const eventoAccent = useColorModeValue("teal.500", "teal.300");

  const canModify = (evento) => {
    if (!user || !evento?.raw) return false;
    if (user.role === "admin") return true;
    const creadorId = evento.raw.createdBy?._id ?? evento.raw.createdBy;
    if (!creadorId) return false;
    return creadorId.toString() === user._id?.toString();
  };

  const handleChange = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const startEdit = (evento) => {
    const raw = evento.raw || {};
    // Usar el _id real de mongo (no el id prefijado con "evento-")
    setEditingId(raw._id || null);
    setForm({
      title: raw.title || "",
      description: raw.description || "",
      fecha: toDateInputValue(raw.fecha),
      hora: raw.hora || "",
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setForm(initialFormState(date));
  };

  const handleSubmit = async () => {
    if (!form.title.trim()) {
      toast({
        title: "Falta el título",
        status: "warning",
        duration: 2500,
        isClosable: true,
      });
      return;
    }
    if (!form.fecha) {
      toast({
        title: "Falta la fecha",
        status: "warning",
        duration: 2500,
        isClosable: true,
      });
      return;
    }

    const payload = {
      title: form.title.trim(),
      description: form.description.trim(),
      fecha: form.fecha,
      hora: form.hora || "",
    };

    try {
      if (editingId) {
        await editEvento(editingId, payload);
        toast({
          title: "Evento actualizado",
          status: "success",
          duration: 2000,
          isClosable: true,
        });
      } else {
        await addEvento(payload);
        toast({
          title: "Evento agregado",
          status: "success",
          duration: 2000,
          isClosable: true,
        });
      }
      setForm(initialFormState(date));
      setEditingId(null);
      // Cerrar el modal primero para evitar overlay con DOM inconsistente
      // tras el refetch (el modal queda en estado limbo y se ve "pantalla negra").
      onClose?.();
      // Diferir el refetch al siguiente tick para que el unmount del modal
      // ocurra antes que el re-render por nuevos datos.
      setTimeout(() => {
        onChanged?.();
      }, 0);
    } catch (err) {
      toast({
        title: editingId ? "No se pudo actualizar" : "No se pudo crear",
        description: err.response?.data?.error || err.message || "Error inesperado",
        status: "error",
        duration: 3500,
        isClosable: true,
      });
    }
  };

  const handleDelete = async (evento) => {
    const realId = evento?.raw?._id;
    if (!realId) return;
    if (!window.confirm("¿Eliminar este evento?")) return;
    try {
      await removeEvento(realId);
      toast({
        title: "Evento eliminado",
        status: "success",
        duration: 2000,
        isClosable: true,
      });
      if (editingId === realId) cancelEdit();
      // Diferir el refetch para evitar re-render del modal con DOM inconsistente
      setTimeout(() => {
        onChanged?.();
      }, 0);
    } catch (err) {
      toast({
        title: "No se pudo eliminar",
        description: err.response?.data?.error || err.message || "Error inesperado",
        status: "error",
        duration: 3500,
        isClosable: true,
      });
    }
  };

  const renderAutor = (createdBy) => {
    if (!createdBy) return "Desconocido";
    if (typeof createdBy === "string") return "Usuario";
    const nombre = `${createdBy.first_name || ""} ${createdBy.last_name || ""}`.trim();
    return nombre || createdBy.email || "Usuario";
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="2xl" scrollBehavior="inside">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>
          <HStack spacing={3}>
            <Icon as={FaCalendarAlt} color={sectionTitleColor} />
            <Box>
              <Heading size="md">Día del calendario</Heading>
              <Text fontSize="sm" color={mutedText}>
                {formatFechaLarga(date)}
              </Text>
            </Box>
          </HStack>
        </ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <Stack spacing={5}>
            {ventaItems.length > 0 && (
              <Box>
                <HStack mb={2}>
                  <Icon as={FaTruck} color={ventaAccent} />
                  <Heading size="sm" color={ventaAccent}>
                    Entregas de ventas ({ventaItems.length})
                  </Heading>
                </HStack>
                <Stack spacing={2}>
                  {ventaItems.map((it) => (
                    <Flex
                      key={it.id}
                      p={3}
                      borderRadius="md"
                      borderWidth="1px"
                      borderColor={itemBorder}
                      bg={itemBg}
                      justify="space-between"
                      align="center"
                      gap={2}
                    >
                      <Box minW={0}>
                        <Text fontWeight="semibold" noOfLines={1}>
                          {it.title}
                        </Text>
                        {it.subtitle && (
                          <Text fontSize="sm" color={mutedText} noOfLines={1}>
                            {it.subtitle}
                          </Text>
                        )}
                        {it.raw?.estado && (
                          <Badge mt={1} colorScheme="red" variant="subtle">
                            {it.raw.estado}
                          </Badge>
                        )}
                        <Text fontSize="xs" color={mutedText} mt={2}>
                          Creado por: <strong>{renderAutor(it.raw?.createdBy)}</strong>
                        </Text>
                      </Box>
                      {it.raw?._id && (
                        <Button
                          as={RouterLink}
                          to={`/ventas`}
                          size="sm"
                          variant="outline"
                          colorScheme="red"
                          onClick={onClose}
                        >
                          Ver
                        </Button>
                      )}
                    </Flex>
                  ))}
                </Stack>
              </Box>
            )}

            {tareaItems.length > 0 && (
              <Box>
                <HStack mb={2}>
                  <Icon as={FaClipboardList} color={tareaAccent} />
                  <Heading size="sm" color={tareaAccent}>
                    Tareas pendientes ({tareaItems.length})
                  </Heading>
                </HStack>
                <Stack spacing={2}>
                  {tareaItems.map((it) => (
                    <Flex
                      key={it.id}
                      p={3}
                      borderRadius="md"
                      borderWidth="1px"
                      borderColor={itemBorder}
                      bg={itemBg}
                      justify="space-between"
                      align="center"
                      gap={2}
                    >
                      <Box minW={0}>
                        <Text fontWeight="semibold" noOfLines={1}>
                          {it.title}
                        </Text>
                        {it.subtitle && (
                          <Text fontSize="sm" color={mutedText} noOfLines={2}>
                            {it.subtitle}
                          </Text>
                        )}
                        {it.raw?.priority && (
                          <Badge mt={1} colorScheme="orange" variant="subtle">
                            Prioridad {it.raw.priority}
                          </Badge>
                        )}
                        <Text fontSize="xs" color={mutedText} mt={2}>
                          Creado por: <strong>{renderAutor(it.raw?.createdBy)}</strong>
                        </Text>
                      </Box>
                      <Button
                        as={RouterLink}
                        to="/tareas"
                        size="sm"
                        variant="outline"
                        colorScheme="orange"
                        onClick={onClose}
                      >
                        Ver
                      </Button>
                    </Flex>
                  ))}
                </Stack>
              </Box>
            )}

            {eventoItems.length > 0 && (
              <Box>
                <HStack mb={2}>
                  <Icon as={FaCalendarAlt} color={eventoAccent} />
                  <Heading size="sm" color={eventoAccent}>
                    Eventos ({eventoItems.length})
                  </Heading>
                </HStack>
                <Stack spacing={2}>
                  {eventoItems.map((it) => (
                    <Flex
                      key={it.id}
                      p={3}
                      borderRadius="md"
                      borderWidth="1px"
                      borderColor={itemBorder}
                      bg={itemBg}
                      justify="space-between"
                      align="flex-start"
                      gap={2}
                    >
                      <Box minW={0} flex="1">
                        <HStack spacing={2}>
                          <Text fontWeight="semibold">{it.title}</Text>
                          {it.raw?.hora && (
                            <Badge colorScheme="teal" variant="subtle">
                              {it.raw.hora}
                            </Badge>
                          )}
                        </HStack>
                        {it.raw?.description && (
                          <Text fontSize="sm" color={mutedText} mt={1}>
                            {it.raw.description}
                          </Text>
                        )}
                        <Text fontSize="xs" color={mutedText} mt={2}>
                          Creado por: <strong>{renderAutor(it.raw?.createdBy)}</strong>
                        </Text>
                      </Box>
                      {canModify(it) && (
                        <HStack spacing={1}>
                          <IconButton
                            aria-label="Editar evento"
                            icon={<MdModeEdit />}
                            size="sm"
                            variant="ghost"
                            colorScheme="teal"
                            onClick={() => startEdit(it)}
                          />
                          <IconButton
                            aria-label="Eliminar evento"
                            icon={<MdDeleteForever />}
                            size="sm"
                            variant="ghost"
                            colorScheme="red"
                            onClick={() => handleDelete(it)}
                            isLoading={removing}
                          />
                        </HStack>
                      )}
                    </Flex>
                  ))}
                </Stack>
              </Box>
            )}

            {items.length === 0 && (
              <Box
                p={4}
                borderRadius="md"
                borderWidth="1px"
                borderColor={itemBorder}
                bg={itemBg}
                textAlign="center"
              >
                <Text color={mutedText}>
                  No hay actividad registrada en este día. Agregá un evento debajo.
                </Text>
              </Box>
            )}

            <Divider />

            <Box>
              <HStack justify="space-between" mb={3}>
                <Heading size="sm">
                  {editingId ? "Editando evento" : "Nuevo evento"}
                </Heading>
                {editingId && (
                  <Button size="xs" variant="ghost" onClick={cancelEdit}>
                    Cancelar edición
                  </Button>
                )}
              </HStack>
              <Stack spacing={3}>
                <FormControl isRequired>
                  <FormLabel fontSize="sm">Título</FormLabel>
                  <Input
                    value={form.title}
                    onChange={handleChange("title")}
                    placeholder="Visita cliente, reunión, recordatorio..."
                  />
                </FormControl>
                <FormControl>
                  <FormLabel fontSize="sm">Descripción</FormLabel>
                  <Textarea
                    value={form.description}
                    onChange={handleChange("description")}
                    placeholder="Notas opcionales"
                    rows={2}
                  />
                </FormControl>
                <HStack spacing={3}>
                  <FormControl isRequired>
                    <FormLabel fontSize="sm">Fecha</FormLabel>
                    <Input
                      type="date"
                      value={form.fecha}
                      onChange={handleChange("fecha")}
                    />
                  </FormControl>
                  <FormControl>
                    <FormLabel fontSize="sm">Hora (opcional)</FormLabel>
                    <Input
                      type="time"
                      value={form.hora}
                      onChange={handleChange("hora")}
                    />
                  </FormControl>
                </HStack>
              </Stack>
            </Box>
          </Stack>
        </ModalBody>
        <ModalFooter>
          <Button variant="ghost" mr={3} onClick={onClose}>
            Cerrar
          </Button>
          <Button
            leftIcon={<FaPlus />}
            colorScheme="teal"
            onClick={handleSubmit}
            isLoading={adding || editing}
          >
            {editingId ? "Guardar cambios" : "Agregar evento"}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default DayEventsModal;
