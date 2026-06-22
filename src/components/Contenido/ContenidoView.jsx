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
  Flex,
  Heading,
  HStack,
  Text,
  VStack,
  useColorModeValue,
  useDisclosure,
  useToast,
} from "@chakra-ui/react";
import { FiPlus } from "react-icons/fi";
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
  closestCorners,
} from "@dnd-kit/core";
import { useContenido } from "../../hooks/contenido/useContenido.js";
import { useItems } from "../../hooks";
import { Loader } from "../Loader/Loader.jsx";
import { PublicacionCard } from "./PublicacionCard.jsx";
import { PublicacionModal } from "./PublicacionModal.jsx";

const COLUMNS = [
  { key: "idea", label: "Idea" },
  { key: "produccion", label: "En producción" },
  { key: "edicion", label: "En edición" },
  { key: "listo", label: "Listo" },
  { key: "publicado", label: "Publicado" },
];

const RECENT_DAYS = 30;

const KanbanColumn = ({ col, items, onEdit, onDelete, onAdd }) => {
  const colBg = useColorModeValue("gray.100", "gray.800");
  const overBg = useColorModeValue("teal.50", "rgba(45,212,191,0.12)");
  const border = useColorModeValue("gray.200", "gray.700");
  const muted = useColorModeValue("gray.600", "gray.400");
  const { setNodeRef, isOver } = useDroppable({ id: col.key });

  return (
    <Box minW="280px" w="280px" flexShrink={0}>
      <Flex justify="space-between" align="center" mb={2} px={1}>
        <HStack spacing={2}>
          <Heading size="sm" fontFamily="heading">
            {col.label}
          </Heading>
          <Badge colorScheme="gray" borderRadius="full">
            {items.length}
          </Badge>
        </HStack>
        <Button size="xs" variant="ghost" colorScheme="teal" leftIcon={<FiPlus />} onClick={() => onAdd(col.key)}>
          Agregar
        </Button>
      </Flex>
      <VStack
        ref={setNodeRef}
        align="stretch"
        spacing={2}
        bg={isOver ? overBg : colBg}
        borderWidth="1px"
        borderColor={isOver ? "teal.400" : border}
        borderRadius="xl"
        p={2}
        minH="140px"
        transition="background-color 0.15s ease, border-color 0.15s ease"
      >
        {items.length === 0 ? (
          <Text fontSize="xs" color={muted} textAlign="center" py={4}>
            Soltá tarjetas acá
          </Text>
        ) : (
          items.map((c) => (
            <PublicacionCard key={c._id} contenido={c} onEdit={onEdit} onDelete={onDelete} />
          ))
        )}
      </VStack>
    </Box>
  );
};

