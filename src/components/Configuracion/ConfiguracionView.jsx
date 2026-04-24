import { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
  Badge,
  Box,
  Button,
  Card,
  CardBody,
  CardHeader,
  Flex,
  FormControl,
  FormLabel,
  Heading,
  HStack,
  Icon,
  IconButton,
  Input,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  Select,
  SimpleGrid,
  Stack,
  Text,
  Tooltip,
  Collapse,
  useDisclosure,
  useColorModeValue,
  useToast,
} from "@chakra-ui/react";
import { ChevronDownIcon, ChevronUpIcon } from "@chakra-ui/icons";
import { FiCopy, FiRefreshCw, FiShield } from "react-icons/fi";
import { MdMailOutline } from "react-icons/md";
import { BsLightningCharge } from "react-icons/bs";
import { useAuth } from "../../hooks/auth/useAuth.jsx";
import { createInvitation, listInvitations } from "../../services/invitations.service";
import { changePassword } from "../../services/auth.service";
import { usePerfilesPintura } from "../../hooks/perfilesPintura/usePerfilesPintura.js";
import { useItemsMateriasPrimas } from "../../hooks/materiasPrimas/index.js";
import { createPerfilPintura, updatePerfilPintura, deletePerfilPintura } from "../../services/perfilesPintura.service.js";
import { useConfiguracion } from "../../hooks/configuracion/useConfiguracion.js";
import { updateConfiguracion, aplicarPrecioPinturaATodas } from "../../services/configuracion.service.js";
import { FiTrash2, FiEdit2, FiCheck, FiX } from "react-icons/fi";

const formatDateTime = (value) => {
  if (!value) return null;
  try {
    return new Intl.DateTimeFormat("es-AR", {
      dateStyle: "short",
      timeStyle: "short",
    }).format(new Date(value));
  } catch (error) {
    console.warn("No se pudo formatear la fecha", error);
    return value;
  }
};

