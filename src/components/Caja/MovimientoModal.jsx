import { useEffect, useMemo, useState } from "react";
import {
  Button,
  ButtonGroup,
  FormControl,
  FormLabel,
  Input,
  InputGroup,
  InputLeftAddon,
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
  useToast,
} from "@chakra-ui/react";
import { createMovimientoCaja, updateMovimientoCaja } from "../../services/caja.service.js";
import { fechaInput, getApiError, hoyISO } from "../../constants/caja.js";

const TIPOS = [
  { value: "egreso", label: "Gasto", scheme: "red" },
  { value: "ingreso", label: "Ingreso", scheme: "green" },
  { value: "transferencia", label: "Transferencia", scheme: "blue" },
];

const buildForm = (movimiento, tipoInicial, cuentas) => ({
  tipo: movimiento?.tipo ?? tipoInicial ?? "egreso",
  monto: movimiento?.monto != null ? String(movimiento.monto) : "",
  cuenta: movimiento?.cuenta?._id ?? movimiento?.cuenta ?? cuentas[0]?._id ?? "",
  cuentaDestino: movimiento?.cuentaDestino?._id ?? movimiento?.cuentaDestino ?? "",
  categoria: movimiento?.categoria?._id ?? movimiento?.categoria ?? "",
  fecha: movimiento?.fecha ? fechaInput(movimiento.fecha) : hoyISO(),
  descripcion: movimiento?.descripcion ?? "",
});

