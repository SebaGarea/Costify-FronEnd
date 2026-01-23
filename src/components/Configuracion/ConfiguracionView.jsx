import { useEffect, useMemo, useState } from "react";
import {
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
    </Box>
  );
};
