import { useState } from "react";
import {
  Box,
  Button,
  Heading,
  Text,
  VStack,
  Input,
  useColorModeValue,
  useToast,
  HStack,
  Icon,
  Divider,
} from "@chakra-ui/react";
import { FiArrowLeft, FiUploadCloud } from "react-icons/fi";
import { importRawMaterialsExcel } from "../services/rawMaterials.service";
import { useNavigate } from "react-router-dom";

export const ImportRawMaterials = () => {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [summary, setSummary] = useState(null);
  const toast = useToast();
  const navigate = useNavigate();
  const cardBg = useColorModeValue("white", "gray.800");
  const muted = useColorModeValue("gray.600", "gray.300");
  const inputBg = useColorModeValue("gray.50", "gray.700");

  const handleFileChange = (event) => {
    setFile(event.target.files?.[0] || null);
    setSummary(null);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!file) {
      toast({
        title: "Selecciona un archivo",
        description: "Necesitamos un Excel .xlsx con los datos del proveedor.",
        status: "warning",
        duration: 4000,
        isClosable: true,
      });
      return;
    }

    try {
      setUploading(true);
      const { data } = await importRawMaterialsExcel(file);
      setSummary(data);
      toast({
        title: "Importacion completada",
        description: "Revisa el resumen para confirmar los cambios.",
        status: "success",
        duration: 4000,
        isClosable: true,
      });
    } catch (error) {
      const message =
        error?.response?.data?.message || "No pudimos subir el archivo.";
      toast({
        title: "Error al importar",
        description: message,
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <Box maxW="3xl" mx="auto" px={4} py={8}>
      <Button
        leftIcon={<FiArrowLeft />}
        variant="ghost"
        mb={6}
        onClick={() => navigate("/materias-primas")}
      >
        Volver a materias primas
      </Button>

      <Box
        as="form"
        onSubmit={handleSubmit}
        bg={cardBg}
        p={8}
        rounded="xl"
        boxShadow="xl"
      >
        <VStack spacing={4} align="stretch">
          <Heading size="lg">Subir el Excel del proveedor</Heading>
          <Text color={muted}>
            El archivo debe seguir el layout acordado (mismas columnas y nombres)
            para que podamos mapear los codigos, precios y medidas sin errores.
          </Text>

          <Input
            type="file"
            accept=".xlsx,.xls"
            onChange={handleFileChange}
            bg={inputBg}
            border="none"
            py={8}
          />

          <Button
            type="submit"
            colorScheme="teal"
            size="lg"
            leftIcon={<Icon as={FiUploadCloud} />}
            isLoading={uploading}
            loadingText="Subiendo..."
            isDisabled={uploading}
            mt={4}
          >
            Subir archivo
          </Button>

          {summary && (
            <Box mt={4} borderWidth="1px" borderRadius="lg" p={5}>
              <Heading size="md" mb={2}>
                Resumen de importacion
              </Heading>
              <Text color={muted} mb={4}>
                {"inserted" in summary || "updated" in summary
                  ? "Cantidad de registros afectados"
                  : "Respuesta completa"}
              </Text>
              <VStack align="stretch" spacing={2}>
                {Object.entries(summary).map(([key, value]) => (
                  <HStack
                    key={key}
                    justify="space-between"
                    borderWidth="1px"
                    borderRadius="md"
                    p={2}
                  >
                    <Text textTransform="capitalize">{key}</Text>
                    <Text fontWeight="bold">
                      {typeof value === "object"
                        ? JSON.stringify(value)
                        : String(value)}
                    </Text>
                  </HStack>
                ))}
              </VStack>
            </Box>
          )}

          <Divider />
          {/* <Text fontSize="sm" color={muted}>
            Consejo: Podes subir el Excel cada vez que el proveedor actualice los
            precios. Nosotros vamos a recalcular los valores de materias primas
            automáticamente con los nuevos datos.
          </Text> */}
        </VStack>
      </Box>
    </Box>
  );
};
