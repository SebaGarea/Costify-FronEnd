import { useState } from "react";
import {
  Badge,
  Box,
  Button,
  Flex,
  FormControl,
  FormHelperText,
  FormLabel,
  Heading,
  HStack,
  IconButton,
  Input,
  InputGroup,
  InputLeftAddon,
  Select,
  SimpleGrid,
  Stack,
  Switch,
  Text,
  Tooltip,
  useColorModeValue,
  useToast,
} from "@chakra-ui/react";
import { AddIcon, CheckIcon, DeleteIcon, EditIcon } from "@chakra-ui/icons";
import {
  createCategoriaCaja,
  createCuentaCaja,
  deleteCategoriaCaja,
  updateCategoriaCaja,
  updateCuentaCaja,
} from "../../services/caja.service.js";
import { COLORES, TIPOS_CUENTA, fechaInput, formatMoney, getApiError, hoyISO } from "../../constants/caja.js";

const CuentaRow = ({ cuenta, onChanged }) => {
  const toast = useToast();
  const border = useColorModeValue("gray.200", "gray.700");
  const muted = useColorModeValue("gray.600", "gray.400");
  const [editando, setEditando] = useState(false);
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);

  const empezar = () => {
    setForm({
      nombre: cuenta.nombre,
      tipo: cuenta.tipo,
      esDigital: cuenta.esDigital,
      saldoInicial: String(cuenta.saldoInicial ?? 0),
      fechaSaldoInicial: fechaInput(cuenta.fechaSaldoInicial) || hoyISO(),
      color: cuenta.color || "teal",
    });
    setEditando(true);
  };

  const guardar = async (cambios) => {
    setSaving(true);
    try {
      await updateCuentaCaja(cuenta._id, cambios);
      toast({ status: "success", title: "Cuenta actualizada", duration: 1500 });
      setEditando(false);
      onChanged?.();
    } catch (error) {
      toast({ status: "error", title: "No se pudo guardar", description: getApiError(error) });
    } finally {
      setSaving(false);
    }
  };

  if (editando && form) {
    return (
      <Box p={4} borderWidth="1px" borderColor={border} borderRadius="lg">
        <SimpleGrid columns={{ base: 1, md: 3 }} spacing={3}>
          <FormControl>
            <FormLabel fontSize="sm">Nombre</FormLabel>
            <Input size="sm" value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} />
          </FormControl>
          <FormControl>
            <FormLabel fontSize="sm">Tipo</FormLabel>
            <Select size="sm" value={form.tipo} onChange={(e) => setForm({ ...form, tipo: e.target.value, esDigital: e.target.value !== "efectivo" })}>
              {TIPOS_CUENTA.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </Select>
          </FormControl>
          <FormControl>
            <FormLabel fontSize="sm">Color</FormLabel>
            <Select size="sm" value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })}>
              {COLORES.map((c) => <option key={c} value={c}>{c}</option>)}
            </Select>
          </FormControl>
          <FormControl>
            <FormLabel fontSize="sm">Saldo inicial</FormLabel>
            <InputGroup size="sm">
              <InputLeftAddon>$</InputLeftAddon>
              <Input type="number" value={form.saldoInicial} onChange={(e) => setForm({ ...form, saldoInicial: e.target.value })} />
            </InputGroup>
          </FormControl>
          <FormControl>
            <FormLabel fontSize="sm">Al inicio del día</FormLabel>
            <Input size="sm" type="date" value={form.fechaSaldoInicial} onChange={(e) => setForm({ ...form, fechaSaldoInicial: e.target.value })} />
          </FormControl>
          <FormControl display="flex" alignItems="center" mt={{ md: 6 }}>
            <Switch id={`digital-${cuenta._id}`} isChecked={form.esDigital} onChange={(e) => setForm({ ...form, esDigital: e.target.checked })} mr={2} />
            <FormLabel htmlFor={`digital-${cuenta._id}`} fontSize="sm" mb={0}>Cuenta como dinero digital</FormLabel>
          </FormControl>
        </SimpleGrid>
        <Text fontSize="xs" color={muted} mt={2}>
          El saldo se calcula desde el saldo inicial más los movimientos desde esa fecha.
        </Text>
        <HStack justify="flex-end" mt={3}>
          <Button size="sm" variant="ghost" onClick={() => setEditando(false)}>Cancelar</Button>
          <Button
            size="sm"
            colorScheme="teal"
            isLoading={saving}
            onClick={() => guardar({ ...form, saldoInicial: Number(form.saldoInicial) || 0 })}
          >
            Guardar
          </Button>
        </HStack>
      </Box>
    );
  }

  return (
    <Flex p={3} borderWidth="1px" borderColor={border} borderRadius="lg" align="center" gap={3} opacity={cuenta.activa ? 1 : 0.6}>
      <Box w={3} h={3} borderRadius="full" bg={`${cuenta.color || "teal"}.400`} flexShrink={0} />
      <Box flex="1" minW={0}>
        <HStack spacing={2} flexWrap="wrap">
          <Text fontWeight="semibold">{cuenta.nombre}</Text>
          <Badge variant="subtle" colorScheme={cuenta.esDigital ? "blue" : "green"} textTransform="none">
            {cuenta.esDigital ? "Digital" : "Efectivo"}
          </Badge>
          {cuenta.integracion === "mercadopago" && (
            <Badge colorScheme="blue" textTransform="none">Se importa solo</Badge>
          )}
          {!cuenta.activa && <Badge textTransform="none">Archivada</Badge>}
        </HStack>
        <Text fontSize="sm" color={muted} className="tnum">
          Saldo {formatMoney(cuenta.saldo)} · inicial {formatMoney(cuenta.saldoInicial)}
        </Text>
      </Box>
      <HStack spacing={1}>
        <Tooltip label="Editar" hasArrow>
          <IconButton aria-label="Editar cuenta" icon={<EditIcon />} size="sm" variant="ghost" onClick={empezar} />
        </Tooltip>
        <Button size="xs" variant="ghost" isLoading={saving} onClick={() => guardar({ activa: !cuenta.activa })}>
          {cuenta.activa ? "Archivar" : "Reactivar"}
        </Button>
      </HStack>
    </Flex>
  );
};

