import { USER_ROLES, type Role } from './roles';

export const canViewCalendario = (rol: Role | undefined) => rol !== undefined && USER_ROLES.includes(rol);
export const canCreateCalendario = (rol: Role | undefined) => rol === 'ADMINISTRADOR' || rol === 'TERAPISTA_OCUPACIONAL';
export const canCreateDetalleCalendario = canCreateCalendario;
