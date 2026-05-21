import { useCallback, useMemo } from "react";
import {
  Box,
  HStack,
  Text,
  useColorModeValue,
} from "@chakra-ui/react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import esLocale from "@fullcalendar/core/locales/es";

import "./UnifiedCalendar.css";

const Legend = () => {
  const labelColor = useColorModeValue("gray.600", "gray.300");
  const items = [
    { color: "#38A169", label: "Entregas" },
    { color: "#E53E3E", label: "Tareas" },
    { color: "#4299E1", label: "Eventos" },
  ];
  return (
    <HStack spacing={4} pb={2} flexWrap="wrap">
      {items.map((it) => (
        <HStack key={it.label} spacing={2}>
          <Box w={3} h={3} borderRadius="full" bg={it.color} />
          <Text fontSize="xs" color={labelColor}>
            {it.label}
          </Text>
        </HStack>
      ))}
    </HStack>
  );
};

/**
 * Calendario unificado basado en FullCalendar.
 * Reusable en Home y en /tareas.
 *
 * Props:
 * - events: array en formato FullCalendar
 * - onDateClick(date) - se dispara al hacer click en un día vacío o no
 * - onEventClick(eventInfo) - se dispara al hacer click sobre un evento puntual
 * - initialView: "dayGridMonth" (default), "dayGridWeek", "dayGridDay"
 * - height: number | string ("auto" por default)
 * - showLegend: boolean (true por default)
 */
export const UnifiedCalendar = ({
  events = [],
  onDateClick,
  onEventClick,
  initialView = "dayGridMonth",
  height = "auto",
  showLegend = true,
}) => {
  const cardBg = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.700");

  const headerToolbar = useMemo(
    () => ({
      left: "prev,next today",
      center: "title",
      right: "dayGridMonth,dayGridWeek,dayGridDay",
    }),
    []
  );

  const handleDateClick = useCallback(
    (arg) => {
      if (!onDateClick) return;
      onDateClick(arg.date);
    },
    [onDateClick]
  );

  const handleEventClick = useCallback(
    (info) => {
      if (!onEventClick) return;
      info.jsEvent?.preventDefault?.();
      onEventClick(info);
    },
    [onEventClick]
  );

  const buttonText = useMemo(
    () => ({
      today: "Hoy",
      month: "Mes",
      week: "Semana",
      day: "Día",
    }),
    []
  );

  const plugins = useMemo(
    () => [dayGridPlugin, interactionPlugin],
    []
  );

  return (
    <Box
      bg={cardBg}
      borderWidth="1px"
      borderColor={borderColor}
      borderRadius="xl"
      p={{ base: 3, md: 4 }}
      boxShadow="md"
      className="unified-calendar-wrapper"
    >
      {showLegend && <Legend />}
      <FullCalendar
        plugins={plugins}
        initialView={initialView}
        headerToolbar={headerToolbar}
        events={events}
        locale={esLocale}
        firstDay={1}
        height={height}
        dayMaxEvents={3}
        weekends={true}
        dateClick={handleDateClick}
        eventClick={handleEventClick}
        eventDisplay="block"
        nowIndicator={true}
        buttonText={buttonText}
      />
    </Box>
  );
};

export default UnifiedCalendar;
