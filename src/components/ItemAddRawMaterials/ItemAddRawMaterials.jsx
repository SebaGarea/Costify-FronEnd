import {
  FormControl,
  FormLabel,
  Input,
  Stack,
  Button,
  Textarea,
  Flex,
  useToast,
  Select,
  HStack,
} from "@chakra-ui/react";

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAddMp, useUpdateRawMaterials } from "../../hooks/index.js";
import { useEffect } from "react";
import { getRawMaterialById } from "../../services/rawMaterials.service.js";

export const ItemAddRawMaterials = ({ RawMaterialId }) => {
  const [form, setForm] = useState({
    nombre: "",
    categoria: "",
    type: "",
    medida: "",
    unidad: "",
    precio: "",
    stock: "",
  });

  const toast = useToast();
  const navigate = useNavigate();

  const { addRawMaterial, loading: addLoading, error: addError } = useAddMp();
  const {
    updateRawMaterial,
    loading: updateLoading,
    error: updateError,
  } = useUpdateRawMaterials();

  const loading = RawMaterialId ? updateLoading : addLoading;
  const error = RawMaterialId ? updateError : addError;

  const categorias = ["Hierro", "Madera", "Pintura", "Herrajes", "Buloneria","Insumos"];

  const unidades = ["mm", "cm", "mts", "lts", "kg", "gr", "unidad", "m²", "pie²", "pulgadas"];

  const tiposPorCategoria = {
    Hierro: [
      "Cuadrado",
      "Rectangular",
      "Macizo",
      "Angulo",
      "Planchuela",
      "Tee",
      "Otros",
    ],
    Madera: [
      "Terciado",
      "Tablero",
      "Aglomerado",
      "MDF",
      "Machimbre",
      "Tabla",
      "Listón",
      "Otros",
    ],
    Pintura: ["Sintetico", "Antióxido","Laca", "Barniz", "Otros"],
    Herraje: [
      "Bisagras",
      "Manijas",
      "Cerraduras",
      "Picaportes",
      "Rieles",
      "Otros",
    ],
    Buloneria: [
      "Tornillos",
      "Tuercas",
      "Arandelas",
      "Clavos",
      "Tirafondos",
      "Otros",
    ],
    Insumos:[
      "Discos de Corte/Desbaste/Flap",
      "Discos Sensitiva",
      "Insumos MIG"
    ]
  };

  useEffect(() => {
    if (RawMaterialId) {
      getRawMaterialById(RawMaterialId)
        .then((res) => {
          const materiaPrima = res.data.materiaPrima || res.data;
          setForm({
            nombre: materiaPrima.nombre || "",
            categoria: materiaPrima.categoria || "",
            type: materiaPrima.type || "",
            medida: materiaPrima.medida || "",
            unidad: materiaPrima.unidad || "",
            precio: materiaPrima.precio || "",
            stock: materiaPrima.stock || "",
          });
        })
        .catch((error) => {
          console.error("Error al cargar materia prima:", error);
          toast({
            title: "Error",
            description: "No se pudo cargar la materia prima",
            status: "error",
            duration: 3000,
            isClosable: true,
          });
        });
    }
  }, [RawMaterialId, toast]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    let ok;
    if (RawMaterialId) {
      ok = await updateRawMaterial(RawMaterialId, form);
    } else {
      ok = await addRawMaterial(form);
    }
    if (ok) {
      toast({
        title: RawMaterialId
          ? "Materia Prima Actualizada"
          : "Materia Prima Agregada",
        description: RawMaterialId
          ? "La Materia Prima fue actualizada"
          : "La Materia Prima fue cargada con Exito",
        status: "success",
        duration: 1000,
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
        unidad: "",
        precio: "",
        stock: "",
      });
    } else {
      toast({
        title: "Error",
        description: error,
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    // Si cambia la categoría, resetea el tipo
    if (name === "categoria") {
      setForm({
        ...form,
        categoria: value,
        type: "", 
      });
    } else {
      setForm({
        ...form,
        [name]: value,
      });
    }
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
            <FormLabel>Categoria</FormLabel>
            <Select
              name="categoria"
              placeholder="Seleccione una Categoria"
              value={form.categoria}
              onChange={handleChange}
              required
            >
              {categorias.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </Select>
          </FormControl>
          <FormControl>
            <FormLabel>Nombre del Material</FormLabel>
            <Input
              type="text"
              name="nombre"
              placeholder="Nombre del material"
              value={form.nombre}
              onChange={handleChange}
              required
            />
          </FormControl>

          <FormControl>
            <FormLabel>Tipo</FormLabel>
            <Select
              name="type"
              placeholder="Seleccione un tipo"
              value={form.type}
              onChange={handleChange}
              isDisabled={!form.categoria}
              required
            >
              {form.categoria &&
                tiposPorCategoria[form.categoria]?.map((tipo) => (
                  <option key={tipo} value={tipo}>
                    {tipo}
                  </option>
                ))}
            </Select>
          </FormControl>
          
          <HStack spacing={4}>
            <FormControl>
              <FormLabel>Medida</FormLabel>
              <Input
                type="text"
                name="medida"
                placeholder="Medida"
                value={form.medida}
                onChange={handleChange}
              />
            </FormControl>
            <FormControl>
              <FormLabel>Unidad</FormLabel>
              <Select
                name="unidad"
                placeholder="Seleccionar unidad"
                value={form.unidad}
                onChange={handleChange}
              >
                {unidades.map((unidad) => (
                  <option key={unidad} value={unidad}>
                    {unidad}
                  </option>
                ))}
              </Select>
            </FormControl>
          </HStack>
          
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
            <FormLabel>Stock</FormLabel>
            <Input
              type="number"
              name="stock"
              placeholder="Stock"
              value={form.stock}
              onChange={handleChange}
              required
            />
          </FormControl>

          <Button type="submit" colorScheme="teal" isLoading={loading}>
            {RawMaterialId
              ? "Actualizar Materia Prima"
              : "Agregar Materia Prima"}
          </Button>
        </Stack>
      </form>
    </Flex>
  );
};
