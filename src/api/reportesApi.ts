import { apiRequestBlob } from './apiClient';

export function descargarReporteActividad(actividadId: number, signal?: AbortSignal) {
  return apiRequestBlob(`/reportes/actividades/${actividadId}/pdf`, { signal });
}

export function descargarReporteClinico(residenteId: number, signal?: AbortSignal) {
  return apiRequestBlob(`/reportes/clinico/residentes/${residenteId}/pdf`, { signal });
}

export function descargarReporteOcupacion(signal?: AbortSignal) {
  return apiRequestBlob('/reportes/ocupacion/pdf', { signal });
}