export const MovimientoModal = ({ isOpen, onClose, movimiento, tipoInicial, cuentas = [], categorias = [], onSaved }) => {
  const toast = useToast();
  const [form, setForm] = useState(() => buildForm(movimiento, tipoInicial, cuentas));
  const [saving, setSaving] = useState(false);
  const editando = Boolean(movimiento?._id);
  // Lo importado de Mercado Pago es real: solo se edita categoría y descripción.
  const importado = Boolean(movimiento?.origen?.mpPaymentId);

  useEffect(() => {
    if (isOpen) setForm(buildForm(movimiento, tipoInicial, cuentas));
    // Solo al abrir: no pisar lo que el usuario está escribiendo.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, movimiento, tipoInicial]);

  const categoriasDelTipo = useMemo(
    () => categorias.filter((c) => c.tipo === form.tipo),
    [categorias, form.tipo]
  );

  const set = (campo) => (e) => setForm((f) => ({ ...f, [campo]: e.target.value }));

  const cambiarTipo = (tipo) =>
    setForm((f) => ({
      ...f,
      tipo,
      // La categoría depende del tipo (ingreso/egreso): al cambiarlo se limpia.
      categoria: "",
      cuentaDestino: tipo === "transferencia" ? cuentas.find((c) => c._id !== f.cuenta)?._id ?? "" : "",
    }));

  const handleSave = async () => {
    const monto = Number(String(form.monto).replace(",", "."));
    if (!(monto > 0)) {
      toast({ status: "warning", title: "Ingresá un monto mayor a cero" });
      return;
    }
    if (!form.cuenta) {
      toast({ status: "warning", title: "Elegí una cuenta" });
      return;
    }
    if (form.tipo === "transferencia" && (!form.cuentaDestino || form.cuentaDestino === form.cuenta)) {
      toast({ status: "warning", title: "Elegí una cuenta de destino distinta" });
      return;
    }
    const payload = {
      tipo: form.tipo,
      monto,
      cuenta: form.cuenta,
      cuentaDestino: form.tipo === "transferencia" ? form.cuentaDestino : null,
      categoria: form.tipo === "transferencia" ? null : form.categoria || null,
      fecha: form.fecha,
      descripcion: form.descripcion.trim(),
    };
    setSaving(true);
    try {
      if (editando) await updateMovimientoCaja(movimiento._id, payload);
      else await createMovimientoCaja(payload);
      toast({ status: "success", title: editando ? "Movimiento actualizado" : "Movimiento registrado", duration: 1500 });
      onSaved?.();
      onClose();
    } catch (error) {
      toast({ status: "error", title: "No se pudo guardar", description: getApiError(error) });
    } finally {
      setSaving(false);
    }
  };

  const tipoActual = TIPOS.find((t) => t.value === form.tipo) ?? TIPOS[0];
  // Los ingresos y gastos de Mercado Pago entran solos: cargarlos a mano los duplica.
  const cuentaElegida = cuentas.find((c) => c._id === form.cuenta);
  const avisoMercadoPago =
    !importado &&
    form.tipo !== "transferencia" &&
    cuentaElegida?.integracion === "mercadopago";

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg" initialFocusRef={undefined}>
      <ModalOverlay />
      <ModalContent mx={4}>
        <ModalHeader fontFamily="heading">{editando ? "Editar movimiento" : "Nuevo movimiento"}</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <Stack spacing={4}>
            {importado && (
              <Text fontSize="sm" color="blue.400">
                Importado de Mercado Pago: podés cambiar la categoría y la descripción.
              </Text>
            )}
            <ButtonGroup isAttached size="sm" w="100%" isDisabled={importado}>
              {TIPOS.map((t) => (
                <Button
                  key={t.value}
                  flex="1"
                  colorScheme={form.tipo === t.value ? t.scheme : "gray"}
                  variant={form.tipo === t.value ? "solid" : "outline"}
                  onClick={() => cambiarTipo(t.value)}
                >
                  {t.label}
                </Button>
              ))}
            </ButtonGroup>

            <SimpleGrid columns={{ base: 1, sm: 2 }} spacing={4}>
              <FormControl isRequired>
                <FormLabel>Monto</FormLabel>
                <InputGroup>
                  <InputLeftAddon>$</InputLeftAddon>
                  <Input
                    type="number"
                    inputMode="decimal"
                    min={0}
                    value={form.monto}
                    onChange={set("monto")}
                    placeholder="0"
                    autoFocus={!importado}
                    isDisabled={importado}
                    className="tnum"
                  />
                </InputGroup>
              </FormControl>
              <FormControl isRequired>
                <FormLabel>Fecha</FormLabel>
                <Input type="date" value={form.fecha} onChange={set("fecha")} isDisabled={importado} />
              </FormControl>
            </SimpleGrid>

            <SimpleGrid columns={{ base: 1, sm: 2 }} spacing={4}>
              <FormControl isRequired>
                <FormLabel>{form.tipo === "transferencia" ? "Desde" : form.tipo === "ingreso" ? "Entró en" : "Salió de"}</FormLabel>
                <Select value={form.cuenta} onChange={set("cuenta")} isDisabled={importado}>
                  {cuentas.map((c) => <option key={c._id} value={c._id}>{c.nombre}</option>)}
                </Select>
              </FormControl>
              {form.tipo === "transferencia" ? (
                <FormControl isRequired>
                  <FormLabel>Hacia</FormLabel>
                  <Select value={form.cuentaDestino} onChange={set("cuentaDestino")} placeholder="Elegí la cuenta">
                    {cuentas.filter((c) => c._id !== form.cuenta).map((c) => (
                      <option key={c._id} value={c._id}>{c.nombre}</option>
                    ))}
                  </Select>
                </FormControl>
              ) : (
                <FormControl>
                  <FormLabel>Categoría</FormLabel>
                  <Select value={form.categoria} onChange={set("categoria")} placeholder="Sin categoría">
                    {categoriasDelTipo.map((c) => <option key={c._id} value={c._id}>{c.nombre}</option>)}
                  </Select>
                </FormControl>
              )}
            </SimpleGrid>

            {avisoMercadoPago && (
              <Text fontSize="sm" color="orange.400">
                Ojo: los movimientos de Mercado Pago se importan solos. Si cargás este a mano, va a aparecer
                dos veces. Usalo solo para algo que Mercado Pago no informa.
              </Text>
            )}

            <FormControl>
              <FormLabel>Descripción</FormLabel>
              <Input
                value={form.descripcion}
                onChange={set("descripcion")}
                placeholder={form.tipo === "egreso" ? "Ej: Nafta para el flete" : form.tipo === "ingreso" ? "Ej: Venta de chatarra" : "Ej: Retiro para pagar proveedores"}
                maxLength={500}
              />
            </FormControl>
          </Stack>
        </ModalBody>
        <ModalFooter gap={2}>
          <Button variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button colorScheme={tipoActual.scheme} onClick={handleSave} isLoading={saving}>
            {editando ? "Guardar" : `Registrar ${tipoActual.label.toLowerCase()}`}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};
