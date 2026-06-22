import { useMemo, useRef, useState } from "react";
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
  Checkbox,
  Flex,
  Heading,
  HStack,
  IconButton,
  Input,
  Select,
  Text,
  VStack,
  Wrap,
  WrapItem,
  useColorModeValue,
  useDisclosure,
  useToast,
} from "@chakra-ui/react";
import { FiPlus, FiEdit2, FiTrash2, FiCalendar, FiChevronDown, FiChevronUp, FiLink } from "react-icons/fi";
import { useContenido } from "../../hooks/contenido/useContenido.js";
import { useItems } from "../../hooks";
import { useCalendarEvents } from "../../hooks/calendar/useCalendarEvents.js";
import { UnifiedCalendar } from "../Calendar/UnifiedCalendar.jsx";
import { DayEventsModal } from "../Home/DayEventsModal.jsx";
import { Loader } from "../Loader/Loader.jsx";
import { PublicacionModal } from "./PublicacionModal.jsx";

const CANAL_LABEL = { instagram: "IG", facebook: "FB", tiktok: "TikTok", tiendanube: "Nube" };
const CANALES = ["instagram", "facebook", "tiktok", "tiendanube"];

const toDateInput = (v) => (v ? String(v).slice(0, 10) : "");
const toISO = (v) => (v ? new Date(`${v}T12:00:00.000Z`).toISOString() : null);
const fmtFecha = (v) => {
  if (!v) return "";
  try {
    return new Date(v).toLocaleDateString("es-AR", { day: "2-digit", month: "short", year: "numeric" });
  } catch {
    return "";
  }
};
const responsableLabel = (r) => {
  if (!r || typeof r === "string") return null;
  return `${r.first_name || ""} ${r.last_name || ""}`.trim() || r.email || null;
};

