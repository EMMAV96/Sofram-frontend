import type { Role } from './roles';

export function habitacionesPermissions(rol: Role | undefined) {
  return {
    canRead: rol !== undefined && ['ADMINISTRADOR', 'ADMINISTRATIVO', 'MEDICO', 'LIC_ENFERMERIA', 'ENFERMERO'].includes(rol),
    canWrite: rol === 'ADMINISTRADOR' || rol === 'ADMINISTRATIVO',
  };
}
