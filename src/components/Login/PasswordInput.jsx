import { useState } from "react";
import { IconButton, Input, InputGroup, InputRightElement, Tooltip } from "@chakra-ui/react";
import { FiEye, FiEyeOff } from "react-icons/fi";

// Campo de contraseña con el botón para mostrarla u ocultarla.
export const PasswordInput = (props) => {
  const [visible, setVisible] = useState(false);
  const etiqueta = visible ? "Ocultar contraseña" : "Mostrar contraseña";
  return (
    <InputGroup>
      <Input {...props} type={visible ? "text" : "password"} pr="2.75rem" />
      <InputRightElement>
        <Tooltip label={etiqueta} hasArrow openDelay={400}>
          <IconButton
            aria-label={etiqueta}
            aria-pressed={visible}
            icon={visible ? <FiEyeOff /> : <FiEye />}
            size="sm"
            variant="ghost"
            onClick={() => setVisible((v) => !v)}
          />
        </Tooltip>
      </InputRightElement>
    </InputGroup>
  );
};