export const ContenidoView = () => {
  const bg = useColorModeValue("gray.50", "gray.900");
  const panelBg = useColorModeValue("white", "gray.800");
  const border = useColorModeValue("gray.200", "gray.700");
  const muted = useColorModeValue("gray.600", "gray.400");
  const heading = useColorModeValue("teal.600", "teal.300");
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
  } = useContenido();
  const { productsData = [] } = useItems();

  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const modal = useDisclosure();

  const deleteDialog = useDisclosure();
  const [pendingDelete, setPendingDelete] = useState(null);
  const cancelRef = useRef();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  const byEstado = useMemo(() => {
    const map = { idea: [], produccion: [], edicion: [], listo: [], publicado: [] };
    contenidos.forEach((c) => {
      const key = map[c.estado] ? c.estado : "idea";
      map[key].push(c);
    });
    return map;
  }, [contenidos]);

  const productosRecientes = useMemo(() => {
    const limite = Date.now() - RECENT_DAYS * 24 * 60 * 60 * 1000;
    const acc = new Map();
    contenidos.forEach((c) => {
      const prod = c.producto;
      if (!prod || typeof prod !== "object") return;
      const fecha = c.fechaPublicacion ? new Date(c.fechaPublicacion).getTime() : null;
      const reciente = c.estado === "publicado" || (fecha && fecha >= limite);
      if (!reciente) return;
      const nombre = `${prod.nombre ?? ""} ${prod.modelo ?? ""}`.trim() || "Producto";
      const key = prod._id || nombre;
      const current = acc.get(key) || { nombre, count: 0 };
      current.count += 1;
      acc.set(key, current);
    });
    return Array.from(acc.values()).sort((a, b) => b.count - a.count);
  }, [contenidos]);

  const openNew = (estado = "idea") => {
    setEditing({ estado });
    modal.onOpen();
  };

  const openEdit = (contenido) => {
    setEditing(contenido);
    modal.onOpen();
  };

  const handleSubmit = async (payload) => {
    setSaving(true);
    try {
      if (editing?._id) {
        await editContenido(editing._id, payload);
        toast({ status: "success", title: "Publicación actualizada", duration: 2000, isClosable: true });
      } else {
        await addContenido({ ...payload, estado: editing?.estado || "idea" });
        toast({ status: "success", title: "Publicación creada", duration: 2000, isClosable: true });
      }
      modal.onClose();
      setEditing(null);
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

  const askDelete = (contenido) => {
    setPendingDelete(contenido);
    deleteDialog.onOpen();
  };

  const confirmDelete = async () => {
    if (!pendingDelete?._id) return;
    try {
      await removeContenido(pendingDelete._id);
    } finally {
      setPendingDelete(null);
      deleteDialog.onClose();
    }
  };

  const onDragEnd = ({ active, over }) => {
    if (!over) return;
    const card = contenidos.find((c) => c._id === active.id);
    if (card && card.estado !== over.id) {
      moveContenido(active.id, over.id);
    }
  };

  if (loading && contenidos.length === 0) return <Loader />;

  return (
    <Box bg={bg} minH="100vh" p={{ base: 3, md: 5 }}>
      <Flex justify="space-between" align="center" flexWrap="wrap" gap={3} mb={5} maxW="100%">
        <Box>
          <Heading color={heading} size="lg" fontFamily="heading">
            Contenido
          </Heading>
          <Text color={muted} fontSize="sm">
            Planificá y organizá tus publicaciones de redes.
          </Text>
        </Box>
        <Button colorScheme="teal" leftIcon={<FiPlus />} onClick={() => openNew("idea")}>
          Nueva publicación
        </Button>
      </Flex>

      {error && (
        <Text color="red.400" mb={4}>
          {error}
        </Text>
      )}

      {/* Tablero Kanban */}
      <DndContext sensors={sensors} collisionDetection={closestCorners} onDragEnd={onDragEnd}>
        <Flex gap={4} align="flex-start" overflowX="auto" pb={3}>
          {COLUMNS.map((col) => (
            <KanbanColumn
              key={col.key}
              col={col}
              items={byEstado[col.key]}
              onEdit={openEdit}
              onDelete={askDelete}
              onAdd={openNew}
            />
          ))}
        </Flex>
      </DndContext>

      {/* Productos con contenido reciente */}
      <Box mt={6} p={4} bg={panelBg} borderWidth="1px" borderColor={border} borderRadius="xl" maxW="900px">
        <Heading size="sm" fontFamily="heading" mb={1}>
          Productos con contenido reciente
        </Heading>
        <Text fontSize="xs" color={muted} mb={3}>
          Productos promocionados (publicados o programados) en los últimos {RECENT_DAYS} días.
        </Text>
        {productosRecientes.length === 0 ? (
          <Text fontSize="sm" color={muted}>
            Todavía no hay productos con contenido reciente.
          </Text>
        ) : (
          <Flex gap={2} flexWrap="wrap">
            {productosRecientes.map((p) => (
              <Badge key={p.nombre} colorScheme="teal" variant="subtle" borderRadius="full" px={3} py={1}>
                {p.nombre} · {p.count}
              </Badge>
            ))}
          </Flex>
        )}
      </Box>

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
