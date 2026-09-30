import { useEffect, useRef, useState } from 'react';
import { listarActividadesPorDetalle, type ActividadResponse } from '../../api/actividadesApi';
import { errorMessage } from '../residentes/shared';

export type ActividadesFranja = { loading: boolean; data?: ActividadResponse[]; error?: string };

// Caché por detalle durante la visita al calendario. Cambiar de vista o mes
// no dispara nuevas consultas. Sólo se reintenta la franja solicitada.
export function useActividadesCalendario(detalleIds: number[], enabled: boolean) {
  const key = Array.from(new Set(detalleIds)).sort((a, b) => a - b).join(',');
  const cache = useRef(new Map<number, ActividadesFranja>());
  const [entries, setEntries] = useState<Record<number, ActividadesFranja>>({});
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    if (!enabled || !key) return;
    const controller = new AbortController();
    const pending = key.split(',').map(Number).filter(id => !cache.current.has(id));
    let index = 0;
    async function worker() {
      while (index < pending.length && !controller.signal.aborted) {
        const id = pending[index++];
        setEntries(previous => ({ ...previous, [id]: { loading: true } }));
        let result: ActividadesFranja;
        try { result = { loading: false, data: await listarActividadesPorDetalle(id, controller.signal) }; }
        catch (error: unknown) { result = { loading: false, error: errorMessage(error) }; }
        if (controller.signal.aborted) return;
        cache.current.set(id, result);
        setEntries(previous => ({ ...previous, [id]: result }));
      }
    }
    // Limitar consultas concurrentes sin bloquear la agenda ni otras franjas.
    void Promise.all(Array.from({ length: Math.min(4, pending.length) }, worker));
    return () => controller.abort();
  }, [key, enabled, revision]);
  return { entries, retry: (id: number) => { cache.current.delete(id); setRevision(value => value + 1); } };
}
