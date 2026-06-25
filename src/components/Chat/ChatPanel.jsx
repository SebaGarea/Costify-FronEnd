import { useEffect, useRef, useState } from "react";
import {
  Box,
  Button,
  Flex,
  HStack,
  IconButton,
  Input,
  Text,
  VStack,
  Wrap,
  WrapItem,
  useColorModeValue,
} from "@chakra-ui/react";
import { FiSend, FiSquare, FiTrash2 } from "react-icons/fi";
import ReactMarkdown from "react-markdown";
import { useChat } from "../../context/ChatContext.jsx";

const SUGERENCIAS = [
  "¿Cómo vengo este mes?",
  "¿Tengo entregas vencidas?",
  "Dame ideas de contenido para Instagram",
  "¿Cuánto tengo pendiente de cobro?",
];

export const ChatPanel = () => {
  const { messages, isStreaming, send, stop, clear, toolStatus, resumen } = useChat();
  const [input, setInput] = useState("");
  const endRef = useRef(null);

  const userBubble = useColorModeValue("teal.500", "teal.400");
  const botBubble = useColorModeValue("gray.100", "gray.700");
  const muted = useColorModeValue("gray.600", "gray.400");

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = () => {
    const text = input.trim();
    if (!text || isStreaming) return;
    setInput("");
    send(text);
  };

  return (
    <Flex direction="column" h="100%" minH={0}>
      <Flex flex="1" minH={0} overflowY="auto" direction="column" gap={3} p={3}>
        {messages.length === 0 ? (
          <VStack spacing={4} py={6} align="stretch">
            {resumen ? (
              <Box
                bg={botBubble}
                px={3}
                py={2}
                borderRadius="lg"
                fontSize="sm"
                sx={{
                  "& p": { margin: 0 },
                  "& ul": { paddingLeft: "1.1rem", marginTop: 1, marginBottom: 0 },
                  "& strong": { fontWeight: 700 },
                }}
              >
                <ReactMarkdown>{resumen}</ReactMarkdown>
              </Box>
            ) : (
              <Text color={muted} fontSize="sm" textAlign="center">
                Hola 👋 Soy tu asistente. Preguntame sobre tu negocio o lo que necesites.
              </Text>
            )}
            <Wrap justify="center" spacing={2}>
              {SUGERENCIAS.map((s) => (
                <WrapItem key={s}>
                  <Button size="xs" variant="outline" colorScheme="teal" onClick={() => send(s)}>
                    {s}
                  </Button>
                </WrapItem>
              ))}
            </Wrap>
          </VStack>
        ) : (
          messages.map((m, i) => {
            const isUser = m.role === "user";
            return (
              <Flex key={i} justify={isUser ? "flex-end" : "flex-start"}>
                <Box
                  maxW="85%"
                  bg={isUser ? userBubble : botBubble}
                  color={isUser ? "white" : "inherit"}
                  px={3}
                  py={2}
                  borderRadius="lg"
                  fontSize="sm"
                  sx={{
                    "& p": { margin: 0 },
                    "& p + p": { marginTop: 2 },
                    "& ul, & ol": { paddingLeft: "1.1rem", marginTop: 1, marginBottom: 1 },
                    "& a": { textDecoration: "underline" },
                    "& strong": { fontWeight: 700 },
                    "& code": { fontFamily: "monospace", fontSize: "0.85em" },
                  }}
                >
                  {isUser ? (
                    <Text whiteSpace="pre-wrap">{m.content}</Text>
                  ) : m.content ? (
                    <ReactMarkdown>{m.content}</ReactMarkdown>
                  ) : (
                    <Text color={muted}>
                      {isStreaming && toolStatus ? `🔧 ${toolStatus}…` : "Pensando…"}
                    </Text>
                  )}
                </Box>
              </Flex>
            );
          })
        )}
        <Box ref={endRef} />
      </Flex>

      <Box borderTopWidth="1px" borderColor={useColorModeValue("gray.200", "gray.700")} p={2}>
        <HStack>
          {messages.length > 0 && (
            <IconButton
              aria-label="Borrar conversación"
              icon={<FiTrash2 />}
              size="sm"
              variant="ghost"
              onClick={clear}
              isDisabled={isStreaming}
            />
          )}
          <Input
            size="sm"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Escribí tu consulta…"
          />
          {isStreaming ? (
            <IconButton aria-label="Detener" icon={<FiSquare />} size="sm" colorScheme="red" onClick={stop} />
          ) : (
            <IconButton
              aria-label="Enviar"
              icon={<FiSend />}
              size="sm"
              colorScheme="teal"
              onClick={handleSend}
              isDisabled={!input.trim()}
            />
          )}
        </HStack>
      </Box>
    </Flex>
  );
};
