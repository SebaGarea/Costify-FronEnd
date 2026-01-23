import { useEffect, useMemo, useState } from "react";
import {
  Avatar,
  Badge,
  Box,
  Button,
  Card,
  CardBody,
  CardHeader,
  Divider,
  Flex,
  Grid,
  GridItem,
  Heading,
  HStack,
  SimpleGrid,
  Stack,
  Text,
  useColorMode,
  useColorModeValue,
  useToast,
} from "@chakra-ui/react";
import { FiCheckCircle } from "react-icons/fi";
import { updateProfile } from "../services/auth.service.js";
import { useAuth } from "../hooks/auth/useAuth.jsx";

const avatarOptions = [
  { id: "sanlorenzo", label: "San Lorenzo", src: "https://i.pinimg.com/736x/0c/9e/a0/0c9ea0d681b56bedfdeb196bf127021f.jpg" },
  { id: "helmet", label: "Helmet", src: "https://i.pinimg.com/1200x/e4/b0/76/e4b076ccdce9064fa437fca2612fc49f.jpg" },
];

const themeOptions = [
  { value: "light", label: "Modo claro" },
  { value: "dark", label: "Modo oscuro" },
];

const defaultAvatar = avatarOptions[0].src;

export const Perfil = () => {
  const { user, setUserData } = useAuth();
  const toast = useToast();
  const { setColorMode } = useColorMode();
  const cardBg = useColorModeValue("rgba(255,255,255,0.9)", "rgba(15,23,42,0.8)");
  const borderColor = useColorModeValue("rgba(226,232,240,0.8)", "rgba(51,65,85,0.8)");
  const accentColor = useColorModeValue("teal.500", "teal.300");
  const heroBg = useColorModeValue(
    "linear(135deg, rgba(59,130,246,0.18), rgba(45,212,191,0.15))",
    "linear(120deg, rgba(45,212,191,0.18), rgba(6,182,212,0.25))"
  );
  const heroBorderColor = useColorModeValue("rgba(59,130,246,0.35)", "rgba(45,212,191,0.35)");
  const heroTitleColor = useColorModeValue("gray.800", "gray.100");
  const heroDescriptionColor = useColorModeValue("gray.600", "gray.100");
  const mutedTextColor = useColorModeValue("gray.600", "gray.300");

  const [selectedAvatar, setSelectedAvatar] = useState(user?.avatar || defaultAvatar);
  const [themePreference, setThemePreference] = useState(user?.themePreference || "dark");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    setSelectedAvatar(user.avatar || defaultAvatar);
    setThemePreference(user.themePreference || "dark");
    if (user.themePreference) {
      setColorMode(user.themePreference);
    }
  }, [user, setColorMode]);

  const hasChanges = useMemo(() => {
    const originalAvatar = user?.avatar || defaultAvatar;
    const originalTheme = user?.themePreference || "dark";
    return (
      selectedAvatar !== originalAvatar ||
      themePreference !== originalTheme
    );
  }, [selectedAvatar, themePreference, user]);

  const handleThemeSelection = (value) => {
    setThemePreference(value);
    setColorMode(value);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {
        avatar: selectedAvatar,
        themePreference,
      };
      const { data } = await updateProfile(payload);
      const updatedUser = data?.usuario ?? null;
      if (updatedUser) {
        setUserData(updatedUser);
      }
      toast({
        title: "Perfil actualizado",
        description: "Tus preferencias se guardaron correctamente",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: "No se pudo guardar",
        description: error.response?.data?.error ?? "Vuelve a intentarlo en unos segundos",
        status: "error",
        duration: 4000,
        isClosable: true,
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box px={{ base: 2, md: 6 }} py={6}>
      <Stack spacing={6}>
        <Box
          bg={heroBg}
          borderRadius="xl"
          borderWidth="1px"
          borderColor={heroBorderColor}
          p={{ base: 5, md: 8 }}
          shadow="xl"
        >
          <Heading size="lg" fontWeight="600" mb={2} color={heroTitleColor}>Perfil</Heading>
          <Text color={heroDescriptionColor} maxW="3xl">
            Personaliza tu presencia en Costify: elige un avatar que te represente y define el modo visual predeterminado.
          </Text>
        </Box>

        <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={6}>
          <Card bg={cardBg} borderColor={borderColor} borderWidth="1px" shadow="lg">
            <CardHeader>
              <Heading size="md" color={heroTitleColor}>Vista previa</Heading>
              <Text color={mutedTextColor} fontSize="sm">Así se verá tu perfil en el panel</Text>
            </CardHeader>
            <CardBody>
              <Stack spacing={5}>
                <HStack spacing={4} align="center">
                  <Avatar size="xl" name={`${user?.first_name ?? ""} ${user?.last_name ?? ""}`} src={selectedAvatar} shadow="lg" />
                  <Box>
                    <Heading size="md" fontWeight="600">{`${user?.first_name ?? ""} ${user?.last_name ?? ""}`.trim() || "Usuario"}</Heading>
                    <Text color={mutedTextColor}>{user?.email}</Text>
                    <Badge colorScheme={user?.role === "admin" ? "purple" : "blue"} mt={2} textTransform="capitalize">
                      {user?.role ?? "user"}
                    </Badge>
                  </Box>
                </HStack>
                <Divider />
                <Stack spacing={2} fontSize="sm">
                  <Flex justify="space-between">
                    <Text color={mutedTextColor}>Tema predeterminado</Text>
                    <Text fontWeight="medium" textTransform="capitalize">{themePreference === "dark" ? "Oscuro" : "Claro"}</Text>
                  </Flex>
                </Stack>
              </Stack>
            </CardBody>
          </Card>

          <Card bg={cardBg} borderColor={borderColor} borderWidth="1px" shadow="lg">
            <CardHeader>
              <Heading size="md" color={heroTitleColor}>Preferencias rápidas</Heading>
              <Text color={mutedTextColor} fontSize="sm">Define la atmósfera predeterminada del panel.</Text>
            </CardHeader>
            <CardBody>
              <Stack spacing={5}>
                <Box>
                  <Text fontWeight="semibold" mb={2} color={heroTitleColor}>Modo de color</Text>
                  <HStack spacing={3}>
                    {themeOptions.map((option) => (
                      <Button
                        key={option.value}
                        variant={themePreference === option.value ? "solid" : "outline"}
                        colorScheme="teal"
                        onClick={() => handleThemeSelection(option.value)}
                        flex={1}
                      >
                        {option.label}
                      </Button>
                    ))}
                  </HStack>
                </Box>
              </Stack>
            </CardBody>
          </Card>
        </SimpleGrid>

        <Card bg={cardBg} borderColor={borderColor} borderWidth="1px" shadow="lg">
          <CardHeader>
            <Heading size="md" color={heroTitleColor}>Selecciona tu avatar</Heading>
            <Text color={mutedTextColor} fontSize="sm">Estos avatares se muestran en el menú superior y en futuras colaboraciones.</Text>
          </CardHeader>
          <CardBody>
            <Grid templateColumns={{ base: "repeat(2, 1fr)", md: "repeat(3, 1fr)" }} gap={4}>
              {avatarOptions.map((option) => {
                const isActive = selectedAvatar === option.src;
                return (
                  <GridItem
                    key={option.id}
                    as={Button}
                    onClick={() => setSelectedAvatar(option.src)}
                    borderWidth="2px"
                    borderColor={isActive ? accentColor : "transparent"}
                    bg="transparent"
                    borderRadius="lg"
                    p={4}
                    height="auto"
                  >
                    <Stack align="center" spacing={3} w="full">
                      <Box position="relative">
                        <Avatar size="lg" src={option.src} name={option.label} />
                        {isActive && (
                          <Box position="absolute" bottom={-1} right={-1} color={accentColor}>
                            <FiCheckCircle />
                          </Box>
                        )}
                      </Box>
                      <Text fontWeight="medium">{option.label}</Text>
                    </Stack>
                  </GridItem>
                );
              })}
            </Grid>
          </CardBody>
        </Card>

        <Flex justify="flex-end">
          <Button
            colorScheme="teal"
            size="lg"
            onClick={handleSave}
            isDisabled={!hasChanges}
            isLoading={saving}
          >
            Guardar cambios
          </Button>
        </Flex>
      </Stack>
    </Box>
  );
};

export default Perfil;
