import { Box, Heading, Text, useColorModeValue } from "@chakra-ui/react";
import { ChatPanel } from "../components/Chat/ChatPanel.jsx";

export const Asistente = () => {
  const bg = useColorModeValue("gray.50", "gray.900");
  const cardBg = useColorModeValue("white", "gray.800");
  const border = useColorModeValue("gray.200", "gray.700");
  const heading = useColorModeValue("teal.600", "teal.300");
  const muted = useColorModeValue("gray.600", "gray.400");

  return (
    <Box bg={bg} minH="100vh" p={{ base: 3, md: 5 }}>
      <Box maxW="900px" mx="auto">
        <Heading color={heading} size="lg" fontFamily="heading">
          Asistente
        </Heading>
        <Text color={muted} fontSize="sm" mb={4}>
          Preguntá sobre tu negocio (ventas, cobros, entregas), pedí ideas de contenido o lo que necesites.
        </Text>
        <Box
          bg={cardBg}
          borderWidth="1px"
          borderColor={border}
          borderRadius="xl"
          h="70vh"
          overflow="hidden"
        >
          <ChatPanel />
        </Box>
      </Box>
    </Box>
  );
};

export default Asistente;
