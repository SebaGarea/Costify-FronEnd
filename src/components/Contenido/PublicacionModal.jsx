import { useEffect, useState } from "react";
import {
  Box,
  Button,
  Checkbox,
  CheckboxGroup,
  Flex,
  FormControl,
  FormLabel,
  HStack,
  IconButton,
  Input,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Select,
  SimpleGrid,
  Stack,
  Text,
  Textarea,
  Wrap,
  WrapItem,
  useColorModeValue,
} from "@chakra-ui/react";
import { FiPlus, FiX } from "react-icons/fi";

// Combobox de producto con búsqueda (el <select> nativo no filtra).
const ProductoSelect = ({ productos, value, onChange }) => {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const listBg = useColorModeValue("white", "gray.700");
  const border = useColorModeValue("gray.200", "gray.600");
  const hover = useColorModeValue("gray.100", "gray.600");
  const muted = useColorModeValue("gray.500", "gray.400");

  const selected = productos.find((p) => p._id === value);
  const selectedLabel = selected ? `${selected.nombre ?? ""} ${selected.modelo ?? ""}`.trim() : "";
  const list = productos
    .filter((p) => `${p.nombre ?? ""} ${p.modelo ?? ""}`.toLowerCase().includes(query.toLowerCase()))
    .slice(0, 40);

  const pick = (id) => {
    onChange(id);
    setOpen(false);
    setQuery("");
  };

  return (
    <Box position="relative">
      <Input
        value={open ? query : selectedLabel}
        placeholder="Buscar producto…"
        onFocus={() => {
          setOpen(true);
          setQuery("");
        }}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
      />
      {open && (
        <Box
          position="absolute"
          zIndex={20}
          top="100%"
          left={0}
          right={0}
          mt={1}
          bg={listBg}
          borderWidth="1px"
          borderColor={border}
          borderRadius="md"
          boxShadow="lg"
          maxH="220px"
          overflowY="auto"
        >
          <Box px={3} py={2} cursor="pointer" _hover={{ bg: hover }} onMouseDown={() => pick("")}>
            <Text fontSize="sm" color={muted}>
              Sin producto
            </Text>
          </Box>
          {list.map((p) => (
            <Box
              key={p._id}
              px={3}
              py={2}
              cursor="pointer"
              _hover={{ bg: hover }}
              onMouseDown={() => pick(p._id)}
            >
              <Text fontSize="sm">{`${p.nombre ?? ""} ${p.modelo ?? ""}`.trim()}</Text>
            </Box>
          ))}
          {list.length === 0 && (
            <Text px={3} py={2} fontSize="sm" color={muted}>
              Sin coincidencias
            </Text>
          )}
        </Box>
      )}
    </Box>
  );
};

const CANALES = [
  { value: "instagram", label: "Instagram" },
  { value: "facebook", label: "Facebook" },
  { value: "tiktok", label: "TikTok" },
  { value: "tiendanube", label: "Tienda Nube" },
];

const TIPOS = ["foto", "reel", "carrusel", "historia", "otro"];

// Checklist de producción precargado según el tipo de pieza.
const CHECKLIST_TEMPLATES = {
  foto: ["Preparar producto / set", "Sacar fotos", "Seleccionar y retocar", "Texto de posteo"],
  reel: [
    "Pensar idea / guion",
    "Grabar video",
    "Editar (cortes, música, subtítulos)",
    "Diseñar portada",
    "Texto de posteo",
  ],
  carrusel: [
    "Preparar producto / set",
    "Sacar fotos",
    "Seleccionar y retocar",
    "Armar carrusel",
    "Texto de posteo",
  ],
  historia: ["Sacar foto / grabar", "Agregar sticker / encuesta / link"],
  otro: [],
};

const templateItems = (tipo) =>
  (CHECKLIST_TEMPLATES[tipo] || []).map((text) => ({ text, done: false }));

const toDateInput = (v) => (v ? String(v).slice(0, 10) : "");
const toISO = (v) => (v ? new Date(`${v}T12:00:00.000Z`).toISOString() : null);

const emptyForm = {
  titulo: "",
  canales: ["instagram", "facebook"],
  tipo: "foto",
  fechaPublicacion: "",
  producto: "",
  responsable: "",
  copy: "",
  notas: "",
  checklist: [],
  enlaces: [],
};

