import { apiRequest } from './apiClient';

export interface AtencionMedicaRequest {
  residenteId: number;
  empleadoId: number;
  fecha: string;
  motivo?: string | null;
  tipoIntervencion?: string | null;
  observaciones?: string | null;
}
export interface AtencionMedicaResponse {
  id: number;
  residenteId: number;
  empleadoId: number;
  fecha: string;
  motivo: string | null;
  tipoIntervencion: string | null;
  observaciones: string | null;
}
export interface EvaluacionRequest {
  atencionMedicaId: number;
  detalleHistoriaClinicaId: number;
  tipoEvaluacion: string;
  descripcion: string;
  planIntervencion?: string | null;
}
export interface EvaluacionResponse {
  id: number;
  atencionMedicaId: number;
  detalleHistoriaClinicaId: number;
  tipoEvaluacion: string;
  descripcion: string;
  planIntervencion: string | null;
}
export interface DiagnosticoRequest {
  detalleHistoriaClinicaId: number;
  descripcion: string;
}
export interface DiagnosticoResponse extends DiagnosticoRequest { id: number }
export interface TratamientoRequest {
  detalleHistoriaClinicaId: number;
  nombre: string;
  descripcion?: string | null;
}
export interface TratamientoResponse {
  id: number;
  detalleHistoriaClinicaId: number;
  nombre: string;
  descripcion: string | null;
}
export interface MedicacionRequest {
  detalleHistoriaClinicaId: number;
  nombre: string;
  dosis: string;
  frecuencia: string;
}
export interface MedicacionResponse extends MedicacionRequest { id: number }

export const crearAtencion = (request: AtencionMedicaRequest) => apiRequest<AtencionMedicaResponse>('/atenciones-medicas', { method: 'POST', body: request });
export const obtenerAtencion = (id: number, signal?: AbortSignal) => apiRequest<AtencionMedicaResponse>(`/atenciones-medicas/${id}`, { signal });
export const listarAtencionesPorResidente = (residenteId: number, signal?: AbortSignal) => apiRequest<AtencionMedicaResponse[]>(`/atenciones-medicas/residente/${residenteId}`, { signal });
export const listarAtencionesPorEmpleado = (empleadoId: number, signal?: AbortSignal) => apiRequest<AtencionMedicaResponse[]>(`/atenciones-medicas/empleado/${empleadoId}`, { signal });
export const crearEvaluacion = (request: EvaluacionRequest) => apiRequest<EvaluacionResponse>('/evaluaciones', { method: 'POST', body: request });
export const obtenerEvaluacion = (id: number, signal?: AbortSignal) => apiRequest<EvaluacionResponse>(`/evaluaciones/${id}`, { signal });
export const obtenerEvaluacionPorAtencion = (id: number, signal?: AbortSignal) => apiRequest<EvaluacionResponse>(`/evaluaciones/atencion/${id}`, { signal });
export const listarEvaluacionesPorDetalle = (id: number, signal?: AbortSignal) => apiRequest<EvaluacionResponse[]>(`/evaluaciones/detalle-historia/${id}`, { signal });
export const crearDiagnostico = (request: DiagnosticoRequest) => apiRequest<DiagnosticoResponse>('/diagnosticos', { method: 'POST', body: request });
export const obtenerDiagnostico = (id: number, signal?: AbortSignal) => apiRequest<DiagnosticoResponse>(`/diagnosticos/${id}`, { signal });
export const listarDiagnosticosPorDetalle = (id: number, signal?: AbortSignal) => apiRequest<DiagnosticoResponse[]>(`/diagnosticos/detalle-historia/${id}`, { signal });
export const crearTratamiento = (request: TratamientoRequest) => apiRequest<TratamientoResponse>('/tratamientos', { method: 'POST', body: request });
export const obtenerTratamiento = (id: number, signal?: AbortSignal) => apiRequest<TratamientoResponse>(`/tratamientos/${id}`, { signal });
export const listarTratamientosPorDetalle = (id: number, signal?: AbortSignal) => apiRequest<TratamientoResponse[]>(`/tratamientos/detalle-historia/${id}`, { signal });
export const crearMedicacion = (request: MedicacionRequest) => apiRequest<MedicacionResponse>('/medicaciones', { method: 'POST', body: request });
export const obtenerMedicacion = (id: number, signal?: AbortSignal) => apiRequest<MedicacionResponse>(`/medicaciones/${id}`, { signal });
export const listarMedicacionesPorDetalle = (id: number, signal?: AbortSignal) => apiRequest<MedicacionResponse[]>(`/medicaciones/detalle-historia/${id}`, { signal });
