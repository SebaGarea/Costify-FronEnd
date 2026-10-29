// Utilidades compartidas por la sección Caja, Ventas y Lista de compras.

export const currencyFormatter = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  maximumFractionDigits: 0,
});

export const formatMoney = (value) => currencyFormatter.format(Number(value) || 0);

// Mensaje de error del backend (errorHandler devuelve `mensaje`).
export const getApiError = (error, fallback = "Intentá nuevamente en unos segundos.") =>
  error?.response?.data?.mensaje || error?.response?.data?.error || error?.message || fallback;

const TZ = "America/Argentina/Buenos_Aires";

// Fecha de hoy (Argentina) en formato YYYY-MM-DD, para inputs type="date".
export const hoyISO = () => new Intl.DateTimeFormat("en-CA", { timeZone: TZ }).format(new Date());

// Las fechas de movimientos se guardan al mediodía UTC: se muestran en UTC
// para que nunca se corran de día.
export const formatFecha = (value) => {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("es-AR", { timeZone: "UTC", day: "2-digit", month: "2-digit", year: "numeric" });
};

export const fechaInput = (value) => {
  if (!value) return "";
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? "" : d.toISOString().slice(0, 10);
};

export const rangoDeMes = (yyyyMm) => {
  const [y, m] = yyyyMm.split("-").map(Number);
  const ultimo = new Date(Date.UTC(y, m, 0)).getUTCDate();
  const mm = String(m).padStart(2, "0");
  return { desde: `${y}-${mm}-01`, hasta: `${y}-${mm}-${String(ultimo).padStart(2, "0")}` };
};

export const mesActual = () => hoyISO().slice(0, 7);

export const nombreMes = (yyyyMm, { corto = false } = {}) => {
  const [y, m] = yyyyMm.split("-").map(Number);
  const label = new Date(Date.UTC(y, m - 1, 15)).toLocaleDateString("es-AR", {
    timeZone: "UTC",
    month: corto ? "short" : "long",
    ...(corto ? {} : { year: "numeric" }),
  });
  return label.charAt(0).toUpperCase() + label.slice(1);
};

export const TIPOS_MOVIMIENTO = {
  ingreso: { label: "Ingreso", color: "green", signo: "+" },
  egreso: { label: "Egreso", color: "red", signo: "−" },
  transferencia: { label: "Transferencia", color: "blue", signo: "" },
  ajuste: { label: "Ajuste", color: "gray", signo: "" },
};

export const TIPOS_CUENTA = [
  { value: "efectivo", label: "Efectivo" },
  { value: "billetera", label: "Billetera virtual" },
  { value: "banco", label: "Banco" },
];

export const COLORES = ["green", "blue", "orange", "purple", "teal", "red", "pink", "cyan", "yellow", "gray"];
