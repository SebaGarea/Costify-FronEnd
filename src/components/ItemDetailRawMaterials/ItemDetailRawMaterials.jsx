import React, { useState } from "react";
import {
  Box,
  Container,
  Stack,
  Text,
  Image,
  Flex,
  VStack,
  Button,
  Heading,
  SimpleGrid,
  StackDivider,
  useColorModeValue,
  Center,
  HStack,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Alert,
  Toast,
  useToast,
} from "@chakra-ui/react";

import { FcMoneyTransfer, FcSettings } from "react-icons/fc";
import { GoArrowLeft } from "react-icons/go";
import { MdDeleteForever } from "react-icons/md";
import { Link, useNavigate } from "react-router-dom";
import { useDeleteMp } from "../../hooks/index.js";

export const ItemDetailRawMaterials = ({ RawMaterials }) => {
  const toast = useToast();
  const navigate = useNavigate();
  const { deleteMp, loading } = useDeleteMp();

  const { isOpen, onOpen, onClose } = useDisclosure();

  const handleDelete = async () => {
    console.log("ID a elimar", RawMaterials._id);

    if (!RawMaterials._id) {
      toast({
        title: "Error",
        description: "ID de materia prima no encontrado",
        status: "error",
        duration: 2000,
        isClosable: true,
      });
      return;
    }

    const ok = await deleteMp(RawMaterials._id);
    if (ok) {
      toast({
        title: "Materia Prima Eliminada.",
        description: "La Materia Prima fue eliminado correctamente.",
        status: "warning",
        duration: 2000,
        isClosable: true,
      });
      setTimeout(() => {
        navigate("/materias-primas");
      }, 1000);
    } else {
      toast({
        title: "La Materia Prima no se pudo ELIMINAR.",
        description: "La Materia Prima NO se pudo ELIMINAR..",
        status: "error",
        duration: 2000,
        isClosable: true,
      });
    }
  };

  return (
    <Container maxW={"7xl"}>
      <Box>
        <Button leftIcon={<GoArrowLeft />} as={Link} to={"/materias-primas"}>
          Volver a Materias Primas
        </Button>
      </Box>
      <SimpleGrid
        columns={{ base: 1, lg: 2 }}
        spacing={{ base: 8, md: 10 }}
        py={{ base: 18, md: 24 }}
      >
        <Stack spacing={{ base: 6, md: 10 }}>
          <Box as={"header"}>
            <Heading
              textAlign="center"
              lineHeight={1.1}
              fontWeight={600}
              fontSize={{ base: "2xl", sm: "4xl", lg: "5xl" }}
            >
              {RawMaterials.nombre}
            </Heading>
            <Box
              textAlign="center"
              color={useColorModeValue("gray.900", "gray.100")}
              fontWeight={200}
              fontSize={"md"}
              mt={3}
              textTransform={"uppercase"}
              as="span"
              display="block"
            >
              {RawMaterials.categoria}
            </Box>
            <Box
              textAlign="center"
              color={useColorModeValue("gray.900", "gray.100")}
              fontWeight={200}
              fontSize={"md"}
              mt={3}
              textTransform={"uppercase"}
              as="span"
              display="block"
            >
              Tipo: {RawMaterials.type}
            </Box>
            <Box
              textAlign="center"
              color={useColorModeValue("gray.900", "gray.100")}
              fontWeight={400}
              fontSize={"2xl"}
              mt={3}
              as="span"
              display="block"
            >
              <Flex align="center" justify="center" display="inline-flex">
                ${RawMaterials.precio}
                <Box as="span" ml={4}>
                  <FcMoneyTransfer />
                </Box>
              </Flex>
            </Box>
          </Box>
          <Stack
            spacing={{ base: 4, sm: 6 }}
            direction={"column"}
            divider={
              <StackDivider
                borderColor={useColorModeValue("gray.200", "gray.600")}
              />
            }
          >
            <VStack spacing={{ base: 4, sm: 6 }}>
              <Text
                color={useColorModeValue("gray.500", "gray.400")}
                fontSize={"2xl"}
                fontWeight={"300"}
              >
                {RawMaterials.medida}
              </Text>
              <Text
                color={useColorModeValue("gray.500", "gray.400")}
                fontSize={"lg"}
                fontWeight={"300"}
              >
                Stock: {RawMaterials.stock}
              </Text>
            </VStack>
          </Stack>
          <Center>
            <Button
              rounded={"15px"}
              w={"75%"}
              mt={1}
              size={"md"}
              py={"2"}
              bg={useColorModeValue("gray.900", "gray.300")}
              color={useColorModeValue("white", "gray.900")}
              textTransform={"uppercase"}
              _hover={{
                transform: "translateY(2px)",
                boxShadow: "lg",
              }}
            >
              Ver Planilla
            </Button>
          </Center>
          <Center>
            <Button
              as={Link}
              to={`/materias-primas/update/${RawMaterials._id}`}
              rightIcon={<FcSettings size={20} />}
              rounded={"15px"}
              w={"75%"}
              mt={1}
              size={"md"}
              py={"2"}
              bg={useColorModeValue("gray.900", "gray.300")}
              color={useColorModeValue("white", "gray.900")}
              textTransform={"uppercase"}
              _hover={{
                transform: "translateY(2px)",
                boxShadow: "lg",
              }}
            >
              Modificar Materia Primas
            </Button>
          </Center>
          <Center>
            <Button
              rightIcon={<MdDeleteForever size={24} />}
              rounded={"15px"}
              w={"75%"}
              mt={1}
              size={"md"}
              py={"2"}
              bg={"red.700"}
              color={"black"}
              textTransform={"uppercase"}
              _hover={{
                transform: "translateY(2px)",
                boxShadow: "lg",
              }}
              isLoading={loading}
              onClick={onOpen}
            >
              Eliminar Materia Prima
            </Button>
          </Center>
          <Modal isOpen={isOpen} onClose={onClose} isCentered>
            <ModalOverlay />
            <ModalContent>
              <ModalHeader>¿Eliminar Materia Prima?</ModalHeader>
              <ModalBody>
                ¿Estás seguro de que quieres eliminar esta Materia Prima? Esta
                acción no se puede deshacer.
              </ModalBody>
              <ModalFooter>
                <Button
                  colorScheme="red"
                  mr={3}
                  onClick={async () => {
                    await handleDelete();
                    onClose();
                  }}
                >
                  Sí, eliminar
                </Button>
                <Button variant="ghost" onClick={onClose}>
                  Cancelar
                </Button>
              </ModalFooter>
            </ModalContent>
          </Modal>
        </Stack>
      </SimpleGrid>
    </Container>
  );
};
