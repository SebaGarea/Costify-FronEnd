import { useMemo } from "react";
import { useGetAllVentas } from "../ventas/useGetAllVentas.js";
import { useGetTareasPaginated } from "../tareas/useGetTareasPaginated.js";
import { useGetEventos } from "../eventosCalendario/useGetEventos.js";

const getProductLabel = (venta = {}) => {
  if (venta?.productoNombre) return venta.productoNombre;
  if (venta?.producto) {
    const nombre = venta.producto.nombre ?? "";
    const modelo = venta.producto.modelo ?? "";
    const label = `${nombre} ${modelo}`.trim();
    return label || "Producto sin nombre";
  }
  return "Producto sin nombre";
};

const capitalizeLabel = (value = "") =>
  value ? value.charAt(0).toUpperCase() + value.slice(1) : "";

const buildDayKey = (date) =>
  `${date.getUTCFullYear()}-${date.getUTCMonth()}-${date.getUTCDate()}`;

// Colores: entregas=verde fuerte, tareas=rojo, eventos=celeste
const COLORS = {
  venta: "#38A169",   // green.500
  tarea: "#E53E3E",   // red.500
  evento: "#4299E1",  // blue.400 (celeste)
};

// Estados de venta que se consideran "terminadas" → no se muestran en el calendario.
const VENTA_ESTADOS_OCULTOS = ["despachada", "cancelada"];

const toIsoDate = (date) => {
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return null;
  const yyyy = d.getUTCFullYear();
  const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(d.getUTCDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
};

/**
 * Hook unificado para el calendario.
 * Combina ventas (fechaLimite), tareas pendientes (dueDate) y eventos manuales (fecha)
 * en un único array `events` formateado para FullCalendar.
 *
 * También retorna `itemsByDay` (Map<string, item[]>) usado por el modal de día.
 */
export const useCalendarEvents = ({ ventasDataExt, tareasDataExt } = {}) => {
  // Ventas: si vienen de afuera (HomeView ya las tiene), reusar para no doble fetch
  const ventasInternal = useGetAllVentas();
  const ventasData = ventasDataExt ?? ventasInternal.ventasData ?? [];

  // Tareas: usar datos externos si se proveen (TareasView los maneja), sino fetch propio
  const { items: tareasInternal = [], refetch: refetchTareas } = useGetTareasPaginated(1, 500);
  const tareasItems = tareasDataExt ?? tareasInternal;

  // Eventos manuales
  const { items: eventosItems = [], refetch: refetchEventos } = useGetEventos();

  const { events, itemsByDay } = useMemo(() => {
    const fcEvents = [];
    const byDay = new Map();
    const pushDay = (key, item) => {
      const arr = byDay.get(key) || [];
      arr.push(item);
      byDay.set(key, arr);
    };

    // 1) Ventas no terminadas con fecha límite de entrega
    (ventasData || []).forEach((venta) => {
      if (VENTA_ESTADOS_OCULTOS.includes(venta?.estado)) return;
      const entregaRaw = venta?.fechaLimite || venta?.fechaEntrega;
      if (!entregaRaw) return;
      const entregaDate = new Date(entregaRaw);
      if (Number.isNaN(entregaDate.getTime())) return;

      const clienteNombre =
        venta?.cliente?.nombre ||
        venta?.clienteNombre ||
        (typeof venta?.cliente === "string" ? venta.cliente : "");
      const estadoLabel =
        typeof venta?.estado === "string"
          ? capitalizeLabel(venta.estado.replace(/_/g, " "))
          : "";

      const title = getProductLabel(venta);
      const itemModal = {
        id: `venta-${venta?._id || buildDayKey(entregaDate)}`,
        type: "venta",
        title,
        subtitle: clienteNombre ? `Cliente: ${clienteNombre}` : "",
        raw: { ...venta, estado: estadoLabel },
      };
      const dayKey = buildDayKey(entregaDate);
      pushDay(dayKey, itemModal);

      fcEvents.push({
        id: itemModal.id,
        title: `🚚 ${title}`,
        start: toIsoDate(entregaDate),
        allDay: true,
        backgroundColor: COLORS.venta,
        borderColor: COLORS.venta,
        textColor: "#fff",
        extendedProps: { type: "venta", raw: venta, modalItem: itemModal, dayKey },
      });
    });

    // 2) Tareas no terminadas: se muestran todas las que no estén "hecho".
    // Se ubican por dueDate; si faltara, por createdAt (fallback de seguridad).
    (tareasItems || []).forEach((t) => {
      if (!t || t.status === "hecho") return;
      const fechaRaw = t.dueDate || t.createdAt;
      if (!fechaRaw) return;
      const fecha = new Date(fechaRaw);
      if (Number.isNaN(fecha.getTime())) return;

      const tareaTag = Array.isArray(t.tags) && t.tags.length ? capitalizeLabel(t.tags[0]) : null;
      const tareaSubtitle = [tareaTag, t.notes || ""].filter(Boolean).join(" · ");
      const itemModal = {
        id: `tarea-${t?._id}`,
        type: "tarea",
        title: t.title || "Tarea",
        subtitle: tareaSubtitle,
        raw: t,
      };
      const dayKey = buildDayKey(fecha);
      pushDay(dayKey, itemModal);

      fcEvents.push({
        id: itemModal.id,
        title: `📋 ${t.title || "Tarea"}`,
        start: toIsoDate(fecha),
        allDay: true,
        backgroundColor: COLORS.tarea,
        borderColor: COLORS.tarea,
        textColor: "#fff",
        extendedProps: { type: "tarea", raw: t, modalItem: itemModal, dayKey },
      });
    });

    // 3) Eventos manuales
    (eventosItems || []).forEach((ev) => {
      if (!ev?.fecha) return;
      const fecha = new Date(ev.fecha);
      if (Number.isNaN(fecha.getTime())) return;

      const itemModal = {
        id: `evento-${ev?._id}`,
        type: "evento",
        title: ev.title,
        subtitle: ev.hora ? `Hora: ${ev.hora}` : "",
        raw: ev,
      };
      const dayKey = buildDayKey(fecha);
      pushDay(dayKey, itemModal);

      fcEvents.push({
        id: itemModal.id,
        title: ev.hora ? `📅 ${ev.title} (${ev.hora})` : `📅 ${ev.title}`,
        start: toIsoDate(fecha),
        allDay: true,
        backgroundColor: COLORS.evento,
        borderColor: COLORS.evento,
        textColor: "#fff",
        extendedProps: { type: "evento", raw: ev, modalItem: itemModal, dayKey },
      });
    });

    return { events: fcEvents, itemsByDay: byDay };
  }, [ventasData, tareasItems, eventosItems]);

  const refetchAll = () =>
    Promise.all([
      tareasDataExt ? Promise.resolve() : (refetchTareas?.() ?? Promise.resolve()),
      refetchEventos?.() ?? Promise.resolve(),
    ]);

  return {
    events,
    itemsByDay,
    buildDayKey,
    refetchEventos,
    refetchTareas,
    refetchAll,
  };
};
