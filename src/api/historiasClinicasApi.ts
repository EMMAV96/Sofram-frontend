import { apiRequest } from './apiClient';

export interface HistoriaClinicaRequest {
  residenteId: number;
  fechaCreacion: string;
  observaciones?: string | null;
}
export interface HistoriaClinicaResponse {
  id: number;
  residenteId: number;
  fechaCreacion: string;
  observaciones: string | null;
  antecedentesPersonales: string | null;
  antecedentesFamiliares: string | null;
  alergias: string | null;
}
export interface DetalleHistoriaClinicaRequest {
  fecha: string;
  observaciones?: string | null;
}
export interface DetalleHistoriaClinicaResponse {
  id: number;
  historiaClinicaId: number;
  fecha: string;
  observaciones: string | null;
}
export interface AntecedentesHistoriaClinicaRequest {
  antecedentesPersonales?: string | null;
  antecedentesFamiliares?: string | null;
  alergias?: string | null;
}

export const crearHistoriaClinica = (request: HistoriaClinicaRequest) => apiRequest<HistoriaClinicaResponse>('/historias-clinicas', { method: 'POST', body: request });
export const obtenerHistoriaPorResidente = (residenteId: number, signal?: AbortSignal) => apiRequest<HistoriaClinicaResponse>(`/historias-clinicas/residente/${residenteId}`, { signal });
export const obtenerHistoria = (id: number, signal?: AbortSignal) => apiRequest<HistoriaClinicaResponse>(`/historias-clinicas/${id}`, { signal });
export const crearDetalle = (historiaClinicaId: number, request: DetalleHistoriaClinicaRequest) => apiRequest<DetalleHistoriaClinicaResponse>(`/historias-clinicas/${historiaClinicaId}/detalles`, { method: 'POST', body: request });
export const listarDetalles = (historiaClinicaId: number, signal?: AbortSignal) => apiRequest<DetalleHistoriaClinicaResponse[]>(`/historias-clinicas/${historiaClinicaId}/detalles`, { signal });
export const actualizarAntecedentesYAlergias = (id: number, request: AntecedentesHistoriaClinicaRequest) => apiRequest<HistoriaClinicaResponse>(`/historias-clinicas/${id}/antecedentes-alergias`, { method: 'PUT', body: request });
