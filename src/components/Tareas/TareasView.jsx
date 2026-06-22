import {
  AlertDialog,
  AlertDialogBody,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogOverlay,
  Badge,
  Box,
  Button,
  ButtonGroup,
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
  Wrap,
  WrapItem,
  useColorModeValue,
  useDisclosure,
  useToast,
} from "@chakra-ui/react";
import { useMemo, useState, useCallback, useEffect, useRef } from "react";
import {
  FiEdit2,
  FiSave,
  FiTrash2,
  FiX,
  FiPlus,
  FiCalendar,
  FiChevronDown,
  FiChevronUp,
} from "react-icons/fi";
import { Loader } from "../Loader/Loader.jsx";
import { useAddTarea } from "../../hooks/tareas/useAddTarea.js";
import { useDeleteTarea } from "../../hooks/tareas/useDeleteTarea.js";
import { useGetTareasPaginated } from "../../hooks/tareas/useGetTareasPaginated.js";
import { useUpdateTarea } from "../../hooks/tareas/useUpdateTarea.js";
import { UnifiedCalendar } from "../Calendar/UnifiedCalendar.jsx";
import { useCalendarEvents } from "../../hooks/calendar/useCalendarEvents.js";
import { DayEventsModal } from "../Home/DayEventsModal.jsx";

const PAGE_SIZE = 15;

const TAG_OPTIONS = [
  { value: "presupuesto", label: "Presupuesto" },
  { value: "cliente", label: "Cliente" },
  { value: "otros", label: "Otros" },
];

