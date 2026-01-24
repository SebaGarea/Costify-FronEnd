import {
  Box,
  Button,
  Divider,
  FormControl,
  FormLabel,
  Heading,
  Image,
  Input,
  Stack,
  Text,
  VStack,
  useColorMode,
  useColorModeValue,
  useToast,
} from "@chakra-ui/react";
import { useState } from "react";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/auth/useAuth.jsx";
import { FcGoogle } from "react-icons/fc";

export const LoginView = () => {
  const { signIn } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const { colorMode } = useColorMode();
  const cardBg = useColorModeValue("rgba(255, 255, 255, 0.95)", "rgba(15, 23, 42, 0.9)");
  const cardBorder = useColorModeValue("rgba(148, 163, 184, 0.4)", "rgba(30, 58, 138, 0.6)");
  const logoSrc = colorMode === "dark" ? "/logo-light.png" : "/logo-dark.png";

  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

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

  const handleGoogleLogin = () => {
    const apiBase = import.meta.env.VITE_API_URL;
    const redirect = encodeURIComponent(window.location.origin);
    setGoogleLoading(true);
    window.location.href = `${apiBase}/api/usuarios/auth/google?redirect=${redirect}`;
  };

  return (
    <Box
      position="relative"
      minH="100vh"
      w="100vw"
      display="flex"
      alignItems="center"
      justifyContent="center"
      px={{ base: 4, md: 6 }}
      py={{ base: 8, md: 12 }}
      overflow="hidden"
      bg="transparent"
      _before={{
        content: "''",
        position: "fixed",
        inset: 0,
        bgImage:
          "linear-gradient(180deg, rgba(9, 11, 20, 0.72) 0%, rgba(9, 11, 20, 0.88) 100%), url('/bckLogin.jpg')",
        bgSize: "cover",
        bgPos: "center",
        bgRepeat: "no-repeat",
        zIndex: -1,
      }}
    >
      <Box
        bg={cardBg}
        py={{ base: 1, md: 2}}
        px={{ base: 6, md: 8 }}
        rounded="2xl"
        shadow="2xl"
        w={{ base: "100%", sm: "380px" }}
        backdropFilter="blur(8px)"
        borderWidth="1px"
        borderColor={cardBorder}
      >
        <VStack as="form" spacing={4} align="stretch" onSubmit={handleSubmit}>
          <VStack spacing={0}>
            <Image src={logoSrc} alt="El Portal" h="48" objectFit="contain" />
            <Heading textAlign="center" size="md">Iniciar sesión</Heading>
          </VStack>
          <Stack spacing={3}>
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
          <Divider />
          <VStack spacing={2} align="stretch">
            <Text fontSize="sm" color="gray.500" textAlign="center">O continuar con</Text>
            <Button
              variant="outline"
              leftIcon={<FcGoogle size={20} />}
              onClick={handleGoogleLogin}
              isDisabled={loading}
              isLoading={googleLoading}
            >
              Continuar con Google
            </Button>
          </VStack>
          <Text fontSize="sm" textAlign="center" color="gray.500">
            ¿No tienes cuenta?
            <Button as={RouterLink} to="/register" variant="link" colorScheme="teal" ml={2}>
              Regístrate
            </Button>
          </Text>
        </VStack>
      </Box>
    </Box>
  );
};
