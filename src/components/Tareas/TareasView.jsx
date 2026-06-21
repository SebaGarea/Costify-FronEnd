import {
  Badge,
  Box,
  Button,
  Checkbox,
  Flex,
  Heading,
  HStack,
  IconButton,
  Input,
  Select,
  SimpleGrid,
  Text,
  Textarea,
  VStack,
  useColorModeValue,
  useDisclosure,
} from "@chakra-ui/react";
import { useMemo, useState, useCallback } from "react";
import { FiEdit2, FiSave, FiTrash2, FiX, FiPlus } from "react-icons/fi";
import { Loader } from "../Loader/Loader.jsx";
import { useAddTarea } from "../../hooks/tareas/useAddTarea.js";
import { useDeleteTarea } from "../../hooks/tareas/useDeleteTarea.js";
import { useGetTareasPaginated } from "../../hooks/tareas/useGetTareasPaginated.js";
import { useUpdateTarea } from "../../hooks/tareas/useUpdateTarea.js";
import { UnifiedCalendar } from "../Calendar/UnifiedCalendar.jsx";
import { useCalendarEvents } from "../../hooks/calendar/useCalendarEvents.js";
import { DayEventsModal } from "../Home/DayEventsModal.jsx";

const TAG_OPTIONS = [
  { value: "presupuesto", label: "Presupuesto" },
  { value: "cliente", label: "Cliente" },
  { value: "otros", label: "Otros" },
];

const getPriorityBadge = (priority) => {
  if (priority === "alta") return { scheme: "red", label: "Alta" };
  if (priority === "baja") return { scheme: "gray", label: "Baja" };
  return { scheme: "orange", label: "Media" };
};

const renderAutor = (createdBy) => {
  if (!createdBy) return "Desconocido";
  if (typeof createdBy === "string") return "Usuario";
  const nombre = `${createdBy.first_name || ""} ${createdBy.last_name || ""}`.trim();
  return nombre || createdBy.email || "Usuario";
};

