import { useEffect, useState } from "react";
import {
  Button,
  FormControl,
  FormLabel,
  Popover,
  PopoverArrow,
  PopoverBody,
  PopoverContent,
  PopoverFooter,
  PopoverTrigger,
  Portal,
  Select,
  Text,
  useDisclosure,
} from "@chakra-ui/react";
import { formatMoney } from "../../constants/caja.js";

// Envuelve el botón de "marcar pagada": antes de marcar, pregunta en qué cuenta
// entró la plata (con la cuenta de cobro por defecto ya elegida).
export const CobroCuentaPopover = ({ monto, cuentas = [], cuentaDefault, onConfirm, children }) => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [cuenta, setCuenta] = useState(cuentaDefault || "");

  useEffect(() => {
    if (isOpen) setCuenta(cuentaDefault || cuentas[0]?._id || "");
  }, [isOpen, cuentaDefault, cuentas]);

  return (
    <Popover isOpen={isOpen} onOpen={onOpen} onClose={onClose} placement="bottom" isLazy>
      <PopoverTrigger>{children}</PopoverTrigger>
      <Portal>
        <PopoverContent w="260px" onClick={(e) => e.stopPropagation()}>
          <PopoverArrow />
          <PopoverBody>
            <Text fontSize="sm" mb={2}>
              Cobrar <b className="tnum">{formatMoney(monto)}</b>
            </Text>
            <FormControl>
              <FormLabel fontSize="sm">¿Dónde entró la plata?</FormLabel>
              <Select size="sm" value={cuenta} onChange={(e) => setCuenta(e.target.value)}>
                {cuentas.map((c) => (
                  <option key={c._id} value={c._id}>{c.nombre}</option>
                ))}
              </Select>
            </FormControl>
          </PopoverBody>
          <PopoverFooter display="flex" justifyContent="flex-end" gap={2}>
            <Button size="sm" variant="ghost" onClick={onClose}>Cancelar</Button>
            <Button
              size="sm"
              colorScheme="green"
              onClick={() => {
                onClose();
                onConfirm?.(cuenta || null);
              }}
            >
              Marcar cobrada
            </Button>
          </PopoverFooter>
        </PopoverContent>
      </Portal>
    </Popover>
  );
};
