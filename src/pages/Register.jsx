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
  Text,
  FormErrorMessage,
} from "@chakra-ui/react";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import { useState } from "react";
import { registerUser } from "../services/auth.service.js";

const Register = () => {
  const toast = useToast();
  const navigate = useNavigate();
  const cardBg = useColorModeValue("rgba(255, 255, 255, 0.95)", "rgba(15, 23, 42, 0.9)");
  const cardBorder = useColorModeValue("rgba(148, 163, 184, 0.4)", "rgba(30, 58, 138, 0.6)");

  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
    password: "",
    confirmPassword: "",
    invitationCode: "",
    role: "user",
  });
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChange = ({ target }) => {
    const { name, value } = target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (submitted || touched[name]) {
      setErrors((prev) => validate({ ...form, [name]: value }, name, prev));
    }
  };

  const handleBlur = ({ target }) => {
    const { name } = target;
    setTouched((prev) => ({ ...prev, [name]: true }));
    setErrors((prev) => validate(form, name, prev));
  };

  const passwordRules = [
    {
      test: (value) => value.length >= 8,
      message: "Al menos 8 caracteres",
    },
    {
      test: (value) => /[A-Z]/.test(value),
      message: "Incluye una mayúscula",
    },
    {
      test: (value) => /[a-z]/.test(value),
      message: "Incluye una minúscula",
    },
    {
      test: (value) => /\d/.test(value),
      message: "Incluye un número",
    },
  ];

  const validate = (values, singleField, baseErrors = {}) => {
    const newErrors = singleField ? { ...baseErrors } : {};

    const shouldCheck = (field) => !singleField || singleField === field;

    if (shouldCheck("first_name")) {
      if (!values.first_name.trim()) newErrors.first_name = "El nombre es obligatorio";
      else delete newErrors.first_name;
    }

    if (shouldCheck("last_name")) {
      if (!values.last_name.trim()) newErrors.last_name = "El apellido es obligatorio";
      else delete newErrors.last_name;
    }

    if (shouldCheck("email")) {
      if (!values.email.trim()) newErrors.email = "El email es obligatorio";
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) newErrors.email = "Formato de email inválido";
      else delete newErrors.email;
    }

    if (shouldCheck("password")) {
      if (!values.password) {
        newErrors.password = "La contraseña es obligatoria";
      } else {
        const failedRule = passwordRules.find((rule) => !rule.test(values.password));
        if (failedRule) newErrors.password = failedRule.message;
        else delete newErrors.password;
      }
      if (values.confirmPassword && values.password !== values.confirmPassword) {
        newErrors.confirmPassword = "Las contraseñas no coinciden";
      } else if (!values.confirmPassword) {
        if (shouldCheck("confirmPassword")) newErrors.confirmPassword = "Confirma tu contraseña";
      } else if (values.password === values.confirmPassword) {
        delete newErrors.confirmPassword;
      }
    }

    if (shouldCheck("confirmPassword")) {
      if (!values.confirmPassword) {
        newErrors.confirmPassword = "Confirma tu contraseña";
      } else if (values.password !== values.confirmPassword) {
        newErrors.confirmPassword = "Las contraseñas no coinciden";
      } else {
        delete newErrors.confirmPassword;
      }
    }

    if (shouldCheck("invitationCode")) {
      if (!values.invitationCode.trim()) {
        newErrors.invitationCode = "El código de invitación es obligatorio";
      } else {
        delete newErrors.invitationCode;
      }
    }

    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitted(true);
    const validationResult = validate(form);
    setErrors(validationResult);
    if (Object.keys(validationResult).length) return;

    setLoading(true);
    try {
      const { confirmPassword, ...payload } = form;
      await registerUser(payload);
      toast({
        title: "Cuenta creada",
        description: "Ya puedes iniciar sesión con tus credenciales",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
      navigate("/login", { replace: true });
    } catch (error) {
      toast({
        title: "No se pudo registrar",
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
        w={{ base: "100%", sm: "480px" }}
        backdropFilter="blur(8px)"
        borderWidth="1px"
        borderColor={cardBorder}
      >
        <VStack as="form" spacing={6} align="stretch" onSubmit={handleSubmit}>
          <Heading textAlign="center" size="lg">Crear cuenta</Heading>
          <Stack spacing={4}>
            <FormControl isRequired isInvalid={Boolean(errors.first_name && (touched.first_name || submitted))}>
              <FormLabel>Nombre</FormLabel>
              <Input name="first_name" value={form.first_name} onChange={handleChange} onBlur={handleBlur} />
              <FormErrorMessage>{errors.first_name}</FormErrorMessage>
            </FormControl>
            <FormControl isRequired isInvalid={Boolean(errors.last_name && (touched.last_name || submitted))}>
              <FormLabel>Apellido</FormLabel>
              <Input name="last_name" value={form.last_name} onChange={handleChange} onBlur={handleBlur} />
              <FormErrorMessage>{errors.last_name}</FormErrorMessage>
            </FormControl>
            <FormControl isRequired isInvalid={Boolean(errors.email && (touched.email || submitted))}>
              <FormLabel>Email</FormLabel>
              <Input name="email" type="email" value={form.email} onChange={handleChange} onBlur={handleBlur} />
              <FormErrorMessage>{errors.email}</FormErrorMessage>
            </FormControl>
            <FormControl isRequired isInvalid={Boolean(errors.invitationCode && (touched.invitationCode || submitted))}>
              <FormLabel>Código de invitación</FormLabel>
              <Input name="invitationCode" value={form.invitationCode} onChange={handleChange} onBlur={handleBlur} textTransform="uppercase" />
              <FormErrorMessage>{errors.invitationCode}</FormErrorMessage>
            </FormControl>
            <FormControl isRequired isInvalid={Boolean(errors.password && (touched.password || submitted))}>
              <FormLabel>Contraseña</FormLabel>
              <Input name="password" type="password" value={form.password} onChange={handleChange} onBlur={handleBlur} />
              <FormErrorMessage>{errors.password}</FormErrorMessage>
            </FormControl>
            <FormControl isRequired isInvalid={Boolean(errors.confirmPassword && (touched.confirmPassword || submitted))}>
              <FormLabel>Confirmar contraseña</FormLabel>
              <Input name="confirmPassword" type="password" value={form.confirmPassword} onChange={handleChange} onBlur={handleBlur} />
              <FormErrorMessage>{errors.confirmPassword}</FormErrorMessage>
            </FormControl>
            <VStack align="start" spacing={1} color="gray.500" fontSize="sm">
              <Text fontWeight="semibold">La contraseña debe incluir:</Text>
              {passwordRules.map((rule) => (
                <Text key={rule.message}>• {rule.message}</Text>
              ))}
            </VStack>
          </Stack>
          <Button colorScheme="teal" type="submit" isLoading={loading}>Registrarme</Button>
          <Text fontSize="sm" textAlign="center" color="gray.500">
            ¿Ya tienes cuenta?
            <Button as={RouterLink} to="/login" variant="link" colorScheme="teal" ml={2}>
              Inicia sesión
            </Button>
          </Text>
        </VStack>
      </Box>
    </Box>
  );
};

export default Register;