const CategoriaRow = ({ categoria, onChanged }) => {
  const toast = useToast();
  const border = useColorModeValue("gray.200", "gray.700");
  const [editando, setEditando] = useState(false);
  const [nombre, setNombre] = useState(categoria.nombre);

  const run = async (fn, ok) => {
    try {
      const res = await fn();
      toast({ status: "success", title: ok(res), duration: 1500 });
      setEditando(false);
      onChanged?.();
    } catch (error) {
      toast({ status: "error", title: "No se pudo guardar", description: getApiError(error) });
    }
  };

  return (
    <Flex px={3} py={2} borderWidth="1px" borderColor={border} borderRadius="md" align="center" gap={2} opacity={categoria.activa ? 1 : 0.6}>
      <Box w={2.5} h={2.5} borderRadius="full" bg={`${categoria.color || "gray"}.400`} flexShrink={0} />
      {editando ? (
        <Input size="xs" value={nombre} onChange={(e) => setNombre(e.target.value)} autoFocus flex="1" />
      ) : (
        <Text fontSize="sm" flex="1" noOfLines={1}>
          {categoria.nombre}
          {categoria.sistema && <Badge ml={2} fontSize="2xs" textTransform="none">sistema</Badge>}
          {!categoria.activa && <Badge ml={2} fontSize="2xs" textTransform="none">archivada</Badge>}
        </Text>
      )}
      {editando ? (
        <IconButton
          aria-label="Guardar categoría"
          icon={<CheckIcon />}
          size="xs"
          colorScheme="teal"
          onClick={() => run(() => updateCategoriaCaja(categoria._id, { nombre }), () => "Categoría actualizada")}
        />
      ) : (
        <IconButton aria-label="Renombrar categoría" icon={<EditIcon />} size="xs" variant="ghost" onClick={() => setEditando(true)} />
      )}
      {!categoria.sistema && (
        categoria.activa ? (
          <Tooltip label="Si tiene movimientos se archiva en vez de borrarse" hasArrow>
            <IconButton
              aria-label="Eliminar categoría"
              icon={<DeleteIcon />}
              size="xs"
              variant="ghost"
              colorScheme="red"
              onClick={() =>
                run(
                  () => deleteCategoriaCaja(categoria._id),
                  (res) => (res?.data?.archivada ? "Categoría archivada (tiene movimientos)" : "Categoría eliminada")
                )
              }
            />
          </Tooltip>
        ) : (
          <Button size="xs" variant="ghost" onClick={() => run(() => updateCategoriaCaja(categoria._id, { activa: true }), () => "Categoría reactivada")}>
            Reactivar
          </Button>
        )
      )}
    </Flex>
  );
};

