import { useEffect, useRef, useState } from 'react';
import { ApiError, type BlobResponse } from '../../api/apiClient';
import { downloadPdf } from '../../api/downloadPdf';
import { errorMessage } from '../residentes/shared';

export function usePdfDownload() {
  const pending = useRef<AbortController | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  useEffect(() => () => { pending.current?.abort(); }, []);

  async function run(request: (signal: AbortSignal) => Promise<BlobResponse>, filename: string) {
    if (pending.current) return;
    const controller = new AbortController();
    pending.current = controller;
    setLoading(true);
    setError('');
    setSuccess(false);
    try {
      const response = await request(controller.signal);
      if (controller.signal.aborted) return;
      downloadPdf(response, filename);
      setSuccess(true);
    } catch (cause) {
      if (!controller.signal.aborted) {
        setError(cause instanceof ApiError && cause.status === 403
          ? `Acceso denegado. ${cause.message}` : errorMessage(cause));
      }
    } finally {
      if (!controller.signal.aborted) setLoading(false);
      pending.current = null;
    }
  }
  return { loading, error, success, run, reset: () => { setError(''); setSuccess(false); } };
}
