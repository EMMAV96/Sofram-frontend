import type { Role } from './roles';

export function historiasClinicasPermissions(rol: Role | undefined) {
  const adminMedico = rol === 'ADMINISTRADOR' || rol === 'MEDICO';
  return {
    canRead: adminMedico || rol === 'PSICOLOGO' || rol === 'LIC_ENFERMERIA' || rol === 'ENFERMERO',
    canCreate: adminMedico,
    canAddDetalle: adminMedico || rol === 'PSICOLOGO' || rol === 'LIC_ENFERMERIA',
    canUpdateAntecedentes: adminMedico || rol === 'LIC_ENFERMERIA',
  };
}
