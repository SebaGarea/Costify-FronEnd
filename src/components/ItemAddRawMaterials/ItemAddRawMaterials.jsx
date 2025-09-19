import {
  FormControl,
  FormLabel,
  Input,
  Stack,
  Button,
  Textarea,
  Flex,
  useToast,
} from "@chakra-ui/react";

import { useState } from "react";
import { useNavigate } from "react-router";
import { useAddMp } from "../../hooks/index.js";
import { useEffect } from "react";
import {
  getRawMaterialById,
  updateRawMaterial,
} from "../../services/products.service.js";

export const ItemAddRawMaterials = ({ RawMaterialId }) => {
  const [form, setForm] = useState({
    nombre: "",
    categoria: "",
    type: "",
    medida: "",
    precio: "",
    stock: "",
  });

  const toast = useToast();
  const navigate = useNavigate();
  const { addRawMaterial, loading, error } = useAddMp();

  useEffect(() => {
    if (RawMaterialId) {
      getRawMaterialById(RawMaterialId).then((res) => {
        setForm({
          nombre: res.data.nombre,
          categoria: res.data.categoria,
          type: res.date.type,
          medida: res.data.medida,
          precio: res.data.precio,
          stock: res.data.stock,
        });
      });
    }
  }, [RawMaterialId]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    let ok;
    if (RawMaterialId) {
      ok = await updateRawMaterial(RawMaterialId, form, true);
    } else {
      ok = await addRawMaterial(form, true);
    }
    if (ok) {
      toast({
        title: RawMaterialId
          ? "Materia Prima Actualizada"
          : "Materia Prima Agregada",
        description: RawMaterialId
          ? "La Materia Prima fue actualizada"
          : "La Materia Prima fue cargada con Exito",
        succes: "success",
        duration: 2000,
        isClosable: true,
      });
      setTimeout(() => {
        navigate("/materias-primas");
      }, 1000);
      setForm({
        nombre: "",
        categoria: "",
        type: "",
        medida: "",
        precio: "",
        stock: "",
      });
    }else{
      toast({
        title: "Error",
        description: error,
        status: "error",
        duration: 3000,
        isClosable: true,
      })
    }
  };

 const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };


  return (
    <Flex minH="auto" align="center" justify="center">
      <form onSubmit={handleSubmit}>
        <Stack
          w="100%"
          maxW="2xl"
          minW={{ base: "90vw", md: "700px" }}
          p={8}
          border="1px"
          borderRadius={20}
          spacing={4}
          boxShadow="md"
        >
          <FormControl>
            <FormLabel>Nombre del Material</FormLabel>
            <Input
              type="text"
              name="nombre"
              placeholder="Nombre del producto"
              value={form.nombre}
              onChange={handleChange}
              required
            />
          </FormControl>
          <FormControl>
            <FormLabel>Categoria</FormLabel>
            <Input
              type="text"
              name="categoria"
              placeholder="Categori del material"
              value={form.categoria}
              onChange={handleChange}
              required
            />
          </FormControl>
          <FormControl>
            <FormLabel>Tipo</FormLabel>
            <Input
              type="text"
              name="tipo"
              placeholder="Tipo"
              value={form.tipo}
              onChange={handleChange}
              required
            />
          </FormControl>
          <FormControl>
            <FormLabel>Precio</FormLabel>
            <Input
              type="number"
              name="precio"
              placeholder="Precio"
              value={form.precio}
              onChange={handleChange}
              required
            />
          </FormControl>
          <FormControl>
            <FormLabel>Medida</FormLabel>
            <Textarea
              name="medida"
              placeholder="Medida"
              value={form.medida}
              onChange={handleChange}
            />
          </FormControl>
          <FormControl>
            <FormLabel>Stock</FormLabel>
            <Textarea
              name="stock"
              placeholder="Stock"
              value={form.stock}
              onChange={handleChange}
            />
          </FormControl>

          <Button type="submit" colorScheme="teal" isLoading={loading}>
            {RawMaterialId ? "Actualizar Materia Prima" : "Agregar Materia Prima"}
          </Button>
        </Stack>
      </form>
    </Flex>
  );
};