export const ContenidoView = () => {
  const bg = useColorModeValue("gray.50", "gray.900");
  const cardBg = useColorModeValue("white", "gray.800");
  const border = useColorModeValue("gray.200", "gray.700");
  const muted = useColorModeValue("gray.600", "gray.400");
  const heading = useColorModeValue("teal.600", "teal.300");
  const overdueBg = useColorModeValue("red.50", "rgba(229,62,62,0.14)");
  const overdueBorder = useColorModeValue("red.300", "red.500");
  const toast = useToast();

  const {
    contenidos,
    usuarios,
    loading,
    error,
    addContenido,
    editContenido,
    moveContenido,
    removeContenido,
    refetch,
  } = useContenido();
  const { productsData = [] } = useItems();

  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const modal = useDisclosure();

  const deleteDialog = useDisclosure();
  const [pendingDelete, setPendingDelete] = useState(null);
  const cancelRef = useRef();

  const [showCalendar, setShowCalendar] = useState(true);
  const [showPublicadas, setShowPublicadas] = useState(false);
  const [search, setSearch] = useState("");
  const [canalFilter, setCanalFilter] = useState("todas");
  const [responsableFilter, setResponsableFilter] = useState("todos");
  const [calendarKey, setCalendarKey] = useState(0);
  const bumpCalendar = () => setCalendarKey((k) => k + 1);

  const todayStart = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d.getTime();
  }, []);

  // Calendario unificado (reusa nuestras publicaciones -> sin doble fetch)
  const { events: calendarEvents, itemsByDay, buildDayKey, refetchAll } = useCalendarEvents({
    contenidoDataExt: contenidos,
  });
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
    await Promise.all([refetch(), refetchAll()]);
    bumpCalendar();
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return contenidos.filter((c) => {
      if (canalFilter !== "todas" && !(c.canales || []).includes(canalFilter)) return false;
      if (responsableFilter !== "todos") {
        const rid = c.responsable && (c.responsable._id || c.responsable);
        if (String(rid || "") !== responsableFilter) return false;
      }
      if (q) {
        const hay = `${c.titulo || ""} ${c.copy || ""} ${c.notas || ""}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [contenidos, search, canalFilter, responsableFilter]);

  const ideas = useMemo(
    () => filtered.filter((c) => c.estado !== "publicado" && !c.fechaPublicacion),
    [filtered]
  );
  const programadas = useMemo(
    () =>
      filtered
        .filter((c) => c.estado !== "publicado" && c.fechaPublicacion)
        .sort((a, b) => new Date(a.fechaPublicacion) - new Date(b.fechaPublicacion)),
    [filtered]
  );
  const publicadas = useMemo(
    () =>
      filtered
        .filter((c) => c.estado === "publicado")
        .sort((a, b) => new Date(b.fechaPublicacion || 0) - new Date(a.fechaPublicacion || 0)),
    [filtered]
  );

  const openNew = () => {
    setEditing(null);
    modal.onOpen();
  };
  const openEdit = (c) => {
    setEditing(c);
    modal.onOpen();
  };

  const handleSubmit = async (payload) => {
    setSaving(true);
    try {
      if (editing?._id) {
        await editContenido(editing._id, payload);
        toast({ status: "success", title: "Publicación actualizada", duration: 2000, isClosable: true });
      } else {
        await addContenido({ ...payload, estado: "idea" });
        toast({ status: "success", title: "Publicación creada", duration: 2000, isClosable: true });
      }
      modal.onClose();
      setEditing(null);
      bumpCalendar();
    } catch (err) {
      toast({
        status: "error",
        title: "No se pudo guardar",
        description: err.response?.data?.message || "Intentá de nuevo",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setSaving(false);
    }
  };

  const askDelete = (c) => {
    setPendingDelete(c);
    deleteDialog.onOpen();
  };
  const confirmDelete = async () => {
    if (!pendingDelete?._id) return;
    try {
      await removeContenido(pendingDelete._id);
      bumpCalendar();
    } finally {
      setPendingDelete(null);
      deleteDialog.onClose();
    }
  };

  const schedule = (c, dateStr) => moveContenido(c._id, { fechaPublicacion: toISO(dateStr) });
  const togglePublicada = (c, checked) =>
    moveContenido(c._id, { estado: checked ? "publicado" : "idea" });

  const renderRow = (c) => {
    const isPub = c.estado === "publicado";
    const dueTime = c.fechaPublicacion ? new Date(c.fechaPublicacion).getTime() : null;
    const overdue = !isPub && dueTime !== null && dueTime < todayStart;
    const checklist = Array.isArray(c.checklist) ? c.checklist : [];
    const checkDone = checklist.filter((i) => i?.done).length;
    const enlaces = Array.isArray(c.enlaces) ? c.enlaces : [];
    const resp = responsableLabel(c.responsable);
    const prod = c.producto;
    const prodNombre = prod && typeof prod === "object" ? `${prod.nombre ?? ""} ${prod.modelo ?? ""}`.trim() : null;

    return (
      <Box
        key={c._id}
        borderWidth="1px"
        borderRadius="lg"
        p={3}
        bg={overdue ? overdueBg : cardBg}
        borderColor={overdue ? overdueBorder : border}
      >
        <Flex gap={3} align="flex-start" justify="space-between" flexWrap="wrap">
          <HStack align="flex-start" spacing={3} flex="1 1 420px" minW={0}>
            <Checkbox
              mt={1}
              colorScheme="green"
              isChecked={isPub}
              onChange={(e) => togglePublicada(c, e.target.checked)}
              title="Marcar como publicada"
            />
            <Box minW={0} flex="1" cursor="pointer" onClick={() => openEdit(c)}>
              <Text fontWeight="semibold" noOfLines={1} textDecoration={isPub ? "line-through" : "none"}>
                {c.titulo}
              </Text>
              <Wrap spacing={1} mt={1}>
                {(c.canales || []).map((ch) => (
                  <WrapItem key={ch}>
                    <Badge colorScheme="teal" variant="subtle" fontSize="0.65rem">
                      {CANAL_LABEL[ch] || ch}
                    </Badge>
                  </WrapItem>
                ))}
                {c.tipo && (
                  <WrapItem>
                    <Badge colorScheme="gray" variant="subtle" fontSize="0.65rem" textTransform="capitalize">
                      {c.tipo}
                    </Badge>
                  </WrapItem>
                )}
              </Wrap>
              <HStack mt={1} spacing={3} color={muted} fontSize="xs" flexWrap="wrap">
                {prodNombre && <Text noOfLines={1}>🛋 {prodNombre}</Text>}
                {resp && <Text noOfLines={1}>👤 {resp}</Text>}
                {checklist.length > 0 && (
                  <Text>
                    ✓ {checkDone}/{checklist.length}
                  </Text>
                )}
                {enlaces.length > 0 && (
                  <HStack spacing={1}>
                    <FiLink />
                    <Text>{enlaces.length}</Text>
                  </HStack>
                )}
              </HStack>
            </Box>
          </HStack>

          <HStack spacing={2} align="center">
            {!isPub && (
              <Input
                type="date"
                size="sm"
                w="150px"
                value={toDateInput(c.fechaPublicacion)}
                onChange={(e) => schedule(c, e.target.value)}
                title="Programar fecha de publicación"
              />
            )}
            {overdue && <Badge colorScheme="red">Vencida</Badge>}
            {isPub && c.fechaPublicacion && (
              <Text fontSize="xs" color={muted}>
                {fmtFecha(c.fechaPublicacion)}
              </Text>
            )}
            <IconButton aria-label="Editar" icon={<FiEdit2 />} size="sm" variant="ghost" onClick={() => openEdit(c)} />
            <IconButton
              aria-label="Eliminar"
              icon={<FiTrash2 />}
              size="sm"
              variant="ghost"
              colorScheme="red"
              onClick={() => askDelete(c)}
            />
          </HStack>
        </Flex>
      </Box>
    );
  };

  const Section = ({ title, count, items, emptyText }) => (
    <Box>
      <HStack mb={2} spacing={2}>
        <Heading size="sm" fontFamily="heading">
          {title}
        </Heading>
        <Badge colorScheme="gray" borderRadius="full">
          {count}
        </Badge>
      </HStack>
      {items.length === 0 ? (
        <Text fontSize="sm" color={muted} mb={2}>
          {emptyText}
        </Text>
      ) : (
        <VStack align="stretch" spacing={2}>
          {items.map(renderRow)}
        </VStack>
      )}
    </Box>
  );

  if (loading && contenidos.length === 0) return <Loader />;

  return (
    <Box bg={bg} minH="100vh" p={{ base: 3, md: 5 }}>
      <VStack spacing={5} align="stretch" maxW="1100px" mx="auto">
        <Flex justify="space-between" align="center" flexWrap="wrap" gap={3}>
          <Box>
            <Heading color={heading} size="lg" fontFamily="heading">
              Contenido
            </Heading>
            <Text color={muted} fontSize="sm">
              Cargá ideas y programalas. Las que tienen fecha aparecen en el calendario.
            </Text>
          </Box>
          <Button colorScheme="teal" leftIcon={<FiPlus />} onClick={openNew}>
            Nueva publicación
          </Button>
        </Flex>

        {error && <Text color="red.400">{error}</Text>}

        {/* Calendario colapsable */}
        <Box bg={cardBg} borderWidth="1px" borderColor={border} borderRadius="xl" p={{ base: 3, md: 4 }}>
          <Flex justify="space-between" align="center">
            <HStack spacing={2}>
              <FiCalendar />
              <Heading size="sm" fontFamily="heading">
                Calendario
              </Heading>
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
                height={420}
              />
            </Box>
          )}
        </Box>

        {/* Filtros */}
        <Flex gap={2} flexWrap="wrap" align="center">
          <Input
            size="sm"
            maxW="260px"
            placeholder="Buscar…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <Select size="sm" maxW="160px" value={canalFilter} onChange={(e) => setCanalFilter(e.target.value)}>
            <option value="todas">Todos los canales</option>
            {CANALES.map((ch) => (
              <option key={ch} value={ch}>
                {CANAL_LABEL[ch]}
              </option>
            ))}
          </Select>
          <Select
            size="sm"
            maxW="190px"
            value={responsableFilter}
            onChange={(e) => setResponsableFilter(e.target.value)}
          >
            <option value="todos">Todos los responsables</option>
            {usuarios.map((u) => (
              <option key={u._id} value={u._id}>
                {`${u.first_name ?? ""} ${u.last_name ?? ""}`.trim() || u.email}
              </option>
            ))}
          </Select>
          <Checkbox
            colorScheme="teal"
            isChecked={showPublicadas}
            onChange={(e) => setShowPublicadas(e.target.checked)}
          >
            <Text fontSize="sm">Mostrar publicadas</Text>
          </Checkbox>
        </Flex>

        <Section
          title="Ideas (sin fecha)"
          count={ideas.length}
          items={ideas}
          emptyText="No hay ideas sin fecha. Creá una con “Nueva publicación”."
        />

        <Section
          title="Programadas"
          count={programadas.length}
          items={programadas}
          emptyText="Todavía no programaste ninguna publicación."
        />

        {showPublicadas && (
          <Section
            title="Publicadas"
            count={publicadas.length}
            items={publicadas}
            emptyText="Aún no marcaste publicaciones como publicadas."
          />
        )}
      </VStack>

      <DayEventsModal
        isOpen={dayModal.isOpen}
        onClose={dayModal.onClose}
        date={selectedDay}
        items={selectedDayItems}
        onChanged={handleCalendarChanged}
      />

      <PublicacionModal
        isOpen={modal.isOpen}
        onClose={() => {
          modal.onClose();
          setEditing(null);
        }}
        onSubmit={handleSubmit}
        initial={editing}
        usuarios={usuarios}
        productos={productsData}
        saving={saving}
      />

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
              Eliminar publicación
            </AlertDialogHeader>
            <AlertDialogBody>
              ¿Seguro que querés eliminar{" "}
              <Text as="span" fontWeight="bold">
                {pendingDelete?.titulo ? `"${pendingDelete.titulo}"` : "esta publicación"}
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
              <Button colorScheme="red" ml={3} onClick={confirmDelete}>
                Eliminar
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </Box>
  );
};
