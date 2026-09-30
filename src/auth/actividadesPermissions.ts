import { USER_ROLES, type Role } from './roles';

export const canViewActividades = (rol: Role | undefined) => rol !== undefined && USER_ROLES.includes(rol);
export const canCreateActividad = (rol: Role | undefined) => rol === 'ADMINISTRADOR' || rol === 'TERAPISTA_OCUPACIONAL';
export const canManageParticipaciones = (rol: Role | undefined) => rol !== undefined && ['ADMINISTRADOR', 'LIC_ENFERMERIA', 'ENFERMERO', 'TERAPISTA_OCUPACIONAL'].includes(rol);