export const TareasView = () => {
  const bg = useColorModeValue("gray.50", "gray.900");
  const cardBg = useColorModeValue("white", "gray.800");
  const border = useColorModeValue("blackAlpha.200", "whiteAlpha.200");
  const muted = useColorModeValue("gray.600", "gray.300");
  const heading = useColorModeValue("blue.600", "blue.300");

  const {
    items,
    total,
    page,
    totalPages,
    loading,
    error,
    setPage,
    refetch,
  } = useGetTareasPaginated(1, 15);

  // Fetch separado para el calendario (más items, sin afectar la paginación de la lista)
  const { items: calendarTareas, refetch: refetchCalendarTareas } = useGetTareasPaginated(1, 500);

  const { addTarea, loading: adding } = useAddTarea();
  const { editTarea, loading: updating } = useUpdateTarea();
  const { removeTarea, loading: deleting } = useDeleteTarea();

  const [draft, setDraft] = useState({
    title: "",
    notes: "",
    priority: "media",
    dueDate: "",
    tag: "otros",
  });

  const [calendarKey, setCalendarKey] = useState(0);
  const bumpCalendar = useCallback(() => setCalendarKey((k) => k + 1), []);

  const [editingId, setEditingId] = useState(null);
  const [editDraft, setEditDraft] = useState({
    title: "",
    notes: "",
    priority: "media",
    dueDate: "",
    tags: [],
  });

  const cleanDueDate = (value) => {
    if (!value) return null;
    // el input date retorna YYYY-MM-DD, el backend acepta ISO8601
    return new Date(`${value}T12:00:00.000Z`).toISOString();
  };

  const handleAdd = async () => {
    const title = draft.title.trim();
    if (!title) return;

    if (!draft.dueDate) {
      window.alert("La tarea necesita una fecha de vencimiento (campo 'Vence') para aparecer en el calendario.");
      return;
    }

    const payload = {
      title,
      notes: (draft.notes || "").trim(),
      priority: draft.priority,
      dueDate: cleanDueDate(draft.dueDate),
      tags: draft.tag ? [draft.tag] : [],
    };

    await addTarea(payload);
    setDraft({ title: "", notes: "", priority: "media", dueDate: "", tag: "otros" });
    await Promise.all([refetch(), refetchCalendarTareas()]);
    bumpCalendar();
  };

  const startEdit = (t) => {
    setEditingId(t._id);
    setEditDraft({
      title: t.title || "",
      notes: t.notes || "",
      priority: t.priority || "media",
      dueDate: t.dueDate ? String(t.dueDate).slice(0, 10) : "",
      tags: Array.isArray(t.tags) ? t.tags : [],
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditDraft({ title: "", notes: "", priority: "media", dueDate: "", tags: [] });
  };

  const saveEdit = async (id) => {
    const title = editDraft.title.trim();
    if (!title) return;
    if (!editDraft.dueDate) {
      window.alert("La tarea necesita una fecha de vencimiento (campo 'Vence').");
      return;
    }

    await editTarea(id, {
      title,
      notes: (editDraft.notes || "").trim(),
      priority: editDraft.priority,
      dueDate: cleanDueDate(editDraft.dueDate),
      tags: editDraft.tags,
    });
    cancelEdit();
    await Promise.all([refetch(), refetchCalendarTareas()]);
    bumpCalendar();
  };

  const toggleDone = async (t) => {
    const nextStatus = t.status === "hecho" ? "pendiente" : "hecho";
    await editTarea(t._id, { status: nextStatus });
    await Promise.all([refetch(), refetchCalendarTareas()]);
    bumpCalendar();
  };

  const handleDelete = async (id) => {
    await removeTarea(id);
    await Promise.all([refetch(), refetchCalendarTareas()]);
    bumpCalendar();
  };

  const normalizedError = useMemo(() => {
    if (!error) return null;
    if (typeof error === "string") return error;
    return "Error al cargar las tareas";
  }, [error]);

  // Calendario unificado (ventas + tareas + eventos)
  // tareasDataExt: usamos el fetch propio para que al mutar tareas el calendario se actualice directo
  const { events: calendarEvents, itemsByDay, buildDayKey, refetchAll } =
    useCalendarEvents({ tareasDataExt: calendarTareas });
  const dayModal = useDisclosure();
  const [selectedDay, setSelectedDay] = useState(null);
  const selectedDayItems = useMemo(() => {
    if (!selectedDay) return [];
    return itemsByDay.get(buildDayKey(selectedDay)) || [];
  }, [selectedDay, itemsByDay, buildDayKey]);

  const handleCalendarDateClick = (date) => {
    setSelectedDay(date);
    dayModal.onOpen();
  };

  const handleCalendarEventClick = (info) => {
    const dayKey = info.event.extendedProps?.dayKey;
    if (dayKey) {
      const [y, m, d] = dayKey.split("-").map(Number);
      setSelectedDay(new Date(y, m, d));
    } else if (info.event.start) {
      setSelectedDay(new Date(info.event.start));
    }
    dayModal.onOpen();
  };

  const handleCalendarChanged = async () => {
    await Promise.all([refetch(), refetchCalendarTareas(), refetchAll()]);
    bumpCalendar();
  };

  if (loading && items.length === 0) return <Loader />;

  return (
    <Box bg={bg} minH="100vh" p={{ base: 2, md: 4 }}>
      <VStack spacing={4} align="stretch" maxW="7xl" mx="auto">
        <Flex justify="space-between" align="center" flexWrap="wrap" gap={2}>
          <Heading color={heading} size="lg">
            Tareas
          </Heading>
          <Text color={muted} fontSize="sm">
            Compartidas — Total: {total}
          </Text>
        </Flex>

        <Box maxW="900px" mx="auto" w="100%">
          <UnifiedCalendar
            key={calendarKey}
            events={calendarEvents}
            onDateClick={handleCalendarDateClick}
            onEventClick={handleCalendarEventClick}
            height={460}
          />
        </Box>

        <Box bg={cardBg} borderWidth="1px" borderColor={border} borderRadius="xl" p={{ base: 3, md: 4 }}>
          <SimpleGrid columns={{ base: 1, md: 4 }} spacing={3} alignItems="end">
            <Box>
              <Text fontSize="sm" color={muted} mb={1}>
                Tarea
              </Text>
              <Input
                size="sm"
                value={draft.title}
                onChange={(e) => setDraft((p) => ({ ...p, title: e.target.value }))}
                onKeyDown={(e) => {
                  if (e.key !== "Enter") return;
                  e.preventDefault();
                  handleAdd();
                }}
                placeholder="Ej: Hacer presupuesto / Hablar a cliente"
              />
            </Box>

            <Box>
              <Text fontSize="sm" color={muted} mb={1}>
                Prioridad
              </Text>
              <Select
                size="sm"
                value={draft.priority}
                onChange={(e) => setDraft((p) => ({ ...p, priority: e.target.value }))}
              >
                <option value="alta">Alta</option>
                <option value="media">Media</option>
                <option value="baja">Baja</option>
              </Select>
            </Box>

            <Box>
              <Text fontSize="sm" color={muted} mb={1}>
                Vence <Text as="span" color="red.400">*</Text>
              </Text>
              <Input
                size="sm"
                type="date"
                value={draft.dueDate}
                onChange={(e) => setDraft((p) => ({ ...p, dueDate: e.target.value }))}
              />
            </Box>

            <Box>
              <Text fontSize="sm" color={muted} mb={1}>
                Tag
              </Text>
              <Select
                size="sm"
                value={draft.tag}
                onChange={(e) => setDraft((p) => ({ ...p, tag: e.target.value }))}
              >
                <option value="presupuesto">Presupuesto</option>
                <option value="cliente">Cliente</option>
                <option value="otros">Otros</option>
              </Select>
            </Box>
          </SimpleGrid>

          <Box mt={3}>
            <Text fontSize="sm" color={muted} mb={1}>
              Notas (opcional)
            </Text>
            <Textarea
              size="sm"
              minH="44px"
              value={draft.notes}
              onChange={(e) => setDraft((p) => ({ ...p, notes: e.target.value }))}
              placeholder="Detalles del cliente, números, recordatorios…"
            />
          </Box>

          <Flex mt={3} justify="flex-end">
            <Button
              type="button"
              leftIcon={<FiPlus />}
              colorScheme="blue"
              onClick={handleAdd}
              isLoading={adding}
              isDisabled={!draft.title.trim() || !draft.dueDate}
            >
              Agregar
            </Button>
          </Flex>
        </Box>

        <Box bg={cardBg} borderWidth="1px" borderColor={border} borderRadius="xl" p={{ base: 3, md: 4 }}>
          <Text fontSize="sm" color={muted}>
            Página {page} de {totalPages}
          </Text>

          {normalizedError && (
            <Text mt={3} color="red.400" fontSize="sm">
              {normalizedError}
            </Text>
          )}

          <VStack mt={4} spacing={2} align="stretch">
            {items.length === 0 ? (
              <Text color={muted}>No hay tareas para mostrar.</Text>
            ) : (
              items.map((t) => {
                const isEditing = editingId === t._id;
                const pr = getPriorityBadge(t.priority);
                const tag = Array.isArray(t.tags) && t.tags.length ? t.tags[0] : null;

                return (
                  <Box key={t._id} borderWidth="1px" borderColor={border} borderRadius="xl" p={3}>
                    <Flex gap={3} align="flex-start" justify="space-between" flexWrap="wrap">
                      <HStack spacing={3} align="flex-start" flex="1 1 520px">
                        <Checkbox
                          mt={1}
                          isChecked={t.status === "hecho"}
                          onChange={() => toggleDone(t)}
                          colorScheme="green"
                          isDisabled={updating}
                        />

                        <Box flex="1">
                          {!isEditing ? (
                            <>
                              <HStack spacing={2} flexWrap="wrap">
                                <Text
                                  fontWeight="semibold"
                                  textDecoration={t.status === "hecho" ? "line-through" : "none"}
                                  color={t.status === "hecho" ? muted : "inherit"}
                                >
                                  {t.title}
                                </Text>
                                <Badge colorScheme={pr.scheme} variant="subtle">
                                  {pr.label}
                                </Badge>
                                {tag ? (
                                  <Badge colorScheme="blue" variant="outline">
                                    {tag}
                                  </Badge>
                                ) : null}
                                {t.dueDate ? (
                                  <Badge colorScheme="purple" variant="outline">
                                    Vence: {String(t.dueDate).slice(0, 10)}
                                  </Badge>
                                ) : null}
                              </HStack>
                              {t.notes ? (
                                <Text mt={1} fontSize="sm" color={muted} whiteSpace="pre-wrap">
                                  {t.notes}
                                </Text>
                              ) : null}
                              <Text mt={1} fontSize="xs" color={muted}>
                                Creado por: <strong>{renderAutor(t?.createdBy)}</strong>
                              </Text>
                            </>
                          ) : (
                            <VStack align="stretch" spacing={2}>
                              <Input
                                size="sm"
                                value={editDraft.title}
                                onChange={(e) => setEditDraft((p) => ({ ...p, title: e.target.value }))}
                                onKeyDown={(e) => {
                                  if (e.key !== "Enter") return;
                                  e.preventDefault();
                                  saveEdit(t._id);
                                }}
                              />
                              <HStack spacing={2} flexWrap="wrap">
                                <Select
                                  size="sm"
                                  maxW="180px"
                                  value={editDraft.priority}
                                  onChange={(e) => setEditDraft((p) => ({ ...p, priority: e.target.value }))}
                                >
                                  <option value="alta">Alta</option>
                                  <option value="media">Media</option>
                                  <option value="baja">Baja</option>
                                </Select>
                                <Select
                                  size="sm"
                                  maxW="180px"
                                  value={editDraft.tags?.[0] ?? ""}
                                  onChange={(e) =>
                                    setEditDraft((p) => ({
                                      ...p,
                                      tags: e.target.value ? [e.target.value] : [],
                                    }))
                                  }
                                >
                                  {TAG_OPTIONS.filter((o) => o.value !== "").map((o) => (
                                    <option key={o.value} value={o.value}>
                                      {o.label}
                                    </option>
                                  ))}
                                </Select>
                                <Input
                                  size="sm"
                                  type="date"
                                  maxW="200px"
                                  value={editDraft.dueDate}
                                  onChange={(e) => setEditDraft((p) => ({ ...p, dueDate: e.target.value }))}
                                />
                              </HStack>
                              <Textarea
                                size="sm"
                                minH="44px"
                                value={editDraft.notes}
                                onChange={(e) => setEditDraft((p) => ({ ...p, notes: e.target.value }))}
                                placeholder="Notas"
                              />
                            </VStack>
                          )}
                        </Box>
                      </HStack>

                      <HStack spacing={2} align="center">
                        {!isEditing ? (
                          <>
                            <IconButton
                              aria-label="Editar"
                              icon={<FiEdit2 />}
                              size="sm"
                              variant="ghost"
                              type="button"
                              onClick={() => startEdit(t)}
                            />
                            <IconButton
                              aria-label="Eliminar"
                              icon={<FiTrash2 />}
                              size="sm"
                              colorScheme="red"
                              variant="ghost"
                              isLoading={deleting}
                              type="button"
                              onClick={() => handleDelete(t._id)}
                            />
                          </>
                        ) : (
                          <>
                            <IconButton
                              aria-label="Guardar"
                              icon={<FiSave />}
                              size="sm"
                              colorScheme="green"
                              variant="solid"
                              isLoading={updating}
                              type="button"
                              onClick={() => saveEdit(t._id)}
                            />
                            <IconButton
                              aria-label="Cancelar"
                              icon={<FiX />}
                              size="sm"
                              variant="ghost"
                              type="button"
                              onClick={cancelEdit}
                            />
                          </>
                        )}
                      </HStack>
                    </Flex>
                  </Box>
                );
              })
            )}
          </VStack>

          <Flex mt={4} justify="space-between" align="center" flexWrap="wrap" gap={2}>
            <Text fontSize="sm" color={muted}>
              Mostrando {items.length} de {total}
            </Text>
            <HStack>
              <Button onClick={() => setPage(Math.max(1, page - 1))} isDisabled={page <= 1}>
                Anterior
              </Button>
              <Button
                type="button"
                onClick={() => setPage(Math.min(totalPages, page + 1))}
                isDisabled={page >= totalPages}
              >
                Siguiente
              </Button>
            </HStack>
          </Flex>
        </Box>
      </VStack>

      <DayEventsModal
        isOpen={dayModal.isOpen}
        onClose={dayModal.onClose}
        date={selectedDay}
        items={selectedDayItems}
        onChanged={handleCalendarChanged}
      />
    </Box>
  );
};