export const ConfiguracionView = () => {
  const { user } = useAuth();
  const isAdmin = (user?.role ?? "").toLowerCase() === "admin";
  const toast = useToast();
  const accentColor = useColorModeValue("blue.600", "blue.300");
  const cardBg = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.700");

  const [invitationForm, setInvitationForm] = useState({
    email: "",
    role: "user",
    maxUses: 1,
    expiresAt: "",
  });
  const [creating, setCreating] = useState(false);
  const [invitations, setInvitations] = useState([]);
  const [loadingInvitations, setLoadingInvitations] = useState(false);
  const { isOpen: formOpen, onToggle: toggleForm } = useDisclosure();
  const { isOpen: securityOpen, onToggle: toggleSecurity } = useDisclosure({ defaultIsOpen: false });
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [changingPassword, setChangingPassword] = useState(false);

  const fetchInvitations = async () => {
    try {
      setLoadingInvitations(true);
      const { data } = await listInvitations();
      setInvitations(data?.invitaciones ?? []);
    } catch (error) {
      console.warn("No se pudieron obtener las invitaciones", error.response?.data ?? error.message);
    } finally {
      setLoadingInvitations(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      fetchInvitations();
    }
  }, [isAdmin]);

  const handleInvitationField = (field) => (value) => {
    setInvitationForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleInvitationSubmit = async (event) => {
    event.preventDefault();
    if (!invitationForm.email?.trim()) {
      toast({ title: "Correo requerido", status: "warning", duration: 3000, isClosable: true });
      return;
    }
    setCreating(true);
    try {
      const payload = {
        email: invitationForm.email.trim().toLowerCase(),
        role: invitationForm.role,
        maxUses: Number(invitationForm.maxUses) || 1,
      };
      if (invitationForm.expiresAt) {
        payload.expiresAt = new Date(invitationForm.expiresAt).toISOString();
      }
      const { data } = await createInvitation(payload);
      const nueva = data?.invitacion;
      if (nueva) {
        setInvitations((prev) => [nueva, ...prev]);
      }
      toast({
        title: "Invitación generada",
        description: nueva?.code ? `Código: ${nueva.code}` : "Se creó la invitación",
        status: "success",
        duration: 5000,
        isClosable: true,
      });
      setInvitationForm({ email: "", role: invitationForm.role, maxUses: 1, expiresAt: "" });
    } catch (error) {
      const message = error.response?.data?.error ?? "No se pudo generar la invitación";
      toast({ title: "Error", description: message, status: "error", duration: 4000, isClosable: true });
    } finally {
      setCreating(false);
    }
  };

  const handlePasswordField = (field) => (event) => {
    const value = event.target.value;
    setPasswordForm((prev) => ({ ...prev, [field]: value }));
  };

  const handlePasswordSubmit = async (event) => {
    event.preventDefault();
    if (!passwordForm.currentPassword || !passwordForm.newPassword) {
      toast({ title: "Campos incompletos", description: "Completa las contraseñas requeridas", status: "warning", duration: 3000, isClosable: true });
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast({ title: "Las contraseñas no coinciden", status: "error", duration: 3000, isClosable: true });
      return;
    }
    if (passwordForm.newPassword.length < 6) {
      toast({ title: "Contraseña muy corta", description: "Debe tener al menos 6 caracteres", status: "warning", duration: 3000, isClosable: true });
      return;
    }
    setChangingPassword(true);
    try {
      await changePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });
      toast({ title: "Contraseña actualizada", status: "success", duration: 4000, isClosable: true });
      setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (error) {
      const message = error.response?.data?.error ?? "No se pudo actualizar la contraseña";
      toast({ title: "Error", description: message, status: "error", duration: 4000, isClosable: true });
    } finally {
      setChangingPassword(false);
    }
  };

  const handleCopyCode = async (code) => {
    if (!code) return;
    try {
      await navigator.clipboard.writeText(code);
      toast({ title: "Código copiado", status: "info", duration: 2500, isClosable: true });
    } catch (error) {
      toast({ title: "No se pudo copiar", status: "error", duration: 2500, isClosable: true });
    }
  };

  const invitationCards = useMemo(() => {
    return invitations.map((inv) => {
      const now = Date.now();
      const expiresAtTs = inv.expiresAt ? new Date(inv.expiresAt).getTime() : null;
      const isExpired = Boolean(expiresAtTs && expiresAtTs < now);
      const isFull = inv.maxUses && inv.usedCount >= inv.maxUses;
      const isActive = inv.isActive && !isExpired && !isFull;
      const statusVariant = isActive ? "success" : isExpired ? "warning" : "gray";
      const statusLabel = isActive ? "Activa" : isExpired ? "Expirada" : "Completada";
      return (
        <Flex
          key={inv._id}
          p={4}
          borderWidth="1px"
          borderColor={borderColor}
          borderRadius="xl"
          align="center"
          justify="space-between"
          gap={4}
        >
          <Box>
            <HStack spacing={2} mb={1}>
              <Text fontWeight="semibold" fontSize="lg" fontFamily="'Space Grotesk', 'DM Sans', sans-serif">
                {inv.code}
              </Text>
              <Badge colorScheme={statusVariant}>{statusLabel}</Badge>
            </HStack>
            <Text fontSize="sm" color="gray.500">{inv.email || "Invitación abierta"}</Text>
            <Text fontSize="xs" color="gray.500">
              Usos: {inv.usedCount ?? 0} / {inv.maxUses ?? 1}
            </Text>
            {inv.expiresAt && (
              <Text fontSize="xs" color="gray.500">
                Vence: {formatDateTime(inv.expiresAt)}
              </Text>
            )}
          </Box>
          <Tooltip label="Copiar código">
            <IconButton icon={<FiCopy />} aria-label="Copiar código" onClick={() => handleCopyCode(inv.code)} variant="ghost" />
          </Tooltip>
        </Flex>
      );
    });
  }, [invitations, borderColor]);

  return (
    <Box px={{ base: 2, md: 6 }} py={6}>
      <Stack spacing={3} mb={8}>
        <Heading size="lg">Configuración</Heading>
        <Text color="gray.500">Gestiona los accesos y las preferencias de tu cuenta.</Text>
      </Stack>

      <SimpleGrid columns={{ base: 1, md: 2 }} spacing={10} mb={6}>
        <Card bg={cardBg} borderColor={borderColor} borderWidth="1px">
          <CardHeader>
            <Heading size="md">Datos de la cuenta</Heading>
          </CardHeader>
          <CardBody>
            <Stack spacing={3} fontSize="sm">
              <Flex justify="space-between">
                <Text color="gray.500">Nombre</Text>
                <Text fontWeight="medium">{user?.first_name} {user?.last_name}</Text>
              </Flex>
              <Flex justify="space-between">
                <Text color="gray.500">Correo</Text>
                <Text fontWeight="medium">{user?.email}</Text>
              </Flex>
              <Flex justify="space-between">
                <Text color="gray.500">Rol</Text>
                <Badge colorScheme={isAdmin ? "purple" : "blue"} textTransform="capitalize">
                  {user?.role ?? "user"}
                </Badge>
              </Flex>
              <Flex justify="space-between">
                <Text color="gray.500">Verificación</Text>
                <Badge colorScheme={user?.emailVerified ? "green" : "orange"}>
                  {user?.emailVerified ? "Verificada" : "Pendiente"}
                </Badge>
              </Flex>
            </Stack>
          </CardBody>
        </Card>
      </SimpleGrid>

      <Card bg={cardBg} borderColor={borderColor} borderWidth="1px" mb={6}>
        <CardHeader>
          <Flex justify="space-between" align="center">
            <Box>
              <Heading size="md">Seguridad</Heading>
              <Text color="gray.500" fontSize="sm" mt={1}>
                Actualiza tu contraseña personal para mantener la cuenta protegida.
              </Text>
            </Box>
            <IconButton
              aria-label="Mostrar formulario de seguridad"
              variant="ghost"
              icon={securityOpen ? <ChevronUpIcon /> : <ChevronDownIcon />}
              onClick={toggleSecurity}
            />
          </Flex>
        </CardHeader>
        <Collapse in={securityOpen} animateOpacity>
          <CardBody as="form" onSubmit={handlePasswordSubmit}>
            <Stack spacing={4}>
              <FormControl isRequired>
                <FormLabel>Contraseña actual</FormLabel>
                <Input
                  type="password"
                  autoComplete="current-password"
                  value={passwordForm.currentPassword}
                  onChange={handlePasswordField("currentPassword")}
                />
              </FormControl>
              <FormControl isRequired>
                <FormLabel>Nueva contraseña</FormLabel>
                <Input
                  type="password"
                  autoComplete="new-password"
                  value={passwordForm.newPassword}
                  onChange={handlePasswordField("newPassword")}
                />
              </FormControl>
              <FormControl isRequired>
                <FormLabel>Confirmar nueva contraseña</FormLabel>
                <Input
                  type="password"
                  autoComplete="new-password"
                  value={passwordForm.confirmPassword}
                  onChange={handlePasswordField("confirmPassword")}
                />
              </FormControl>
              <Button type="submit" colorScheme="blue" isLoading={changingPassword} alignSelf="flex-start">
                Actualizar contraseña
              </Button>
            </Stack>
          </CardBody>
        </Collapse>
      </Card>

      {isAdmin ? (
        <Card bg={cardBg} borderColor={borderColor} borderWidth="1px">
          <CardHeader>
            <Flex justify="space-between" align="center">
              <HStack spacing={3}>
                <Icon as={MdMailOutline} color={accentColor} boxSize={6} />
                <Heading size="md">Enviar invitación a Usuario Nuevo</Heading>
              </HStack>
              <IconButton
                aria-label="Mostrar formulario"
                variant="ghost"
                icon={formOpen ? <ChevronUpIcon /> : <ChevronDownIcon />}
                onClick={toggleForm}
              />
            </Flex>
          </CardHeader>
          <Collapse in={formOpen} animateOpacity>
            <CardBody pt={0}>
              <Stack spacing={8}>
                <Box as="form" onSubmit={handleInvitationSubmit}>
                  <Stack spacing={4}>
                    <FormControl isRequired>
                      <FormLabel>Correo del destinatario</FormLabel>
                      <Input placeholder="ej: persona@correo.com" value={invitationForm.email} onChange={(e) => handleInvitationField("email")(e.target.value)} />
                    </FormControl>
                    <FormControl>
                      <FormLabel>Rol asignado</FormLabel>
                      <Select value={invitationForm.role} onChange={(e) => handleInvitationField("role")(e.target.value)}>
                        <option value="user">Usuario</option>
                        <option value="admin">Admin</option>
                      </Select>
                    </FormControl>
                    <FormControl>
                      <FormLabel>Usos permitidos</FormLabel>
                      <NumberInput min={1} max={10} value={invitationForm.maxUses} onChange={(_, valueAsNumber) => handleInvitationField("maxUses")(valueAsNumber)}>
                        <NumberInputField />
                        <NumberInputStepper>
                          <NumberIncrementStepper />
                          <NumberDecrementStepper />
                        </NumberInputStepper>
                      </NumberInput>
                    </FormControl>
                    <FormControl>
                      <FormLabel>Expira</FormLabel>
                      <Input type="datetime-local" value={invitationForm.expiresAt} onChange={(e) => handleInvitationField("expiresAt")(e.target.value)} />
                    </FormControl>
                    <Button type="submit" colorScheme="blue" isLoading={creating} leftIcon={<Icon as={BsLightningCharge} />}>
                      Generar código
                    </Button>
                  </Stack>
                </Box>

                <Box>
                  <Flex justify="space-between" align="center" mb={4}>
                    <HStack spacing={3}>
                      <Icon as={FiShield} color={accentColor} boxSize={6} />
                      <Heading size="sm">Invitaciones creadas</Heading>
                    </HStack>
                    <Tooltip label="Actualizar">
                      <IconButton icon={<FiRefreshCw />} aria-label="Refrescar" variant="ghost" onClick={fetchInvitations} isLoading={loadingInvitations} />
                    </Tooltip>
                  </Flex>
                  <Stack spacing={4}>
                    {invitationCards}
                  </Stack>
                </Box>
              </Stack>
            </CardBody>
          </Collapse>
        </Card>
      ) : (
        <Card bg={cardBg} borderColor={borderColor} borderWidth="1px">
          <CardHeader>
            <Heading size="md">Invitaciones</Heading>
          </CardHeader>
          <CardBody>
            <Text color="gray.500">
              Solo los administradores pueden generar nuevos accesos. Si necesitas invitar a alguien, contacta a un administrador del equipo.
            </Text>
          </CardBody>
        </Card>
      )}

      <PerfilesPinturaSection />
    </Box>
  );
};

