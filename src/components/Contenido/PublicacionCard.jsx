import {
  Badge,
  Box,
  Flex,
  HStack,
  IconButton,
  Text,
  Wrap,
  WrapItem,
  useColorModeValue,
} from "@chakra-ui/react";
import { FiTrash2, FiCalendar, FiUser, FiCheckSquare } from "react-icons/fi";
import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";

const CANAL_LABEL = {
  instagram: "IG",
  facebook: "FB",
  tiktok: "TikTok",
  tiendanube: "Nube",
};

const responsableLabel = (r) => {
  if (!r) return null;
  if (typeof r === "string") return null;
  const nombre = `${r.first_name || ""} ${r.last_name || ""}`.trim();
  return nombre || r.email || null;
};

const fmtFecha = (value) => {
  if (!value) return null;
  try {
    return new Date(value).toLocaleDateString("es-AR", { day: "2-digit", month: "short" });
  } catch {
    return null;
  }
};

export const PublicacionCard = ({ contenido, onEdit, onDelete }) => {
  const cardBg = useColorModeValue("white", "gray.800");
  const border = useColorModeValue("gray.200", "gray.700");
  const muted = useColorModeValue("gray.600", "gray.400");
  const hoverBorder = useColorModeValue("teal.400", "teal.300");

  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: contenido._id,
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.4 : 1,
  };

  const responsable = responsableLabel(contenido.responsable);
  const fecha = fmtFecha(contenido.fechaPublicacion);
  const checklist = Array.isArray(contenido.checklist) ? contenido.checklist : [];
  const checkDone = checklist.filter((i) => i?.done).length;
  const producto = contenido.producto;
  const productoNombre =
    producto && typeof producto === "object"
      ? `${producto.nombre ?? ""} ${producto.modelo ?? ""}`.trim()
      : null;

  return (
    <Box
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      onClick={() => onEdit(contenido)}
      bg={cardBg}
      borderWidth="1px"
      borderColor={border}
      borderRadius="lg"
      p={3}
      cursor="grab"
      _active={{ cursor: "grabbing" }}
      transition="border-color 0.15s ease"
      _hover={{ borderColor: hoverBorder }}
    >
      <Flex justify="space-between" align="flex-start" gap={2}>
        <Text fontWeight="semibold" fontSize="sm" noOfLines={2}>
          {contenido.titulo}
        </Text>
        <IconButton
          aria-label="Eliminar"
          icon={<FiTrash2 />}
          size="xs"
          variant="ghost"
          colorScheme="red"
          onClick={(e) => {
            e.stopPropagation();
            onDelete(contenido);
          }}
        />
      </Flex>

      <Wrap spacing={1} mt={2}>
        {(contenido.canales || []).map((c) => (
          <WrapItem key={c}>
            <Badge colorScheme="teal" variant="subtle" fontSize="0.65rem">
              {CANAL_LABEL[c] || c}
            </Badge>
          </WrapItem>
        ))}
        {contenido.tipo && (
          <WrapItem>
            <Badge colorScheme="gray" variant="subtle" fontSize="0.65rem" textTransform="capitalize">
              {contenido.tipo}
            </Badge>
          </WrapItem>
        )}
      </Wrap>

      {productoNombre && (
        <Text fontSize="xs" color={muted} mt={2} noOfLines={1}>
          🛋 {productoNombre}
        </Text>
      )}

      <HStack mt={2} spacing={3} color={muted} fontSize="xs" flexWrap="wrap">
        {responsable && (
          <HStack spacing={1}>
            <FiUser />
            <Text noOfLines={1}>{responsable}</Text>
          </HStack>
        )}
        {fecha && (
          <HStack spacing={1}>
            <FiCalendar />
            <Text>{fecha}</Text>
          </HStack>
        )}
        {checklist.length > 0 && (
          <HStack spacing={1}>
            <FiCheckSquare />
            <Text>
              {checkDone}/{checklist.length}
            </Text>
          </HStack>
        )}
      </HStack>
    </Box>
  );
};
