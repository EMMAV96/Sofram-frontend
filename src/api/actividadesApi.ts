import { apiRequest } from './apiClient';

export interface ActividadRequest {
  detalleCalendarioId: number;
  empleadoId: number;
  nombre: string;
  descripcion?: string | null;
  tipo: string;
  duracion: number;
  cupoMaximo: number;
  estado: string;
}
export interface ActividadResponse {
  id: number;
  detalleCalendarioId: number;
  empleadoId: number;
  nombre: string;
  descripcion: string | null;
  tipo: string;
  duracion: number;
  cupoMaximo: number;
  estado: string;
}
export interface ParticipacionActividadRequest {
  actividadId: number;
  residenteId: number;
  fecha: string;
  asistencia: boolean;
  estado: string;
  observaciones?: string | null;
}
export interface ParticipacionActividadResponse {
  id: number;
  actividadId: number;
  residenteId: number;
  fecha: string;
  asistencia: boolean;
  estado: string;
  observaciones: string | null;
}
export interface AsistenciaActividadRequest {
  asistencia: boolean;
  estado: string;
  observaciones?: string | null;
}

export const listarActividades = (signal?: AbortSignal) => apiRequest<ActividadResponse[]>('/actividades', { signal });
export const obtenerActividad = (id: number, signal?: AbortSignal) => apiRequest<ActividadResponse>(`/actividades/${id}`, { signal });
export const listarActividadesPorDetalle = (id: number, signal?: AbortSignal) => apiRequest<ActividadResponse[]>(`/actividades/detalle-calendario/${id}`, { signal });
export const listarActividadesPorEmpleado = (id: number, signal?: AbortSignal) => apiRequest<ActividadResponse[]>(`/actividades/empleado/${id}`, { signal });
export const crearActividad = (request: ActividadRequest) => apiRequest<ActividadResponse>('/actividades', { method: 'POST', body: request });
export const crearParticipacion = (request: ParticipacionActividadRequest) => apiRequest<ParticipacionActividadResponse>('/participaciones-actividades', { method: 'POST', body: request });
export const obtenerParticipacion = (id: number, signal?: AbortSignal) => apiRequest<ParticipacionActividadResponse>(`/participaciones-actividades/${id}`, { signal });
export const listarParticipacionesPorActividad = (id: number, signal?: AbortSignal) => apiRequest<ParticipacionActividadResponse[]>(`/participaciones-actividades/actividad/${id}`, { signal });
export const listarParticipacionesPorResidente = (id: number, signal?: AbortSignal) => apiRequest<ParticipacionActividadResponse[]>(`/participaciones-actividades/residente/${id}`, { signal });
export const actualizarAsistencia = (id: number, request: AsistenciaActividadRequest) => apiRequest<ParticipacionActividadResponse>(`/participaciones-actividades/${id}/asistencia`, { method: 'PUT', body: request });
