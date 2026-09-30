import { apiRequest } from './apiClient';

export interface ResidenteUpdateRequest {
  nombre: string;
  apellido: string;
  dni: string;
  fechaNacimiento: string;
  direccion: string | null;
  telefono: string | null;
  email: string | null;
  telefonoEmergencia: string | null;
  familiarACargo: string | null;
  fechaIngreso: string;
  fechaEgreso: string | null;
  obraSocial: string | null;
  habitacionId: number;
}

export interface ResidenteResponse extends ResidenteUpdateRequest {
  id: number;
  habitacionNumero: string;
  estadoActual: string;
}

export interface ResidenteCreateRequest extends ResidenteUpdateRequest {
  estadoInicialId: number;
}

export interface CambioEstadoRequest {
  estadoId: number;
  fechaCambio: string;
  observacion: string | null;
}

export interface EgresoResidenteRequest {
  fechaEgreso: string;
  estadoId: number;
  observacion?: string;
}

export interface HistorialEstadoResponse extends CambioEstadoRequest {
  id: number;
  residenteId: number;
  estado: string;
}

export interface EstadoResidenteResponse {
  id: number;
  nombre: string;
}

export const listarResidentes = (signal?: AbortSignal) => apiRequest<ResidenteResponse[]>('/residentes', { signal });
export const obtenerResidente = (id: number, signal?: AbortSignal) => apiRequest<ResidenteResponse>(`/residentes/${id}`, { signal });
export const crearResidente = (body: ResidenteCreateRequest) => apiRequest<unknown>('/residentes', { method: 'POST', body });
export const actualizarResidente = (id: number, body: ResidenteUpdateRequest) => apiRequest<unknown>(`/residentes/${id}`, { method: 'PUT', body });
export const cambiarEstado = (id: number, body: CambioEstadoRequest) => apiRequest<unknown>(`/residentes/${id}/estado`, { method: 'PUT', body });
export const obtenerHistorial = (id: number, signal?: AbortSignal) => apiRequest<HistorialEstadoResponse[]>(`/residentes/${id}/historial-estados`, { signal });
export const listarEstados = (signal?: AbortSignal) => apiRequest<EstadoResidenteResponse[]>('/residentes/estados', { signal });
export const egresarResidente = (id: number, request: EgresoResidenteRequest): Promise<ResidenteResponse> => apiRequest<ResidenteResponse>(`/residentes/${id}/egreso`, { method: 'PUT', body: request });