const PRIORITY_RANK = { alta: 0, media: 1, baja: 2 };

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
  const border = useColorModeValue("gray.200", "gray.700");
  const muted = useColorModeValue("gray.600", "gray.300");
  const heading = useColorModeValue("teal.600", "teal.300");
  const overdueBg = useColorModeValue("red.50", "rgba(229,62,62,0.14)");
  const overdueBorder = useColorModeValue("red.300", "red.500");
  const toast = useToast();

  // Un solo fetch (hasta 500) alimenta lista y calendario.
  const {
    items: tareasRaw = [],
    loading,
    error,
    refetch: refetchTareas,
  } = useGetTareasPaginated(1, 500);

  const { addTarea, loading: adding } = useAddTarea();
  const { editTarea, loading: updating } = useUpdateTarea();
  const { removeTarea, loading: deleting } = useDeleteTarea();

  const allTareas = useMemo(
    () => (Array.isArray(tareasRaw) ? tareasRaw.filter(Boolean) : []),
    [tareasRaw]
  );

  const [draft, setDraft] = useState({
    title: "",
    notes: "",
    priority: "media",
    dueDate: "",
    tag: "otros",
  });

  // Filtros y orden de la lista
  const [statusFilter, setStatusFilter] = useState("pendiente"); // pendiente | hecho | todas
  const [priorityFilter, setPriorityFilter] = useState("todas");
  const [tagFilter, setTagFilter] = useState("todas");
  const [sortBy, setSortBy] = useState("vencimiento"); // vencimiento | prioridad | recientes
  const [query, setQuery] = useState("");
  const [listPage, setListPage] = useState(1);

  const [showCalendar, setShowCalendar] = useState(true);

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

  // Confirmacion de borrado
  const deleteDialog = useDisclosure();
  const [pendingDelete, setPendingDelete] = useState(null);
  const cancelRef = useRef();

  const todayStart = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d.getTime();
  }, []);

  const cleanDueDate = (value) => {
    if (!value) return null;
    return new Date(`${value}T12:00:00.000Z`).toISOString();
  };

  const counts = useMemo(() => {
    let done = 0;
    let pend = 0;
    let overdue = 0;
    allTareas.forEach((t) => {
      const isDone = t.status === "hecho";
      if (isDone) done += 1;
      else pend += 1;
      if (!isDone && t.dueDate && new Date(t.dueDate).getTime() < todayStart) {
        overdue += 1;
      }
    });
    return { done, pend, overdue, total: allTareas.length };
  }, [allTareas, todayStart]);

  const filteredTareas = useMemo(() => {
    let list = allTareas;

    if (statusFilter !== "todas") {
      list = list.filter((t) =>
        statusFilter === "hecho" ? t.status === "hecho" : t.status !== "hecho"
      );
    }
    if (priorityFilter !== "todas") {
      list = list.filter((t) => (t.priority || "media") === priorityFilter);
    }
    if (tagFilter !== "todas") {
      list = list.filter((t) => Array.isArray(t.tags) && t.tags.includes(tagFilter));
    }
    const q = query.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (t) =>
          (t.title || "").toLowerCase().includes(q) ||
          (t.notes || "").toLowerCase().includes(q)
      );
    }

    const byDue = (a, b) => {
      const ad = a.dueDate ? new Date(a.dueDate).getTime() : Number.POSITIVE_INFINITY;
      const bd = b.dueDate ? new Date(b.dueDate).getTime() : Number.POSITIVE_INFINITY;
      return ad - bd;
    };

    const sorted = [...list];
    if (sortBy === "vencimiento") {
      sorted.sort(byDue);
    } else if (sortBy === "prioridad") {
      sorted.sort(
        (a, b) =>
          (PRIORITY_RANK[a.priority] ?? 1) - (PRIORITY_RANK[b.priority] ?? 1) ||
          byDue(a, b)
      );
    } else {
      sorted.sort(
        (a, b) =>
          new Date(b.createdAt || b.updatedAt || 0).getTime() -
          new Date(a.createdAt || a.updatedAt || 0).getTime()
      );
    }
    return sorted;
  }, [allTareas, statusFilter, priorityFilter, tagFilter, query, sortBy]);

  const totalPages = Math.max(1, Math.ceil(filteredTareas.length / PAGE_SIZE));
  const safePage = Math.min(listPage, totalPages);
  const pageItems = useMemo(
    () => filteredTareas.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE),
    [filteredTareas, safePage]
  );

  // Resetear a la pagina 1 cuando cambian filtros/orden/busqueda
  useEffect(() => {
    setListPage(1);
  }, [statusFilter, priorityFilter, tagFilter, query, sortBy]);

  const hasActiveFilters =
    statusFilter !== "pendiente" ||
    priorityFilter !== "todas" ||
    tagFilter !== "todas" ||
    query.trim() !== "";

  const clearFilters = () => {
    setStatusFilter("pendiente");
    setPriorityFilter("todas");
    setTagFilter("todas");
    setQuery("");
  };

  const handleAdd = async () => {
    const title = draft.title.trim();
    if (!title) {
      toast({ status: "warning", title: "Escribí un título para la tarea", duration: 2500, isClosable: true });
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
    await refetchTareas();
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
    if (!title) {
      toast({ status: "warning", title: "El título no puede quedar vacío", duration: 2500, isClosable: true });
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
    await refetchTareas();
    bumpCalendar();
  };

  const toggleDone = async (t) => {
    const nextStatus = t.status === "hecho" ? "pendiente" : "hecho";
    await editTarea(t._id, { status: nextStatus });
    await refetchTareas();
    bumpCalendar();
  };

  const askDelete = (t) => {
    setPendingDelete(t);
    deleteDialog.onOpen();
  };

  const confirmDelete = async () => {
    if (!pendingDelete?._id) return;
    await removeTarea(pendingDelete._id);
    setPendingDelete(null);
    deleteDialog.onClose();
    await refetchTareas();
    bumpCalendar();
  };

  const normalizedError = useMemo(() => {
    if (!error) return null;
    if (typeof error === "string") return error;
    return "Error al cargar las tareas";
  }, [error]);

  // Calendario unificado (ventas + tareas + eventos)
  const { events: calendarEvents, itemsByDay, buildDayKey, refetchAll } =
    useCalendarEvents({ tareasDataExt: allTareas });
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
    await Promise.all([refetchTareas(), refetchAll()]);
    bumpCalendar();
  };

  if (loading && allTareas.length === 0) return <Loader />;

  return (
    <Box bg={bg} minH="100vh" p={{ base: 2, md: 4 }}>
      <VStack spacing={4} align="stretch" maxW="7xl" mx="auto">
        <Flex justify="space-between" align="center" flexWrap="wrap" gap={2}>
          <Heading color={heading} size="lg">
            Tareas
          </Heading>
          <HStack spacing={3} color={muted} fontSize="sm" flexWrap="wrap">
            <Text>{counts.pend} pendientes</Text>
            <Text>·</Text>
            <Text>{counts.done} hechas</Text>
            {counts.overdue > 0 && (
              <Badge colorScheme="red" variant="subtle">
                {counts.overdue} vencida{counts.overdue > 1 ? "s" : ""}
              </Badge>
            )}
          </HStack>
        </Flex>

        {/* Calendario colapsable: la lista es el foco principal */}
        <Box bg={cardBg} borderWidth="1px" borderColor={border} borderRadius="xl" p={{ base: 3, md: 4 }}>
          <Flex justify="space-between" align="center">
            <HStack spacing={2}>
              <FiCalendar />
              <Heading size="sm" fontFamily="heading">Calendario</Heading>
            </HStack>
            <Button
              size="sm"
              variant="ghost"
              colorScheme="teal"
              onClick={() => setShowCalendar((v) => !v)}
              rightIcon={showCalendar ? <FiChevronUp /> : <FiChevronDown />}
            >
              {showCalendar ? "Ocultar" : "Mostrar"}
            </Button>
          </Flex>
          {showCalendar && (
            <Box mt={3} maxW="900px" mx="auto" w="100%">
              <UnifiedCalendar
                key={calendarKey}
                events={calendarEvents}
                onDateClick={handleCalendarDateClick}
                onEventClick={handleCalendarEventClick}
                height={460}
              />
            </Box>
          )}
        </Box>

        {/* Alta de tarea */}
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
                Vence <Text as="span" color={muted}>(opcional)</Text>
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
              colorScheme="teal"
              onClick={handleAdd}
              isLoading={adding}
              isDisabled={!draft.title.trim()}
            >
              Agregar
            </Button>
          </Flex>
        </Box>

        {/* Lista con filtros */}
        <Box bg={cardBg} borderWidth="1px" borderColor={border} borderRadius="xl" p={{ base: 3, md: 4 }}>
          {/* Filtros */}
          <Flex direction={{ base: "column", lg: "row" }} gap={3} align={{ base: "stretch", lg: "center" }} mb={4}>
            <ButtonGroup size="sm" isAttached variant="outline">
              {[
                { value: "pendiente", label: "Pendientes" },
                { value: "hecho", label: "Hechas" },
                { value: "todas", label: "Todas" },
              ].map((opt) => (
                <Button
                  key={opt.value}
                  onClick={() => setStatusFilter(opt.value)}
                  variant={statusFilter === opt.value ? "solid" : "outline"}
                  colorScheme="teal"
                >
                  {opt.label}
                </Button>
              ))}
            </ButtonGroup>

            <Wrap spacing={2} flex="1">
              <WrapItem>
                <Select size="sm" maxW="170px" value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)}>
                  <option value="todas">Toda prioridad</option>
                  <option value="alta">Alta</option>
                  <option value="media">Media</option>
                  <option value="baja">Baja</option>
                </Select>
              </WrapItem>
              <WrapItem>
                <Select size="sm" maxW="160px" value={tagFilter} onChange={(e) => setTagFilter(e.target.value)}>
                  <option value="todas">Todos los tags</option>
                  {TAG_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </Select>
              </WrapItem>
              <WrapItem>
                <Select size="sm" maxW="190px" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                  <option value="vencimiento">Ordenar: vencimiento</option>
                  <option value="prioridad">Ordenar: prioridad</option>
                  <option value="recientes">Ordenar: más recientes</option>
                </Select>
              </WrapItem>
              <WrapItem flex="1" minW="160px">
                <Input
                  size="sm"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Buscar tarea…"
                />
              </WrapItem>
            </Wrap>

            {hasActiveFilters && (
              <Button size="sm" variant="ghost" colorScheme="red" onClick={clearFilters}>
                Limpiar
              </Button>
            )}
          </Flex>

          {normalizedError && (
            <Text mb={3} color="red.400" fontSize="sm">
              {normalizedError}
            </Text>
          )}

          <VStack spacing={2} align="stretch">
            {pageItems.length === 0 ? (
              <Text color={muted} py={6} textAlign="center">
                {allTareas.length === 0
                  ? "No hay tareas todavía. Agregá la primera arriba."
                  : "No hay tareas con estos filtros."}
              </Text>
            ) : (
              pageItems.map((t) => {
                const isEditing = editingId === t._id;
                const isDone = t.status === "hecho";
                const pr = getPriorityBadge(t.priority);
                const tag = Array.isArray(t.tags) && t.tags.length ? t.tags[0] : null;
                const dueTime = t.dueDate ? new Date(t.dueDate).getTime() : null;
                const overdue = !isDone && dueTime !== null && dueTime < todayStart;
                const overdueDays = overdue
                  ? Math.floor((todayStart - dueTime) / 86400000)
                  : 0;

                return (
                  <Box
                    key={t._id}
                    borderWidth="1px"
                    borderRadius="xl"
                    p={3}
                    borderColor={overdue ? overdueBorder : border}
                    bg={overdue ? overdueBg : "transparent"}
                  >
                    <Flex gap={3} align="flex-start" justify="space-between" flexWrap="wrap">
                      <HStack spacing={3} align="flex-start" flex="1 1 520px">
                        <Checkbox
                          mt={1}
                          isChecked={isDone}
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
                                  textDecoration={isDone ? "line-through" : "none"}
                                  color={isDone ? muted : "inherit"}
                                >
                                  {t.title}
                                </Text>
                                <Badge colorScheme={pr.scheme} variant="subtle">
                                  {pr.label}
                                </Badge>
                                {tag ? (
                                  <Badge colorScheme="teal" variant="outline" textTransform="none">
                                    {tag}
                                  </Badge>
                                ) : null}
                                {overdue ? (
                                  <Badge colorScheme="red">
                                    {overdueDays === 0
                                      ? "Vence hoy"
                                      : `Vencida hace ${overdueDays} día${overdueDays > 1 ? "s" : ""}`}
                                  </Badge>
                                ) : t.dueDate ? (
                                  <Badge colorScheme="gray" variant="outline">
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
                                  <option value="">Sin tag</option>
                                  {TAG_OPTIONS.map((o) => (
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
                              type="button"
                              onClick={() => askDelete(t)}
                            />
                          </>
                        ) : (
                          <>
                            <IconButton
                              aria-label="Guardar"
                              icon={<FiSave />}
                              size="sm"
                              colorScheme="teal"
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

          {totalPages > 1 && (
            <Flex mt={4} justify="space-between" align="center" flexWrap="wrap" gap={2}>
              <Text fontSize="sm" color={muted}>
                Mostrando {pageItems.length} de {filteredTareas.length}
              </Text>
              <HStack>
                <Button size="sm" onClick={() => setListPage((p) => Math.max(1, p - 1))} isDisabled={safePage <= 1}>
                  Anterior
                </Button>
                <Text fontSize="sm" color={muted}>
                  {safePage} / {totalPages}
                </Text>
                <Button
                  size="sm"
                  type="button"
                  onClick={() => setListPage((p) => Math.min(totalPages, p + 1))}
                  isDisabled={safePage >= totalPages}
                >
                  Siguiente
                </Button>
              </HStack>
            </Flex>
          )}
        </Box>
      </VStack>

      <DayEventsModal
        isOpen={dayModal.isOpen}
        onClose={dayModal.onClose}
        date={selectedDay}
        items={selectedDayItems}
        onChanged={handleCalendarChanged}
      />

      {/* Confirmacion de borrado */}
      <AlertDialog
        isOpen={deleteDialog.isOpen}
        leastDestructiveRef={cancelRef}
        onClose={() => {
          deleteDialog.onClose();
          setPendingDelete(null);
        }}
        isCentered
      >
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              Eliminar tarea
            </AlertDialogHeader>
            <AlertDialogBody>
              ¿Seguro que querés eliminar{" "}
              <Text as="span" fontWeight="bold">
                {pendingDelete?.title ? `"${pendingDelete.title}"` : "esta tarea"}
              </Text>
              ? Esta acción no se puede deshacer.
            </AlertDialogBody>
            <AlertDialogFooter>
              <Button
                ref={cancelRef}
                onClick={() => {
                  deleteDialog.onClose();
                  setPendingDelete(null);
                }}
              >
                Cancelar
              </Button>
              <Button colorScheme="red" ml={3} onClick={confirmDelete} isLoading={deleting}>
                Eliminar
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </Box>
  );
};
