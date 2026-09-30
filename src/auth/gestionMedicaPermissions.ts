import type { Role } from './roles';

export function gestionMedicaPermissions(rol: Role | undefined) {
  return {
    canAccess: rol !== undefined && ['ADMINISTRADOR', 'MEDICO', 'PSICOLOGO', 'LIC_ENFERMERIA', 'ENFERMERO'].includes(rol),
    canClinical: rol === 'ADMINISTRADOR' || rol === 'MEDICO',
    canChooseEmpleado: rol === 'ADMINISTRADOR',
  };
}
