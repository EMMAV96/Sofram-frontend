import { apiRequest } from './apiClient';

export interface CrearUsuarioRequest { empleadoId: number; username: string; password: string; rol: string }
export interface UsuarioResponse { id: number; username: string; rol: string; empleadoId: number; empleadoNombre: string; empleadoApellido: string; activo: boolean }
export interface ActualizarUsuarioRequest { username: string; rol: string }
export interface CambiarPasswordRequest { password: string }
export interface RolResponse { id: number; nombre: string; descripcion: string }

export const listarUsuarios = (signal?: AbortSignal) => apiRequest<UsuarioResponse[]>('/usuarios', { signal });
export const obtenerUsuarioPorEmpleado = (empleadoId: number, signal?: AbortSignal) => apiRequest<UsuarioResponse>(`/usuarios/empleado/${empleadoId}`, { signal });
export const listarRoles = (signal?: AbortSignal) => apiRequest<RolResponse[]>('/usuarios/roles', { signal });
export const crearUsuario = (body: CrearUsuarioRequest) => apiRequest<UsuarioResponse>('/usuarios', { method: 'POST', body });
export const actualizarUsuario = (id: number, body: ActualizarUsuarioRequest) => apiRequest<UsuarioResponse>(`/usuarios/${id}`, { method: 'PUT', body });
export const cambiarPassword = (id: number, body: CambiarPasswordRequest) => apiRequest<void>(`/usuarios/${id}/password`, { method: 'PATCH', body });