export const CuentasCategoriasPanel = ({ cuentas = [], categorias = [], onChanged }) => {
  const toast = useToast();
  const cardBg = useColorModeValue("white", "gray.800");
  const border = useColorModeValue("gray.200", "gray.700");
  const muted = useColorModeValue("gray.600", "gray.400");
  const [nuevaCuenta, setNuevaCuenta] = useState({ nombre: "", tipo: "billetera", saldoInicial: "" });
  const [nuevaCategoria, setNuevaCategoria] = useState({ nombre: "", tipo: "egreso" });

  const crearCuenta = async () => {
    if (!nuevaCuenta.nombre.trim()) return;
    try {
      await createCuentaCaja({ ...nuevaCuenta, saldoInicial: Number(nuevaCuenta.saldoInicial) || 0, fechaSaldoInicial: hoyISO() });
      setNuevaCuenta({ nombre: "", tipo: "billetera", saldoInicial: "" });
      toast({ status: "success", title: "Cuenta creada", duration: 1500 });
      onChanged?.();
    } catch (error) {
      toast({ status: "error", title: "No se pudo crear la cuenta", description: getApiError(error) });
    }
  };

  const crearCategoria = async () => {
    if (!nuevaCategoria.nombre.trim()) return;
    try {
      await createCategoriaCaja({ ...nuevaCategoria, color: COLORES[categorias.length % COLORES.length] });
      setNuevaCategoria({ nombre: "", tipo: nuevaCategoria.tipo });
      toast({ status: "success", title: "Categoría creada", duration: 1500 });
      onChanged?.();
    } catch (error) {
      toast({ status: "error", title: "No se pudo crear la categoría", description: getApiError(error) });
    }
  };

  return (
    <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={6} alignItems="start">
      <Box p={5} borderRadius="xl" bg={cardBg} borderWidth="1px" borderColor={border}>
        <Heading size="sm" mb={1} fontFamily="heading">Cuentas</Heading>
        <Text fontSize="sm" color={muted} mb={4}>
          Cargá el saldo inicial de cada una. Las digitales se suman en "Dinero digital" de la lista de compras.
        </Text>
        <Stack spacing={2} mb={5}>
          {cuentas.map((c) => (
            <CuentaRow key={c._id} cuenta={c} onChanged={onChanged} />
          ))}
        </Stack>

        <Text fontSize="sm" fontWeight="semibold" mb={2}>Nueva cuenta</Text>
        <Flex gap={2} flexWrap="wrap">
          <Input size="sm" flex="2" minW="140px" placeholder="Ej: Banco Galicia" value={nuevaCuenta.nombre} onChange={(e) => setNuevaCuenta({ ...nuevaCuenta, nombre: e.target.value })} />
          <Select size="sm" flex="1" minW="120px" value={nuevaCuenta.tipo} onChange={(e) => setNuevaCuenta({ ...nuevaCuenta, tipo: e.target.value })}>
            {TIPOS_CUENTA.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
          </Select>
          <InputGroup size="sm" flex="1" minW="120px">
            <InputLeftAddon>$</InputLeftAddon>
            <Input type="number" placeholder="Saldo hoy" value={nuevaCuenta.saldoInicial} onChange={(e) => setNuevaCuenta({ ...nuevaCuenta, saldoInicial: e.target.value })} />
          </InputGroup>
          <Button size="sm" leftIcon={<AddIcon />} colorScheme="teal" onClick={crearCuenta} isDisabled={!nuevaCuenta.nombre.trim()}>
            Agregar
          </Button>
        </Flex>
      </Box>

      <Box p={5} borderRadius="xl" bg={cardBg} borderWidth="1px" borderColor={border}>
        <Heading size="sm" mb={4} fontFamily="heading">Categorías</Heading>
        {["egreso", "ingreso"].map((tipo) => (
          <Box key={tipo} mb={5}>
            <Text fontSize="sm" fontWeight="semibold" color={muted} mb={2}>
              {tipo === "egreso" ? "Gastos" : "Ingresos"}
            </Text>
            <Stack spacing={1.5}>
              {categorias.filter((c) => c.tipo === tipo).map((c) => (
                <CategoriaRow key={c._id} categoria={c} onChanged={onChanged} />
              ))}
            </Stack>
          </Box>
        ))}
        <Text fontSize="sm" fontWeight="semibold" mb={2}>Nueva categoría</Text>
        <Flex gap={2} flexWrap="wrap">
          <Input
            size="sm"
            flex="2"
            minW="140px"
            placeholder="Ej: Publicidad"
            value={nuevaCategoria.nombre}
            onChange={(e) => setNuevaCategoria({ ...nuevaCategoria, nombre: e.target.value })}
            onKeyDown={(e) => e.key === "Enter" && crearCategoria()}
          />
          <Select size="sm" flex="1" minW="110px" value={nuevaCategoria.tipo} onChange={(e) => setNuevaCategoria({ ...nuevaCategoria, tipo: e.target.value })}>
            <option value="egreso">Gasto</option>
            <option value="ingreso">Ingreso</option>
          </Select>
          <Button size="sm" leftIcon={<AddIcon />} colorScheme="teal" onClick={crearCategoria} isDisabled={!nuevaCategoria.nombre.trim()}>
            Agregar
          </Button>
        </Flex>
      </Box>
    </SimpleGrid>
  );
};
