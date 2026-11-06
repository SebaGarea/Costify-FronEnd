import {
  Alert,
  AlertDescription,
  AlertIcon,
  AlertTitle,
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
  useColorModeValue,
  useToast,
} from "@chakra-ui/react";
import { useEffect, useRef, useState } from "react";
import { Link as RouterLink, Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/auth/useAuth.jsx";
import { FcGoogle } from "react-icons/fc";
import { PasswordInput } from "./PasswordInput.jsx";
import { authErrorMessage, googleLoginUrl } from "../../services/auth.service";

// Errores con los que vuelve el login con Google (?error=...).
const ERRORES_GOOGLE = {
  google_sin_cuenta: "Ese email de Google no tiene una cuenta en Costify. Pedile una invitación a un administrador.",
  google_otra_cuenta: "Tu usuario ya está vinculado a otra cuenta de Google.",
  google_email_no_verificado: "Google no verificó ese email. Usá otra cuenta o entrá con contraseña.",
  google_sin_email: "Google no compartió tu email. Probá de nuevo y aceptá los permisos.",
  google_cancelado: "Cancelaste el ingreso con Google.",
  google_sesion_vencida: "El ingreso con Google tardó demasiado o se abrió en otra pestaña. Probá de nuevo.",
  google_no_disponible: "El ingreso con Google no está disponible ahora. Entrá con email y contraseña.",
  google_error: "No se pudo completar el ingreso con Google. Probá de nuevo.",
};

export const LoginView = () => {
  const { user, signIn, signInWithGoogleCode } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const cardBg = useColorModeValue("rgba(255, 255, 255, 0.95)", "rgba(15, 23, 42, 0.9)");
  const cardBorder = useColorModeValue("rgba(148, 163, 184, 0.4)", "rgba(30, 58, 138, 0.6)");
  const muted = useColorModeValue("gray.600", "gray.400");
  const brandColor = useColorModeValue("teal.600", "teal.300");

  const isDemo = import.meta.env.VITE_IS_DEMO === "true";

  // En la demo el formulario viene precargado: el visitante entra con un clic.
  const [form, setForm] = useState(
    isDemo ? { email: "demo@costify.com", password: "Demo1234" } : { email: "", password: "" }
  );
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [errorGoogle, setErrorGoogle] = useState(null);
  const canjeIniciado = useRef(false);

  // Vuelta del login con Google: #codigo=... (se canjea una vez) o ?error=...
  useEffect(() => {
    const hash = new URLSearchParams(window.location.hash.slice(1));
    const codigo = hash.get("codigo");
    const error = new URLSearchParams(window.location.search).get("error");
    if (!codigo && !error) return;
    // Se limpia la URL para que el código no quede en el historial.
    window.history.replaceState({}, document.title, window.location.pathname);
    if (error) {
      setErrorGoogle(ERRORES_GOOGLE[error] ?? ERRORES_GOOGLE.google_error);
      return;
    }
    if (canjeIniciado.current) return;
    canjeIniciado.current = true;
    setGoogleLoading(true);
    signInWithGoogleCode(codigo)
      .then(() => navigate("/", { replace: true }))
      .catch((err) => {
        setErrorGoogle(authErrorMessage(err, ERRORES_GOOGLE.google_error));
        setGoogleLoading(false);
      });
  }, [navigate, signInWithGoogleCode]);

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
        title: "No se pudo iniciar sesión",
        description: authErrorMessage(error),
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    setErrorGoogle(null);
    setGoogleLoading(true);
    window.location.href = googleLoginUrl();
  };

  if (user && !googleLoading) return <Navigate to="/" replace />;

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
      {isDemo && (
        <Alert
          status="info"
          variant="solid"
          borderRadius="xl"
          mb={4}
          w={{ base: "100%", sm: "380px" }}
          flexDirection="column"
          alignItems="flex-start"
          gap={1}
          py={3}
          px={4}
        >
          <AlertIcon mr={2} />
          <AlertTitle fontSize="sm">Versión demo</AlertTitle>
          <AlertDescription fontSize="xs" lineHeight="1.5">
            Usuario de prueba: <strong>demo@costify.com</strong>
            <br />
            Contraseña: <strong>Demo1234</strong>
          </AlertDescription>
        </Alert>
      )}

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
            <Heading
              textAlign="center"
              size="2xl"
              fontFamily="heading"
              letterSpacing="-0.02em"
              color={brandColor}
            >
              Costify
            </Heading>
            <Heading textAlign="center" size="md">Iniciar sesión</Heading>
          </VStack>
          {errorGoogle && (
            <Alert status="warning" rounded="md" fontSize="sm">
              <AlertIcon />
              {errorGoogle}
            </Alert>
          )}
          <Stack spacing={3}>
            <FormControl isRequired>
              <FormLabel>Email</FormLabel>
              <Input name="email" type="email" autoComplete="username" inputMode="email" value={form.email} onChange={handleChange} />
            </FormControl>
            <FormControl isRequired>
              <FormLabel>Contraseña</FormLabel>
              <PasswordInput name="password" autoComplete="current-password" value={form.password} onChange={handleChange} />
            </FormControl>
          </Stack>
          <Button colorScheme="teal" type="submit" isLoading={loading} isDisabled={googleLoading}>Entrar</Button>
          {!isDemo && (<>
          <Divider />
          <VStack spacing={2} align="stretch">
            <Text fontSize="sm" color={muted} textAlign="center">O continuar con</Text>
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
          <Text fontSize="sm" textAlign="center" color={muted}>
            ¿No tienes cuenta?
            <Button as={RouterLink} to="/register" variant="link" colorScheme="teal" ml={2}>
              Regístrate
            </Button>
          </Text>
          </>)}
        </VStack>
      </Box>
    </Box>
  );
};