const PrecioPinturaGlobalSection = () => {
  const { config, loading } = useConfiguracion();
  const { rawsMaterialData } = useItemsMateriasPrimas(100, { fetchAll: true });
  const toast = useToast();
  const cardBg = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.700");
  const { isOpen: isAlertOpen, onOpen: onAlertOpen, onClose: onAlertClose } = useDisclosure();
  const cancelRef = useRef();

  const [selectedMpId, setSelectedMpId] = useState("");
  const [precio, setPrecio] = useState("");
  const [saving, setSaving] = useState(false);
  const [applying, setApplying] = useState(false);

  // Materias primas de tipo Pintura al Horno
  const mpsPintura = rawsMaterialData.filter(
    (mp) => mp.categoria === "Proteccion" && mp.type === "Pintura al Horno"
  );

  // Inicializar desde config cuando carga
  useEffect(() => {
    if (loading) return;
    const mpId = config?.materiaPrimaPinturaId?._id ?? config?.materiaPrimaPinturaId ?? "";
    setSelectedMpId(mpId?.toString() ?? "");
    setPrecio((config?.precioPinturaM2 ?? 15000).toString());
  }, [config, loading]);

  // Al seleccionar una MP, auto-llenar el precio
  const handleSelectMp = (id) => {
    setSelectedMpId(id);
    if (!id) return;
    const mp = mpsPintura.find((m) => m._id === id);
    if (mp?.precio) setPrecio(mp.precio.toString());
  };

  const handleSave = async () => {
    const num = parseFloat(precio);
    if (!num || num <= 0) {
      toast({ status: "warning", title: "Ingresá un precio válido mayor a 0" });
      return;
    }
    try {
      setSaving(true);
      await updateConfiguracion({
        precioPinturaM2: num,
        materiaPrimaPinturaId: selectedMpId || null,
      });
      toast({ status: "success", title: "Configuración guardada", duration: 2000 });
    } catch {
      toast({ status: "error", title: "No se pudo guardar" });
    } finally {
      setSaving(false);
    }
  };

  const handleAplicarATodas = async () => {
    const num = parseFloat(precio);
    if (!num || num <= 0) {
      toast({ status: "warning", title: "Ingresá un precio válido mayor a 0" });
      return;
    }
    try {
      setApplying(true);
      await updateConfiguracion({ precioPinturaM2: num, materiaPrimaPinturaId: selectedMpId || null });
      const { data } = await aplicarPrecioPinturaATodas(num);
      toast({
        status: "success",
        title: `Precio aplicado a ${data.modificadas} plantilla${data.modificadas !== 1 ? "s" : ""}`,
        duration: 3000,
      });
    } catch {
      toast({ status: "error", title: "No se pudo aplicar el precio" });
    } finally {
      setApplying(false);
      onAlertClose();
    }
  };

  return (
    <Card bg={cardBg} borderColor={borderColor} borderWidth="1px" mb={6}>
      <CardHeader pb={2}>
        <Heading size="sm">🔥 Precio global — Pintura al Horno ($/m²)</Heading>
      </CardHeader>
      <CardBody pt={2}>
        <Text fontSize="sm" color="gray.500" mb={4}>
          Vinculá el precio a una materia prima: se usará su precio actual cada vez que se abra una plantilla, sin necesidad de actualizar plantilla por plantilla.
        </Text>
        <Stack spacing={3}>
          <HStack spacing={3} align="flex-end" flexWrap="wrap">
            <FormControl flex="2" minW="220px">
              <FormLabel fontSize="sm">Materia prima vinculada</FormLabel>
              <Select
                size="sm"
                value={selectedMpId}
                onChange={(e) => handleSelectMp(e.target.value)}
                placeholder="Sin vincular (precio manual)"
              >
                {mpsPintura.map((mp) => (
                  <option key={mp._id} value={mp._id}>
                    {mp.nombre || `${mp.categoria} — ${mp.type}`} (${Number(mp.precio).toLocaleString("es-AR")}/m²)
                  </option>
                ))}
              </Select>
            </FormControl>
            <FormControl maxW="160px">
              <FormLabel fontSize="sm">Precio por m²</FormLabel>
              <Input
                type="number"
                value={precio}
                onChange={(e) => setPrecio(e.target.value)}
                placeholder="15000"
                size="sm"
                isReadOnly={!!selectedMpId}
                bg={selectedMpId ? "gray.100" : undefined}
                _dark={{ bg: selectedMpId ? "gray.700" : undefined }}
                title={selectedMpId ? "El precio viene de la materia prima vinculada" : ""}
              />
            </FormControl>
          </HStack>
          <HStack spacing={3}>
            <Button size="sm" colorScheme="teal" onClick={handleSave} isLoading={saving}>
              Guardar
            </Button>
            <Button size="sm" colorScheme="orange" variant="outline" onClick={onAlertOpen}>
              Aplicar a todas las plantillas
            </Button>
          </HStack>
        </Stack>
      </CardBody>

      <AlertDialog isOpen={isAlertOpen} leastDestructiveRef={cancelRef} onClose={onAlertClose}>
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              Aplicar precio a todas las plantillas
            </AlertDialogHeader>
            <AlertDialogBody>
              Se escribirá <strong>${parseFloat(precio || 0).toLocaleString("es-AR")}/m²</strong> en todas las plantillas existentes.
              {selectedMpId && (
                <Text mt={2} fontSize="sm" color="gray.500">
                  Las plantillas también cargarán el precio actualizado automáticamente cada vez que las abras, gracias a la materia prima vinculada.
                </Text>
              )}
            </AlertDialogBody>
            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={onAlertClose}>Cancelar</Button>
              <Button colorScheme="orange" onClick={handleAplicarATodas} isLoading={applying} ml={3}>
                Aplicar a todas
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </Card>
  );
};

