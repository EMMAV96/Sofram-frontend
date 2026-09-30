import { useEffect, useState } from 'react';
import { errorMessage } from '../residentes/shared';

// Defer the request one microtask so StrictMode's discarded effect does not issue a duplicate GET.
export function useDashboardResource<T>(loader: (signal?: AbortSignal) => Promise<T[]>, enabled: boolean) {
  const [revision, setRevision] = useState(0);
  const [state, setState] = useState<{ data: T[]; loading: boolean; error: string }>({ data: [], loading: enabled, error: '' });
  useEffect(() => {
    if (!enabled) return;
    const controller = new AbortController();
    setState({ data: [], loading: true, error: '' });
    void Promise.resolve().then(async () => {
      if (controller.signal.aborted) return;
      try {
        const data = await loader(controller.signal);
        if (!controller.signal.aborted) setState({ data, loading: false, error: '' });
      } catch (error) {
        if (!controller.signal.aborted) setState({ data: [], loading: false, error: errorMessage(error) });
      }
    });
    return () => controller.abort();
  }, [loader, enabled, revision]);
  return { ...state, reload: () => setRevision(value => value + 1) };
}
