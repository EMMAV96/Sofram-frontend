import { apiRequest } from './apiClient';

export interface EmpleadoResponse {
  id: number;
  cargoId: number;
  cargoNombre: string;
  apellido: string;
  nombre: string;
  dni: string;
  fechaNacimiento: string;
  direccion: string | null;
  telefono: string | null;
  email: string | null;
  fechaBaja: string | null;
  activo: boolean;
}

export const listarEmpleados = (signal?: AbortSignal): Promise<EmpleadoResponse[]> => apiRequest<EmpleadoResponse[]>('/personal/empleados', { signal });

export interface EmpleadoRequest {
  cargoId: number;
  apellido: string;
  nombre: string;
  dni: string;
  fechaNacimiento: string;
  direccion?: string | null;
  telefono?: string | null;
  email?: string | null;
}
export interface BajaEmpleadoRequest { fechaBaja: string }
export interface CargoRequest {
  nombre: string;
  sector?: string | null;
  matricula?: string | null;
  especialidad?: string | null;
}
export interface CargoResponse {
  id: number;
  nombre: string;
  sector: string | null;
  matricula: string | null;
  especialidad: string | null;
}
export interface TurnoRequest { descripcion: string; horaInicio: string; horaFin: string }
export interface TurnoResponse extends TurnoRequest { id: number }
export interface AsignacionTurnoRequest { turnoId: number; fechaDesde: string; motivoCambio?: string | null }
export interface AsignacionTurnoResponse {
  id: number;
  empleadoId: number;
  turnoId: number;
  turnoDescripcion: string;
  horaInicio: string;
  horaFin: string;
  fechaDesde: string;
  fechaHasta: string | null;
  motivoCambio: string | null;
}

export const obtenerEmpleado = (id: number, signal?: AbortSignal) => apiRequest<EmpleadoResponse>(`/personal/empleados/${id}`, { signal });
export const crearEmpleado = (request: EmpleadoRequest) => apiRequest<EmpleadoResponse>('/personal/empleados', { method: 'POST', body: request });
export const actualizarEmpleado = (id: number, request: EmpleadoRequest) => apiRequest<EmpleadoResponse>(`/personal/empleados/${id}`, { method: 'PUT', body: request });
export const darBajaEmpleado = (id: number, request: BajaEmpleadoRequest) => apiRequest<EmpleadoResponse>(`/personal/empleados/${id}/baja`, { method: 'PATCH', body: request });
export const listarCargos = (signal?: AbortSignal) => apiRequest<CargoResponse[]>('/personal/cargos', { signal });
export const crearCargo = (request: CargoRequest) => apiRequest<CargoResponse>('/personal/cargos', { method: 'POST', body: request });
export const listarTurnos = (signal?: AbortSignal) => apiRequest<TurnoResponse[]>('/personal/turnos', { signal });
export const crearTurno = (request: TurnoRequest) => apiRequest<TurnoResponse>('/personal/turnos', { method: 'POST', body: request });
export const listarAsignacionesTurno = (empleadoId: number, signal?: AbortSignal) => apiRequest<AsignacionTurnoResponse[]>(`/personal/empleados/${empleadoId}/asignaciones-turno`, { signal });
export const asignarTurno = (empleadoId: number, request: AsignacionTurnoRequest) => apiRequest<AsignacionTurnoResponse>(`/personal/empleados/${empleadoId}/asignaciones-turno`, { method: 'POST', body: request });
