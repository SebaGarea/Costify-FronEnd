import {
  Box,
  Center,
  useColorModeValue,
  Heading,
  Text,
  Stack,
  SimpleGrid,
  Button,
  HStack,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Spacer,
} from "@chakra-ui/react";
import { FiChevronDown, FiPlus } from "react-icons/fi";
import { useCategoryMp } from "../../hooks/materiasPrimas";
import { useState } from "react";
import { Link } from "react-router-dom";
import { RiArrowRightLine } from "react-icons/ri";

export const ItemListContainerRawMaterials = ({ rawMaterials }) => {
  const { categoriesMp } = useCategoryMp();

  // Estados para los filtros
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedType, setSelectedType] = useState(null);
  const [selectedMedida, setSelectedMedida] = useState(null);

  const filteredByCategory = selectedCategory
    ? rawMaterials.filter((mp) => mp.categoria === selectedCategory)
    : rawMaterials;

  const tipos = [
    ...new Set(filteredByCategory.map((mp) => mp.type).filter(Boolean)),
  ];
  const filteredByType = selectedType
    ? filteredByCategory.filter((mp) => mp.type === selectedType)
    : filteredByCategory;

  const medidas = [
    ...new Set(filteredByType.map((mp) => mp.medida).filter(Boolean)),
  ];
  const filteredByMedida = selectedMedida
    ? filteredByType.filter((mp) => mp.medida === selectedMedida)
    : filteredByType;

  return (
    <>
      <Box
        mb={6}
        p={4}
        bg={useColorModeValue("gray.100", "gray.700")}
        borderRadius="lg"
        w={"min-content"}
        justifyContent={"center"}
      >
        <HStack spacing={4} justify="center">
          {/* Dropdown Categoría */}
          <Menu>
            <MenuButton as={Button} rightIcon={<FiChevronDown />}>
              {selectedCategory || "Categoría"}
            </MenuButton>
            <MenuList minW="150px">
              {categoriesMp.map((cat) => (
                <MenuItem
                  justifyContent={"center"}
                  key={cat.nombre}
                  onClick={() => {
                    setSelectedCategory(cat.nombre);
                    setSelectedType(null); // Reset tipo y medida al cambiar categoría
                    setSelectedMedida(null);
                  }}
                >
                  {cat.nombre}
                </MenuItem>
              ))}
            </MenuList>
          </Menu>
          {/* Dropdown Tipo */}
          <Menu>
            <MenuButton
              as={Button}
              rightIcon={<FiChevronDown />}
              isDisabled={!selectedCategory || tipos.length === 0}
            >
              {selectedType || "Tipo"}
            </MenuButton>
            <MenuList minW="120px">
              {tipos.map((tipo) => (
                <MenuItem
                  justifyContent={"center"}
                  key={tipo}
                  onClick={() => {
                    setSelectedType(tipo);
                    setSelectedMedida(null); // Reset medida al cambiar tipo
                  }}
                >
                  {tipo}
                </MenuItem>
              ))}
            </MenuList>
          </Menu>

          {/* Dropdown Medida */}
          <Menu>
            <MenuButton
              as={Button}
              rightIcon={<FiChevronDown />}
              isDisabled={!selectedType || medidas.length === 0}
            >
              {selectedMedida || "Medida"}
            </MenuButton>
            <MenuList>
              {medidas.map((medida) => (
                <MenuItem
                  justifyContent={"center"}
                  key={medida}
                  onClick={() => setSelectedMedida(medida)}
                >
                  {medida}
                </MenuItem>
              ))}
            </MenuList>
          </Menu>

          {(selectedCategory || selectedType || selectedMedida) && (
            <Button
              colorScheme="red"
              variant="outline"
              onClick={() => {
                setSelectedCategory(null);
                setSelectedType(null);
                setSelectedMedida(null);
              }}
            >
              Borrar Filtros
            </Button>
          )}

          <Spacer />

          <Button
            as={Link}
            to={"/materias-primas/itemAdd"}
            leftIcon={<FiPlus color="#67e8f9" size={"25"} strokeWidth={4} />}
            mr={15}
          >
            Agregar Materia Prima
          </Button>
        </HStack>
      </Box>

      <Center py={12}>
        <SimpleGrid columns={{ base: 1, sm: 2, md: 3, lg: 4 }} spacing={8}>
          {filteredByMedida.map((mp) => (
            <Box
              key={mp._id}
              p={6}
              maxW={"330px"}
              w={"full"}
              bg={useColorModeValue("white", "gray.800")}
              boxShadow={"2xl"}
              rounded={"lg"}
            >
              <Stack align={"center"}>
                <Heading fontSize={"md"} fontWeight={500}>
                  {mp.nombre}
                </Heading>
                <Text color={"gray.500"} fontSize={"sm"}>
                  {mp.categoria}
                </Text>
                <Text fontSize={"sm"} color={"gray.600"}>
                  Stock: {mp.stock}
                </Text>
                <Text fontSize={"sm"} color={"gray.600"}>
                  Tipo: {mp.type}
                </Text>
                <Text fontSize={"sm"} color={"gray.600"}>
                  Medida: {mp.medida}
                </Text>
                <Text fontSize={"sm"} color={"gray.300"}>
                  Precio: $ {mp.precio}
                </Text>
                <Text fontSize={"sm"} color={"gray.600"}>
                  ID MONGO: {mp._id}
                </Text>
                <HStack>
                                  <Button
                                    as={Link}
                                    to={`/api/materiasPrimas/${mp._id}`}
                                    colorScheme="teal"
                                    variant="outline"
                                    m={2}
                                  >
                                    Ver Detalle
                                    <Box as="span" ml={2}>
                                      <RiArrowRightLine />
                                    </Box>
                                  </Button>
                                </HStack>
              </Stack>
            </Box>
          ))}
        </SimpleGrid>
      </Center>
    </>
  );
};
