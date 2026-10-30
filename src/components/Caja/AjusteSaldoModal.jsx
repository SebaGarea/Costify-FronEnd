import { useEffect, useState } from "react";
import {
  Button,
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
  Text,
  useToast,
} from "@chakra-ui/react";
import { ajustarSaldoCuenta } from "../../services/caja.service.js";
import { formatMoney, getApiError } from "../../constants/caja.js";

// Corrige el saldo calculado para que coincida con el real (por ejemplo, el que
// muestra la app de Mercado Pago). Crea un movimiento de ajuste por la diferencia.
export const AjusteSaldoModal = ({ cuenta, onClose, onSaved }) => {
  const toast = useToast();
  const [saldoReal, setSaldoReal] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (cuenta) setSaldoReal(String(Math.round(cuenta.saldo ?? 0)));
  }, [cuenta]);

  const real = Number(String(saldoReal).replace(",", "."));
  const diferencia = Number.isFinite(real) && cuenta ? real - (cuenta.saldo ?? 0) : 0;

  const handleSave = async () => {
    if (!Number.isFinite(real)) {
      toast({ status: "warning", title: "Ingresá el saldo real" });
      return;
    }
    setSaving(true);
    try {
      await ajustarSaldoCuenta(cuenta._id, real);
      toast({
        status: "success",
        title: Math.abs(diferencia) < 1 ? "El saldo ya coincidía" : "Saldo ajustado",
        duration: 1500,
      });
      onSaved?.();
      onClose();
    } catch (error) {
      toast({ status: "error", title: "No se pudo ajustar", description: getApiError(error) });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal isOpen={Boolean(cuenta)} onClose={onClose}>
      <ModalOverlay />
      <ModalContent mx={4}>
        <ModalHeader fontFamily="heading">Ajustar saldo · {cuenta?.nombre}</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <Text fontSize="sm" mb={4}>
            Saldo en Costify: <b className="tnum">{formatMoney(cuenta?.saldo)}</b>
          </Text>
          <FormControl>
            <FormLabel>Saldo real</FormLabel>
            <InputGroup>
              <InputLeftAddon>$</InputLeftAddon>
              <Input
                type="number"
                inputMode="decimal"
                value={saldoReal}
                onChange={(e) => setSaldoReal(e.target.value)}
                autoFocus
                className="tnum"
              />
            </InputGroup>
            <FormHelperText>
              Poné lo que ves en la app o lo que contaste en la caja. Se registra un ajuste por la diferencia
              {Math.abs(diferencia) >= 1 && (
                <Text as="span" fontWeight="semibold" color={diferencia > 0 ? "green.500" : "red.400"} className="tnum">
                  {" "}({diferencia > 0 ? "+" : "−"}{formatMoney(Math.abs(diferencia))})
                </Text>
              )}
              .
            </FormHelperText>
          </FormControl>
        </ModalBody>
        <ModalFooter gap={2}>
          <Button variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button colorScheme="teal" onClick={handleSave} isLoading={saving}>Ajustar</Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};
