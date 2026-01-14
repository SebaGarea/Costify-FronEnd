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
    espesor: "",
    unidad: "unidad",
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

  const categorias = ["Hierro", "Caños", "Insumos", "Proteccion", "Madera", "Herrajes", "Otros"];
  const categoriaOptions =
    form.categoria && !categorias.includes(form.categoria)
      ? [...categorias, form.categoria]
      : categorias;

  const unidades = ["mm", "cm", "mts", "lts", "kg", "gr", "unidad", "m²", "pie²", "pulgadas","calibre"];

  const tiposPorCategoria = {
    Hierro: [
      "Macizo Cuadrado",
      "Macizo Redondo",
      "Planchuela",
      "Tee",
      "Angulo",
    ],
    "Caños": [
      "Rectangular",
      "Cuadrado",
      "Redondo",
    ],
    Insumos: ["Consumibles Soldadora", "Discos", "Ferreteria"],
    Proteccion: [
      "Sintetica",
      "Laca Poliuretanica",
      "Barniz",
      "Impregnante",
      "Aerosol",
    ],
    Madera: [
      "Maciza",
      "Enchapado",
      "Melamina",
    ],
    Herrajes:[
      "Bisagras Ocultas",
      "Bisagras Elevables",
      "Correderas",
      "Tiradores",
      "Cerraduras",
      "Tornillos",
      "Tirafondos"
    ],
    Otros: [
    ]
  };

  const tipoOptions = form.categoria ? tiposPorCategoria[form.categoria] || [] : [];
  const isNombreAuto = form.categoria === "Hierro" || form.categoria === "Caños";

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
            espesor: materiaPrima.espesor || "",
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

    const requiredFields = [
      "categoria",
      "nombre",
      "type",
      "unidad",
      "precio",
      "stock",
    ];

    const missingFields = requiredFields.filter((field) => {
      const value = form[field];
      return value === "" || value === null || value === undefined;
    });

    if (missingFields.length > 0) {
      toast({
        title: "Datos incompletos",
        description: `Completá los campos obligatorios: ${missingFields
          .map((field) => field.toUpperCase())
          .join(", ")}`,
        status: "warning",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    if (Number(form.precio) <= 0) {
      toast({
        title: "Precio inválido",
        description: "El precio debe ser mayor a 0",
        status: "warning",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

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
        espesor: "",
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
      const isAuto = value === "Hierro" || value === "Caños";
      setForm({
        ...form,
        categoria: value,
        type: "",
        nombre: isAuto ? "" : form.nombre,
      });
      return;
    }

    if (name === "type" && (form.categoria === "Hierro" || form.categoria === "Caños")) {
      setForm({
        ...form,
        type: value,
        nombre: value,
      });
      return;
    }

    setForm({
      ...form,
      [name]: value,
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
            <FormLabel>Categoria</FormLabel>
            <Select
              name="categoria"
              placeholder="Seleccione una Categoria"
              value={form.categoria}
              onChange={handleChange}
              required
            >
              {categoriaOptions.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </Select>
          </FormControl>
          
          <FormControl>
            <FormLabel>Tipo</FormLabel>
            {form.categoria && tipoOptions.length === 0 ? (
              <Input
                type="text"
                name="type"
                placeholder="Ingresá el tipo"
                value={form.type}
                onChange={handleChange}
                required
              />
            ) : (
              <Select
                name="type"
                placeholder="Seleccione un tipo"
                value={form.type}
                onChange={handleChange}
                isDisabled={!form.categoria}
                required
              >
                {form.categoria &&
                  tipoOptions.map((tipo) => (
                    <option key={tipo} value={tipo}>
                      {tipo}
                    </option>
                  ))}
              </Select>
            )}
          </FormControl>

          <FormControl>
            <FormLabel>Nombre del Material</FormLabel>
            <Input
              type="text"
              name="nombre"
              placeholder="Nombre del material"
              value={isNombreAuto ? form.type || form.nombre : form.nombre}
              onChange={(e) => {
                if (isNombreAuto) return;
                handleChange(e);
              }}
              isReadOnly={isNombreAuto}
              required
            />
          </FormControl>
          
          <HStack spacing={4}>
            <FormControl>
              <FormLabel>Medida</FormLabel>
              <Input
                type="text"
                name="medida"
                placeholder="30x30"
                value={form.medida}
                onChange={handleChange}
              />
            </FormControl>
            <FormControl>
              <FormLabel>Espesor</FormLabel>
              <Input
                type="text"
                name="espesor"
                placeholder="1.2mm"
                value={form.espesor}
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