const TIPO_OPTIONS = [
  { value: "cuadrado", label: "Cuadrado" },
  { value: "rectangular", label: "Rectangular" },
  { value: "redondo", label: "Redondo" },
  { value: "L", label: "Ángulo" },
  { value: "planchuela", label: "Planchuela" },
  { value: "tee", label: "Tee" },
  { value: "cuadMacizo", label: "Cuadrado Macizo" },
  { value: "redMacizo", label: "Redondo Macizo" },
];

const emptyForm = { nombre: "", tipo: "cuadrado", perimetro: "" };

const PerfilesPinturaSection = () => {
  const { perfiles, loading, refetch } = usePerfilesPintura();
  const toast = useToast();
  const { isOpen, onToggle } = useDisclosure();
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState(emptyForm);
  const cardBg = useColorModeValue("white", "gray.800");

  const handleAdd = async () => {
    if (!form.nombre.trim() || !form.perimetro) return;
    setSaving(true);
    try {
      await createPerfilPintura({ nombre: form.nombre.trim(), tipo: form.tipo, perimetro: parseFloat(form.perimetro) });
      toast({ title: "Perfil agregado", status: "success", duration: 2000, isClosable: true });
      setForm(emptyForm);
      refetch();
    } catch {
      toast({ title: "Error al agregar perfil", status: "error", duration: 2000, isClosable: true });
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (perfil) => {
    setEditingId(perfil._id);
    setEditForm({ nombre: perfil.nombre, tipo: perfil.tipo, perimetro: perfil.perimetro });
  };

  const handleSaveEdit = async (id) => {
    setSaving(true);
    try {
      await updatePerfilPintura(id, { nombre: editForm.nombre.trim(), tipo: editForm.tipo, perimetro: parseFloat(editForm.perimetro) });
      toast({ title: "Perfil actualizado", status: "success", duration: 2000, isClosable: true });
      setEditingId(null);
      refetch();
    } catch {
      toast({ title: "Error al actualizar perfil", status: "error", duration: 2000, isClosable: true });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await deletePerfilPintura(id);
      toast({ title: "Perfil eliminado", status: "success", duration: 2000, isClosable: true });
      refetch();
    } catch {
      toast({ title: "Error al eliminar perfil", status: "error", duration: 2000, isClosable: true });
    }
  };

  return (
    <Card bg={cardBg}>
      <CardHeader>
        <HStack justify="space-between">
          <HStack spacing={2}>
            <Heading size="md">🔥 Perfiles de Pintura al Horno</Heading>
          </HStack>
          <IconButton
            icon={isOpen ? <ChevronUpIcon /> : <ChevronDownIcon />}
            variant="ghost"
            onClick={onToggle}
            aria-label="Expandir"
          />
        </HStack>
      </CardHeader>
      <Collapse in={isOpen}>
        <CardBody>
          <Stack spacing={4}>
            {/* Formulario agregar */}
            <Box p={3} border="1px" borderColor="orange.200" borderRadius="md">
              <Text fontWeight="semibold" mb={3} fontSize="sm">Agregar perfil</Text>
              <Stack direction={{ base: "column", md: "row" }} spacing={3} align="flex-end">
                <FormControl flex="3">
                  <FormLabel fontSize="sm">Nombre</FormLabel>
                  <Input size="sm" placeholder="CAÑO 40×40" value={form.nombre} onChange={(e) => setForm((f) => ({ ...f, nombre: e.target.value }))} />
                </FormControl>
                <FormControl flex="2">
                  <FormLabel fontSize="sm">Tipo</FormLabel>
                  <Select size="sm" value={form.tipo} onChange={(e) => setForm((f) => ({ ...f, tipo: e.target.value }))}>
                    {TIPO_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </Select>
                </FormControl>
                <FormControl flex="2">
                  <FormLabel fontSize="sm">Perímetro (m/m lineal)</FormLabel>
                  <Input size="sm" type="number" step="0.001" placeholder="0.16" value={form.perimetro} onChange={(e) => setForm((f) => ({ ...f, perimetro: e.target.value }))} />
                </FormControl>
                <Button size="sm" colorScheme="orange" onClick={handleAdd} isLoading={saving} isDisabled={!form.nombre.trim() || !form.perimetro}>
                  Agregar
                </Button>
              </Stack>
            </Box>

            {/* Lista de perfiles agrupados por tipo */}
            {loading ? (
              <Text fontSize="sm" color="gray.500">Cargando perfiles...</Text>
            ) : perfiles.length === 0 ? (
              <Text fontSize="sm" color="gray.400">No hay perfiles cargados.</Text>
            ) : (
              <Stack spacing={2}>
                {TIPO_OPTIONS.map(({ value: tipo, label }) => {
                  const grupo = perfiles.filter((p) => p.tipo === tipo);
                  if (grupo.length === 0) return null;
                  return (
                    <GrupoPerfil
                      key={tipo}
                      label={label}
                      perfiles={grupo}
                      editingId={editingId}
                      editForm={editForm}
                      saving={saving}
                      onEdit={handleEdit}
                      onSaveEdit={handleSaveEdit}
                      onDelete={handleDelete}
                      onCancelEdit={() => setEditingId(null)}
                      setEditForm={setEditForm}
                    />
                  );
                })}
              </Stack>
            )}
          </Stack>
        </CardBody>
      </Collapse>
    </Card>
  );
};

const GrupoPerfil = ({ label, perfiles, editingId, editForm, saving, onEdit, onSaveEdit, onDelete, onCancelEdit, setEditForm }) => {
  const { isOpen, onToggle } = useDisclosure({ defaultIsOpen: false });
  const borderColor = useColorModeValue("gray.200", "gray.600");

  return (
    <Box border="1px" borderColor={borderColor} borderRadius="md" overflow="hidden">
      <HStack
        px={3} py={2}
        justify="space-between"
        cursor="pointer"
        onClick={onToggle}
        _hover={{ bg: useColorModeValue("gray.50", "gray.700") }}
      >
        <HStack spacing={2}>
          <Text fontSize="sm" fontWeight="semibold">{label}</Text>
          <Badge colorScheme="orange" fontSize="xs">{perfiles.length}</Badge>
        </HStack>
        {isOpen ? <ChevronUpIcon /> : <ChevronDownIcon />}
      </HStack>
      <Collapse in={isOpen}>
        <Stack spacing={1} px={2} pb={2}>
          {perfiles.map((p) => (
            <Box key={p._id} p={2} borderRadius="md" bg={useColorModeValue("gray.50", "gray.700")}>
              {editingId === p._id ? (
                <Stack direction={{ base: "column", md: "row" }} spacing={2} align="flex-end">
                  <Input size="sm" value={editForm.nombre} onChange={(e) => setEditForm((f) => ({ ...f, nombre: e.target.value }))} />
                  <Select size="sm" value={editForm.tipo} onChange={(e) => setEditForm((f) => ({ ...f, tipo: e.target.value }))}>
                    {TIPO_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </Select>
                  <Input size="sm" type="number" step="0.001" value={editForm.perimetro} onChange={(e) => setEditForm((f) => ({ ...f, perimetro: e.target.value }))} w="100px" />
                  <HStack>
                    <IconButton icon={<FiCheck />} size="sm" colorScheme="green" onClick={() => onSaveEdit(p._id)} isLoading={saving} aria-label="Guardar" />
                    <IconButton icon={<FiX />} size="sm" onClick={onCancelEdit} aria-label="Cancelar" />
                  </HStack>
                </Stack>
              ) : (
                <HStack justify="space-between">
                  <HStack spacing={3}>
                    <Text fontSize="sm" fontWeight="semibold">{p.nombre}</Text>
                    <Text fontSize="sm" color="gray.500">{p.perimetro} m/m</Text>
                  </HStack>
                  <HStack>
                    <IconButton icon={<FiEdit2 />} size="xs" variant="ghost" onClick={() => onEdit(p)} aria-label="Editar" />
                    <IconButton icon={<FiTrash2 />} size="xs" colorScheme="red" variant="ghost" onClick={() => onDelete(p._id)} aria-label="Eliminar" />
                  </HStack>
                </HStack>
              )}
            </Box>
          ))}
        </Stack>
      </Collapse>
    </Box>
  );
};
