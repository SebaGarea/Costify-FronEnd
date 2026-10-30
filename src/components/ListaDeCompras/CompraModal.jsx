import { useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  Checkbox,
  Divider,
  Flex,
  FormControl,
  FormLabel,
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
  useColorModeValue,
} from "@chakra-ui/react";
import { formatMoney, hoyISO } from "../../constants/caja.js";

// Modal "Compré esto": elegir qué ítems se compraron, con qué cuenta se pagó
// y la fecha. Al confirmar se registra el egreso en Caja y se sacan de la lista.
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

  const clave = (sectionKey, item, idx) => `${sectionKey}::${item?.id ?? idx}`;

  useEffect(() => {
    if (!isOpen) return;
    const todos = new Set();
    sections.forEach((section) => {
      (sectionItems[section.key] ?? []).forEach((item, idx) => todos.add(clave(section.key, item, idx)));
    });
    setSeleccion(todos);
    setFecha(hoyISO());
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

  const total = seleccionados.reduce((acc, { item }) => acc + (getLineTotal(item) || 0), 0);

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
    onConfirm?.({ cuenta, fecha, total, items, quitar });
  };

  const seccionesConItems = sections.filter((s) => (sectionItems[s.key] ?? []).length > 0);

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl" scrollBehavior="inside">
      <ModalOverlay />
      <ModalContent mx={4}>
        <ModalHeader fontFamily="heading">Registrar compra</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <Text fontSize="sm" color={muted} mb={4}>
            Marcá lo que compraste. Se registra como gasto (Materiales) en la Caja y esos ítems salen de la lista.
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
          <SimpleGrid columns={{ base: 1, sm: 2 }} spacing={4}>
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
              <FormLabel fontSize="sm">Fecha</FormLabel>
              <Input size="sm" type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} />
            </FormControl>
          </SimpleGrid>
        </ModalBody>
        <ModalFooter gap={3} flexWrap="wrap">
          <Text fontWeight="bold" mr="auto" className="tnum">
            Total: {formatMoney(total)}
            <Text as="span" fontWeight="normal" color={muted} fontSize="sm" ml={2}>
              ({seleccionados.length} ítems)
            </Text>
          </Text>
          <Button variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button
            colorScheme="teal"
            onClick={confirmar}
            isLoading={isSaving}
            isDisabled={!seleccionados.length || !(total > 0) || !cuenta}
          >
            Registrar compra
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};
