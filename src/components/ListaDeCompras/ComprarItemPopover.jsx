import { useEffect, useState } from "react";
import {
  Button,
  FormControl,
  FormLabel,
  IconButton,
  Input,
  InputGroup,
  InputLeftAddon,
  Popover,
  PopoverArrow,
  PopoverBody,
  PopoverContent,
  PopoverFooter,
  PopoverTrigger,
  Portal,
  Select,
  Stack,
  Text,
  Tooltip,
  useDisclosure,
} from "@chakra-ui/react";
import { CheckIcon } from "@chakra-ui/icons";

// Botón "Comprado" de un ítem de la lista: pregunta con qué se pagó.
// - Efectivo / cuentas sin integración: se descuenta de esa cuenta en Caja.
// - Mercado Pago: no se carga nada; el gasto entra solo desde Mercado Pago.
export const ComprarItemPopover = ({ cuentas = [], montoSugerido = 0, onConfirm, isLoading = false }) => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [cuenta, setCuenta] = useState("");
  const [monto, setMonto] = useState("");

  useEffect(() => {
    if (!isOpen) return;
    setCuenta((cuentas.find((c) => !c.esDigital) ?? cuentas[0])?._id ?? "");
    setMonto(String(Math.round(montoSugerido || 0)));
  }, [isOpen, cuentas, montoSugerido]);

  const elegida = cuentas.find((c) => c._id === cuenta);
  const esMercadoPago = elegida?.integracion === "mercadopago";
  const montoNum = Number(String(monto).replace(",", "."));
  const puedeConfirmar = Boolean(cuenta) && (esMercadoPago || montoNum > 0);

  return (
    <Popover isOpen={isOpen} onOpen={onOpen} onClose={onClose} placement="left" isLazy>
      <Tooltip label="Marcar como comprado" hasArrow>
        <span>
          <PopoverTrigger>
            <IconButton
              aria-label="Marcar como comprado"
              icon={<CheckIcon />}
              colorScheme="green"
              size="sm"
              variant="ghost"
              isLoading={isLoading}
            />
          </PopoverTrigger>
        </span>
      </Tooltip>
      <Portal>
        <PopoverContent w="270px">
          <PopoverArrow />
          <PopoverBody>
            <Stack spacing={3}>
              <FormControl>
                <FormLabel fontSize="sm" mb={1}>¿Con qué se pagó?</FormLabel>
                <Select size="sm" value={cuenta} onChange={(e) => setCuenta(e.target.value)}>
                  {cuentas.map((c) => (
                    <option key={c._id} value={c._id}>{c.nombre}</option>
                  ))}
                </Select>
              </FormControl>
              {esMercadoPago ? (
                <Text fontSize="xs" color="blue.400">
                  No hace falta cargar nada: el gasto entra solo desde Mercado Pago, con el monto real.
                </Text>
              ) : (
                <FormControl>
                  <FormLabel fontSize="sm" mb={1}>Monto pagado</FormLabel>
                  <InputGroup size="sm">
                    <InputLeftAddon>$</InputLeftAddon>
                    <Input
                      type="number"
                      inputMode="decimal"
                      value={monto}
                      onChange={(e) => setMonto(e.target.value)}
                      className="tnum"
                    />
                  </InputGroup>
                  <Text fontSize="xs" color="gray.500" mt={1}>
                    Se descuenta de {elegida?.nombre ?? "la cuenta"} en la Caja.
                  </Text>
                </FormControl>
              )}
            </Stack>
          </PopoverBody>
          <PopoverFooter display="flex" justifyContent="flex-end" gap={2}>
            <Button size="sm" variant="ghost" onClick={onClose}>Cancelar</Button>
            <Button
              size="sm"
              colorScheme="green"
              isDisabled={!puedeConfirmar}
              onClick={() => {
                onClose();
                onConfirm?.({ cuenta, monto: esMercadoPago ? null : montoNum, esMercadoPago });
              }}
            >
              Comprado
            </Button>
          </PopoverFooter>
        </PopoverContent>
      </Portal>
    </Popover>
  );
};
