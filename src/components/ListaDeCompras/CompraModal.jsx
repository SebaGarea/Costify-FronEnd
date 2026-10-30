import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  AlertIcon,
  Box,
  Button,
  Checkbox,
  Divider,
  Flex,
  FormControl,
  FormHelperText,
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
  useColorModeValue,
} from "@chakra-ui/react";
import { formatMoney, hoyISO } from "../../constants/caja.js";

// Modal "Registrar pago": arranca con los ítems tildados como comprados.
// Se elige con qué se pagó y el monto real (puede diferir de la lista).
// - Efectivo / Naranja X: el gasto se registra al momento.
// - Mercado Pago: se registra "esperando Mercado Pago" y se une con el pago
//   que traiga la sincronización por el mismo monto (sin duplicar).
export const CompraModal = ({
  isOpen,
  onClose,
  sections = [],
  sectionItems = {},
  getMaterialName,
  getLineTotal,
  getUnitPrice,
  cuentas = [],
  onConfirm,
  isSaving = false,
}) => {
  const muted = useColorModeValue("gray.600", "gray.400");
  const border = useColorModeValue("gray.200", "gray.700");
  const [seleccion, setSeleccion] = useState(() => new Set());
  const [cuenta, setCuenta] = useState("");
  const [fecha, setFecha] = useState(hoyISO());
  const [montoReal, setMontoReal] = useState("");
  const [montoEditado, setMontoEditado] = useState(false);

  const clave = (sectionKey, item, idx) => `${sectionKey}::${item?.id ?? idx}`;

  useEffect(() => {
    if (!isOpen) return;
    const comprados = new Set();
    sections.forEach((section) => {
      (sectionItems[section.key] ?? []).forEach((item, idx) => {
        if (item?.comprado) comprados.add(clave(section.key, item, idx));
      });
    });
    setSeleccion(comprados);
    setFecha(hoyISO());
    setMontoEditado(false);
    // Por defecto, la primera cuenta en efectivo (las compras suelen pagarse así).
    setCuenta((cuentas.find((c) => !c.esDigital) ?? cuentas[0])?._id ?? "");
    // Solo al abrir.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const seleccionados = useMemo(() => {
    const lista = [];
    sections.forEach((section) => {
      (sectionItems[section.key] ?? []).forEach((item, idx) => {
        if (seleccion.has(clave(section.key, item, idx))) lista.push({ section, item, idx });
      });
    });
    return lista;
  }, [sections, sectionItems, seleccion]);

  const totalLista = seleccionados.reduce((acc, { item }) => acc + (getLineTotal(item) || 0), 0);

  // Mientras no lo toquen, el monto real sigue al total de la lista.
  useEffect(() => {
    if (!montoEditado) setMontoReal(String(Math.round(totalLista)));
  }, [totalLista, montoEditado]);

  const monto = Number(String(montoReal).replace(",", "."));
  const cuentaElegida = cuentas.find((c) => c._id === cuenta);
  const esMercadoPago = cuentaElegida?.integracion === "mercadopago";

  const toggle = (k) =>
    setSeleccion((prev) => {
      const next = new Set(prev);
      if (next.has(k)) next.delete(k);
      else next.add(k);
      return next;
    });

  const toggleSeccion = (section, marcar) =>
    setSeleccion((prev) => {
      const next = new Set(prev);
      (sectionItems[section.key] ?? []).forEach((item, idx) => {
        const k = clave(section.key, item, idx);
        if (marcar) next.add(k);
        else next.delete(k);
      });
      return next;
    });

  const confirmar = () => {
    const items = seleccionados.map(({ section, item }) => ({
      nombre: getMaterialName(item),
      seccion: section.key,
      cantidad: Number(item.cantidad) || 0,
      precioUnitario: getUnitPrice(item) || 0,
      subtotal: getLineTotal(item) || 0,
    }));
    const quitar = {};
    seleccionados.forEach(({ section, item, idx }) => {
      quitar[section.key] = quitar[section.key] ?? new Set();
      quitar[section.key].add(item?.id ?? idx);
    });
    onConfirm?.({ cuenta, fecha, total: monto, items, quitar, esMercadoPago });
  };

  const seccionesConItems = sections.filter((s) => (sectionItems[s.key] ?? []).length > 0);

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl" scrollBehavior="inside">
      <ModalOverlay />
      <ModalContent mx={4}>
        <ModalHeader fontFamily="heading">Registrar pago</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <Text fontSize="sm" color={muted} mb={4}>
            Están marcados los ítems que tildaste como comprados. Se registra como gasto (Materiales) en la Caja y
            esos ítems salen de la lista.
          </Text>
          <Stack spacing={4}>
            {seccionesConItems.map((section) => {
              const items = sectionItems[section.key] ?? [];
              const marcados = items.filter((item, idx) => seleccion.has(clave(section.key, item, idx))).length;
              return (
                <Box key={section.key} borderWidth="1px" borderColor={border} borderRadius="lg" p={3}>
                  <Checkbox
                    fontWeight="semibold"
                    isChecked={marcados === items.length}
                    isIndeterminate={marcados > 0 && marcados < items.length}
                    onChange={(e) => toggleSeccion(section, e.target.checked)}
                    mb={2}
                  >
                    {section.title}
                  </Checkbox>
                  <Stack spacing={1.5} pl={6}>
                    {items.map((item, idx) => {
                      const k = clave(section.key, item, idx);
                      return (
                        <Flex key={k} align="center" gap={2}>
                          <Checkbox isChecked={seleccion.has(k)} onChange={() => toggle(k)} flex="1" minW={0}>
                            <Text fontSize="sm" noOfLines={1}>
                              {Number(item.cantidad) || 0} × {getMaterialName(item)}
                              {[item.medida, item.espesor].filter(Boolean).length > 0 && (
                                <Text as="span" color={muted}> · {[item.medida, item.espesor].filter(Boolean).join(" ")}</Text>
                              )}
                            </Text>
                          </Checkbox>
                          <Text fontSize="sm" className="tnum" whiteSpace="nowrap">{formatMoney(getLineTotal(item))}</Text>
                        </Flex>
                      );
                    })}
                  </Stack>
                </Box>
              );
            })}
            {seccionesConItems.length === 0 && (
              <Text fontSize="sm" color={muted}>La lista está vacía.</Text>
            )}
          </Stack>

          <Divider my={4} />
          <SimpleGrid columns={{ base: 1, sm: 3 }} spacing={4}>
            <FormControl isRequired>
              <FormLabel fontSize="sm">Pagado con</FormLabel>
              <Select size="sm" value={cuenta} onChange={(e) => setCuenta(e.target.value)}>
                {cuentas.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.nombre} ({formatMoney(c.saldo)})
                  </option>
                ))}
              </Select>
            </FormControl>
            <FormControl isRequired>
              <FormLabel fontSize="sm">Monto pagado</FormLabel>
              <InputGroup size="sm">
                <InputLeftAddon>$</InputLeftAddon>
                <Input
                  type="number"
                  inputMode="decimal"
                  value={montoReal}
                  onChange={(e) => {
                    setMontoReal(e.target.value);
                    setMontoEditado(true);
                  }}
                  className="tnum"
                />
              </InputGroup>
              {montoEditado && Math.abs(monto - totalLista) >= 1 && (
                <FormHelperText fontSize="xs">
                  Lista: {formatMoney(totalLista)}
                </FormHelperText>
              )}
            </FormControl>
            <FormControl isRequired>
              <FormLabel fontSize="sm">Fecha</FormLabel>
              <Input size="sm" type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} />
            </FormControl>
          </SimpleGrid>
          {esMercadoPago && (
            <Alert status="info" borderRadius="md" mt={4} fontSize="sm">
              <AlertIcon />
              Queda esperando a Mercado Pago: cuando se sincronice el pago por {formatMoney(monto)}, se unen en un solo
              gasto. Poné el monto exacto que pagaste.
            </Alert>
          )}
        </ModalBody>
        <ModalFooter gap={3} flexWrap="wrap">
          <Text fontSize="sm" color={muted} mr="auto">
            {seleccionados.length} ítems
          </Text>
          <Button variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button
            colorScheme="teal"
            onClick={confirmar}
            isLoading={isSaving}
            isDisabled={!seleccionados.length || !(monto > 0) || !cuenta}
          >
            Registrar pago de {formatMoney(monto)}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};
