import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Heading,
  Input,
  Stack,
  VStack,
  useColorModeValue,
  useToast,
} from "@chakra-ui/react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/auth/useAuth.jsx";

const Login = () => {
  const { signIn } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const cardBg = useColorModeValue("rgba(255, 255, 255, 0.95)", "rgba(15, 23, 42, 0.9)");
  const cardBorder = useColorModeValue("rgba(148, 163, 184, 0.4)", "rgba(30, 58, 138, 0.6)");

  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);

  const handleChange = ({ target }) => {
    setForm((prev) => ({ ...prev, [target.name]: target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await signIn(form);
      toast({ title: "Bienvenido", status: "success", duration: 2000, isClosable: true });
      navigate("/");
    } catch (error) {
      toast({
        title: "Credenciales inválidas",
        description: error.response?.data?.mensaje ?? "Intenta nuevamente",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box minH="100vh" w="full" display="flex" alignItems="center" justifyContent="center" px={{ base: 4, md: 0 }}>
      <Box
        bg={cardBg}
        p={{ base: 8, md: 10 }}
        rounded="2xl"
        shadow="2xl"
        w={{ base: "100%", sm: "420px" }}
        backdropFilter="blur(8px)"
        borderWidth="1px"
        borderColor={cardBorder}
      >
        <VStack as="form" spacing={6} align="stretch" onSubmit={handleSubmit}>
          <Heading textAlign="center" size="lg">Iniciar sesión</Heading>
          <Stack spacing={4}>
            <FormControl isRequired>
              <FormLabel>Email</FormLabel>
              <Input name="email" type="email" value={form.email} onChange={handleChange} />
            </FormControl>
            <FormControl isRequired>
              <FormLabel>Contraseña</FormLabel>
              <Input name="password" type="password" value={form.password} onChange={handleChange} />
            </FormControl>
          </Stack>
          <Button colorScheme="teal" type="submit" isLoading={loading}>Entrar</Button>
        </VStack>
      </Box>
    </Box>
  );
};

export default Login;