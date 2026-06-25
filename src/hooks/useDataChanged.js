import { useEffect, useRef } from "react";

/**
 * Escucha el evento global "costify:data-changed" que emite el chat de IA cuando
 * crea/modifica datos, y ejecuta el handler para refrescar la vista.
 *
 * @param {(entities: string[]) => void} handler - qué refrescar.
 * @param {string[]} [entidades] - filtro opcional: solo dispara si alguna de
 *   estas entidades cambió (ej: ["tarea"]). Si se omite, dispara siempre.
 */
export const useDataChanged = (handler, entidades) => {
  // Ref para llamar siempre al handler más reciente sin re-suscribir.
  const handlerRef = useRef(handler);
  handlerRef.current = handler;

  useEffect(() => {
    const onChange = (e) => {
      const cambiadas = e?.detail?.entities;
      if (
        entidades?.length &&
        Array.isArray(cambiadas) &&
        !cambiadas.some((x) => entidades.includes(x))
      ) {
        return;
      }
      handlerRef.current?.(cambiadas);
    };
    window.addEventListener("costify:data-changed", onChange);
    return () => window.removeEventListener("costify:data-changed", onChange);
    // entidades es estático por uso; lo serializamos para deps estables.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(entidades)]);
};
