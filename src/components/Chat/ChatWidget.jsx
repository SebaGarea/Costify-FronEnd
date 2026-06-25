import {
  Box,
  Button,
  Flex,
  Heading,
  HStack,
  IconButton,
  useColorModeValue,
  useToast,
} from "@chakra-ui/react";
import { FiMessageCircle, FiX, FiMaximize2 } from "react-icons/fi";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import { useChat } from "../../context/ChatContext.jsx";
import { useDataChanged } from "../../hooks/useDataChanged.js";
import { ChatPanel } from "./ChatPanel.jsx";

// Entidad afectada -> a dónde llevar al usuario para verla.
const ENTIDAD_DESTINO = {
  tarea: { ruta: "/tareas", label: "tarea" },
  contenido: { ruta: "/contenido", label: "publicación" },
  venta: { ruta: "/ventas", label: "venta" },
  producto: { ruta: "/productos", label: "producto" },
  compra: { ruta: "/lista-compras", label: "lista de compras" },
};

export const ChatWidget = () => {
  const { isOpen, setIsOpen } = useChat();
  const panelBg = useColorModeValue("white", "gray.800");
  const border = useColorModeValue("gray.200", "gray.700");
  const toast = useToast();
  const navigate = useNavigate();

  // Cuando la IA crea/modifica datos, ofrecemos ir a verlo.
  useDataChanged((entities = []) => {
    const primera = entities.find((e) => ENTIDAD_DESTINO[e]);
    const destino = primera ? ENTIDAD_DESTINO[primera] : null;
    toast({
      title: "✓ El asistente actualizó tus datos",
      description: destino ? `Se modificó la ${destino.label}.` : undefined,
      status: "success",
      duration: 5000,
      isClosable: true,
      position: "bottom-left",
      render: destino
        ? ({ onClose }) => (
            <Box bg="teal.500" color="white" p={3} borderRadius="md" boxShadow="lg">
              <HStack justify="space-between" spacing={3}>
                <Box fontSize="sm">✓ Se actualizó la {destino.label}</Box>
                <Button
                  size="xs"
                  variant="solid"
                  colorScheme="whiteAlpha"
                  onClick={() => {
                    navigate(destino.ruta);
                    onClose();
                  }}
                >
                  Ver
                </Button>
              </HStack>
            </Box>
          )
        : undefined,
    });
  });

  return (
    <Box position="fixed" bottom={{ base: 4, md: 6 }} right={{ base: 4, md: 6 }} zIndex={1300}>
      {isOpen && (
        <Box
          mb={3}
          w={{ base: "calc(100vw - 2rem)", sm: "370px" }}
          h="520px"
          maxH="75vh"
          bg={panelBg}
          borderWidth="1px"
          borderColor={border}
          borderRadius="xl"
          boxShadow="2xl"
          display="flex"
          flexDirection="column"
          overflow="hidden"
        >
          <Flex align="center" justify="space-between" p={3} borderBottomWidth="1px" borderColor={border}>
            <HStack spacing={2}>
              <FiMessageCircle />
              <Heading size="sm" fontFamily="heading">
                Asistente
              </Heading>
            </HStack>
            <HStack spacing={1}>
              <IconButton
                as={RouterLink}
                to="/asistente"
                aria-label="Pantalla completa"
                icon={<FiMaximize2 />}
                size="sm"
                variant="ghost"
                onClick={() => setIsOpen(false)}
              />
              <IconButton
                aria-label="Cerrar"
                icon={<FiX />}
                size="sm"
                variant="ghost"
                onClick={() => setIsOpen(false)}
              />
            </HStack>
          </Flex>
          <Box flex="1" minH={0}>
            <ChatPanel />
          </Box>
        </Box>
      )}

      <IconButton
        aria-label={isOpen ? "Cerrar asistente" : "Abrir asistente"}
        icon={isOpen ? <FiX /> : <FiMessageCircle />}
        colorScheme="teal"
        borderRadius="full"
        size="lg"
        boxShadow="lg"
        onClick={() => setIsOpen((v) => !v)}
      />
    </Box>
  );
};
