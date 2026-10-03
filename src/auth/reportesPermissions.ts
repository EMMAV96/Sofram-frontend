import type { Role } from './roles';

export const canViewReporteClinico = (role: Role | undefined) => role === 'ADMINISTRADOR' || role === 'MEDICO';
export const canViewReporteOcupacion = (role: Role | undefined) => role === 'ADMINISTRADOR' || role === 'ADMINISTRATIVO';
export const canViewReporteActividad = (role: Role | undefined) => role === 'ADMINISTRADOR' || role === 'TERAPISTA_OCUPACIONAL';
export const canViewReportes = (role: Role | undefined) => canViewReporteClinico(role) || canViewReporteOcupacion(role) || canViewReporteActividad(role);
