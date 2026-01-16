export const MATERIAL_TYPE_GROUPS = [
  { label: "Te", codes: ["0001"] },
  { label: "Angulo", codes: ["0002"] },
  { label: "Planchuela", codes: ["0003"] },
  { label: "Redondo", codes: ["0005", "0015"] },
  { label: "Cuadrado", codes: ["0007", "0016"] },
  { label: "Rectangular", codes: ["0017"] },
  { label: "Ruedas Ruleman", codes: ["0158"] },
  { label: "Varilla Roscada", codes: ["0473"] },
  { label: "Varilla Roscada Natural", codes: ["0474"] },
  { label: "Disco Corte", codes: ["1030"] },
  { label: "Disco Sensitiva", codes: ["1060"] },
  { label: "Disco Sensitiva Tyrolit", codes: ["0236"] },
  { label: "Disco Tyrolit", codes: ["0233"] },
  { label: "Desbaste", codes: ["0235"] },
  { label: "Municion", codes: ["0030"] },
  { label: "Mixta", codes: ["0031"] },
  { label: "Herreria", codes: ["0032"] },
  { label: "Trabex", codes: ["0045"] },
  { label: "Combinadas", codes: ["0092"] },
  { label: "Malla Soldada Galvanizada", codes: ["0025"] },
  { label: "Malla Soldada Negra", codes: ["0037"] },
  { label: "Metal Desplegado", codes: ["0237"] },
  { label: "Caja Cerradura", codes: ["0048"] },
  { label: "Cerrojos", codes: ["0117"] },
  { label: "Roma", codes: ["0522","0532","0534"] },
  { label: "Cinta Metrica Evel", codes: ["0570"] },
  { label: "Planchuela Perforada", codes: ["0682", "0683", "0684", "0685"] },
  { label: "Chapas Chicas", codes: ["0013"] },
  { label: "Chapas Grandes", codes: ["0014"] },
  { label: "Chapas Gruesas", codes: ["0329", "0330"] },
  { label: "Chapas Lisas Galvanizadas", codes: ["0326", "0332"] },
];

export const MATERIAL_TYPE_LABELS = MATERIAL_TYPE_GROUPS.reduce((acc, group) => {
  group.codes.forEach((code) => {
    acc[code] = group.label;
  });
  return acc;
}, {});

const LABEL_TO_CODES = MATERIAL_TYPE_GROUPS.reduce((acc, group) => {
  acc[group.label] = group.codes;
  return acc;
}, {});

export const getMaterialTypeLabel = (code = "") => MATERIAL_TYPE_LABELS[code] ?? code;

export const getCodesForMaterialTypeLabel = (label = "") => {
  if (!label) return [];
  return LABEL_TO_CODES[label] ?? [label];
};

export const mapCodesToTypeLabels = (codes = []) => {
  if (!Array.isArray(codes)) return [];
  const labels = codes.map((code) => MATERIAL_TYPE_LABELS[code] ?? code);
  return [...new Set(labels)];
};
