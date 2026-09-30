import { apiRequest } from './apiClient';

export interface AuditoriaResponse {
  id: number;
  usuarioId: number;
  username: string;
  rol: string;
  accion: string;
  modulo: string;
  entidad: string;
  entidadId: number | null;
  detalle: string | null;
  fechaHora: string;
}

export const listarAuditorias = (signal?: AbortSignal) =>
  apiRequest<AuditoriaResponse[]>('/auditorias', { signal });

export const listarAuditoriasPorUsuario = (usuarioId: number, signal?: AbortSignal) =>
  apiRequest<AuditoriaResponse[]>(`/auditorias/usuario/${usuarioId}`, { signal });

export const listarAuditoriasPorEntidad = (entidad: string, entidadId: number, signal?: AbortSignal) =>
  apiRequest<AuditoriaResponse[]>(`/auditorias/entidad/${encodeURIComponent(entidad)}/${entidadId}`, { signal });