export const PublicacionModal = ({
  isOpen,
  onClose,
  onSubmit,
  initial,
  usuarios = [],
  productos = [],
  saving = false,
}) => {
  const [form, setForm] = useState(emptyForm);
  const isEdit = Boolean(initial?._id);

  useEffect(() => {
    if (!isOpen) return;
    if (initial?._id) {
      setForm({
        titulo: initial.titulo || "",
        canales: Array.isArray(initial.canales) && initial.canales.length
          ? initial.canales
          : ["instagram", "facebook"],
        tipo: initial.tipo || "foto",
        fechaPublicacion: toDateInput(initial.fechaPublicacion),
        producto:
          (initial.producto && (initial.producto._id || initial.producto)) || "",
        responsable:
          (initial.responsable && (initial.responsable._id || initial.responsable)) || "",
        copy: initial.copy || "",
        notas: initial.notas || "",
        checklist: Array.isArray(initial.checklist)
          ? initial.checklist.map((i) => ({ text: i.text || "", done: !!i.done }))
          : [],
        enlaces: Array.isArray(initial.enlaces)
          ? initial.enlaces.map((e) => ({ titulo: e.titulo || "", url: e.url || "" }))
          : [],
      });
    } else {
      // Nueva publicación: precargar checklist según el tipo y la fecha del bucket (si vino).
      setForm({
        ...emptyForm,
        fechaPublicacion: toDateInput(initial?.fechaPublicacion),
        checklist: templateItems(emptyForm.tipo),
      });
    }
  }, [isOpen, initial]);

  const set = (key, value) => setForm((p) => ({ ...p, [key]: value }));

  const handleTipoChange = (tipo) =>
    setForm((p) => ({
      ...p,
      tipo,
      // Si el checklist está vacío, cargar la plantilla del nuevo tipo.
      checklist: p.checklist.length === 0 ? templateItems(tipo) : p.checklist,
    }));

  const applyTemplate = () =>
    setForm((p) => ({ ...p, checklist: templateItems(p.tipo) }));

  const addEnlace = () =>
    setForm((p) => ({ ...p, enlaces: [...p.enlaces, { titulo: "", url: "" }] }));
  const updateEnlace = (idx, patch) =>
    setForm((p) => ({
      ...p,
      enlaces: p.enlaces.map((e, i) => (i === idx ? { ...e, ...patch } : e)),
    }));
  const removeEnlace = (idx) =>
    setForm((p) => ({ ...p, enlaces: p.enlaces.filter((_, i) => i !== idx) }));

  const addChecklistItem = () =>
    setForm((p) => ({ ...p, checklist: [...p.checklist, { text: "", done: false }] }));
  const updateChecklistItem = (idx, patch) =>
    setForm((p) => ({
      ...p,
      checklist: p.checklist.map((it, i) => (i === idx ? { ...it, ...patch } : it)),
    }));
  const removeChecklistItem = (idx) =>
    setForm((p) => ({ ...p, checklist: p.checklist.filter((_, i) => i !== idx) }));

  const handleSubmit = () => {
    if (!form.titulo.trim()) return;
    const payload = {
      titulo: form.titulo.trim(),
      canales: form.canales,
      tipo: form.tipo,
      fechaPublicacion: toISO(form.fechaPublicacion),
      producto: form.producto || null,
      responsable: form.responsable || null,
      copy: form.copy.trim(),
      notas: form.notas.trim(),
      checklist: form.checklist
        .map((i) => ({ text: (i.text || "").trim(), done: !!i.done }))
        .filter((i) => i.text),
      enlaces: form.enlaces
        .map((e) => ({ titulo: (e.titulo || "").trim(), url: (e.url || "").trim() }))
        .filter((e) => e.url),
    };
    onSubmit(payload);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl" isCentered scrollBehavior="inside">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>{isEdit ? "Editar publicación" : "Nueva publicación"}</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <Stack spacing={4}>
            <FormControl isRequired>
              <FormLabel fontSize="sm">Título / idea</FormLabel>
              <Input
                value={form.titulo}
                onChange={(e) => set("titulo", e.target.value)}
                placeholder="Ej: Reel mostrando la mesa de roble"
                autoFocus
              />
            </FormControl>

            <FormControl>
              <FormLabel fontSize="sm">Canales</FormLabel>
              <CheckboxGroup value={form.canales} onChange={(v) => set("canales", v)}>
                <Wrap spacing={4}>
                  {CANALES.map((c) => (
                    <WrapItem key={c.value}>
                      <Checkbox value={c.value} colorScheme="teal">
                        {c.label}
                      </Checkbox>
                    </WrapItem>
                  ))}
                </Wrap>
              </CheckboxGroup>
            </FormControl>

            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
              <FormControl>
                <FormLabel fontSize="sm">Tipo</FormLabel>
                <Select value={form.tipo} onChange={(e) => handleTipoChange(e.target.value)}>
                  {TIPOS.map((t) => (
                    <option key={t} value={t}>
                      {t.charAt(0).toUpperCase() + t.slice(1)}
                    </option>
                  ))}
                </Select>
              </FormControl>
              <FormControl>
                <FormLabel fontSize="sm">Fecha de publicación</FormLabel>
                <Input
                  type="date"
                  value={form.fechaPublicacion}
                  onChange={(e) => set("fechaPublicacion", e.target.value)}
                />
              </FormControl>
            </SimpleGrid>

            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
              <FormControl>
                <FormLabel fontSize="sm">Producto asociado</FormLabel>
                <ProductoSelect
                  productos={productos}
                  value={form.producto}
                  onChange={(id) => set("producto", id)}
                />
              </FormControl>
              <FormControl>
                <FormLabel fontSize="sm">Responsable</FormLabel>
                <Select
                  placeholder="Sin asignar"
                  value={form.responsable}
                  onChange={(e) => set("responsable", e.target.value)}
                >
                  {usuarios.map((u) => (
                    <option key={u._id} value={u._id}>
                      {`${u.first_name ?? ""} ${u.last_name ?? ""}`.trim() || u.email}
                    </option>
                  ))}
                </Select>
              </FormControl>
            </SimpleGrid>

            <FormControl>
              <FormLabel fontSize="sm">Copy / texto del posteo</FormLabel>
              <Textarea
                value={form.copy}
                onChange={(e) => set("copy", e.target.value)}
                placeholder="Texto, hashtags, llamado a la acción…"
                minH="80px"
              />
            </FormControl>

            <FormControl>
              <Flex justify="space-between" align="center" mb={2}>
                <FormLabel fontSize="sm" mb={0}>
                  Imágenes / archivos (links)
                </FormLabel>
                <Button size="xs" leftIcon={<FiPlus />} variant="ghost" colorScheme="teal" onClick={addEnlace}>
                  Agregar link
                </Button>
              </Flex>
              <Stack spacing={2}>
                {form.enlaces.length === 0 ? (
                  <Text fontSize="xs" color="gray.500">
                    Pegá el link de la carpeta de Drive, las fotos o el video editado.
                  </Text>
                ) : (
                  form.enlaces.map((enlace, idx) => (
                    <HStack key={idx} align="flex-start">
                      <Input
                        size="sm"
                        maxW="160px"
                        value={enlace.titulo}
                        onChange={(e) => updateEnlace(idx, { titulo: e.target.value })}
                        placeholder="Etiqueta (ej: fotos)"
                      />
                      <Input
                        size="sm"
                        value={enlace.url}
                        onChange={(e) => updateEnlace(idx, { url: e.target.value })}
                        placeholder="https://drive.google.com/…"
                      />
                      <IconButton
                        aria-label="Quitar"
                        icon={<FiX />}
                        size="sm"
                        variant="ghost"
                        onClick={() => removeEnlace(idx)}
                      />
                    </HStack>
                  ))
                )}
              </Stack>
            </FormControl>

            <FormControl>
              <Flex justify="space-between" align="center" mb={2}>
                <FormLabel fontSize="sm" mb={0}>
                  Checklist de producción
                </FormLabel>
                <HStack spacing={1}>
                  <Button size="xs" variant="ghost" onClick={applyTemplate}>
                    Usar plantilla
                  </Button>
                  <Button size="xs" leftIcon={<FiPlus />} variant="ghost" colorScheme="teal" onClick={addChecklistItem}>
                    Agregar
                  </Button>
                </HStack>
              </Flex>
              <Stack spacing={2}>
                {form.checklist.length === 0 ? (
                  <Text fontSize="xs" color="gray.500">
                    Ej: grabar video, sacar fotos, editar, escribir copy…
                  </Text>
                ) : (
                  form.checklist.map((item, idx) => (
                    <HStack key={idx}>
                      <Checkbox
                        colorScheme="teal"
                        isChecked={item.done}
                        onChange={(e) => updateChecklistItem(idx, { done: e.target.checked })}
                      />
                      <Input
                        size="sm"
                        value={item.text}
                        onChange={(e) => updateChecklistItem(idx, { text: e.target.value })}
                        placeholder="Tarea de producción"
                      />
                      <IconButton
                        aria-label="Quitar"
                        icon={<FiX />}
                        size="sm"
                        variant="ghost"
                        onClick={() => removeChecklistItem(idx)}
                      />
                    </HStack>
                  ))
                )}
              </Stack>
            </FormControl>

            <FormControl>
              <FormLabel fontSize="sm">Notas</FormLabel>
              <Textarea
                value={form.notas}
                onChange={(e) => set("notas", e.target.value)}
                placeholder="Notas internas, referencias…"
                minH="60px"
              />
            </FormControl>
          </Stack>
        </ModalBody>
        <ModalFooter>
          <Button variant="ghost" mr={3} onClick={onClose}>
            Cancelar
          </Button>
          <Button
            colorScheme="teal"
            onClick={handleSubmit}
            isLoading={saving}
            isDisabled={!form.titulo.trim()}
          >
            {isEdit ? "Guardar" : "Crear"}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};
