import { apiRequestBlob } from './apiClient';

export function descargarReporteClinico(residenteId: number, signal?: AbortSignal) {
  return apiRequestBlob(`/reportes/clinico/residentes/${residenteId}/pdf`, { signal });
}

export function descargarReporteOcupacion(signal?: AbortSignal) {
  return apiRequestBlob('/reportes/ocupacion/pdf', { signal });
}
