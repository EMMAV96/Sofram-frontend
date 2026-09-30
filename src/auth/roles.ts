export const USER_ROLES = [
  'ADMINISTRADOR',
  'ADMINISTRATIVO',
  'MEDICO',
  'PSICOLOGO',
  'LIC_ENFERMERIA',
  'ENFERMERO',
  'TERAPISTA_OCUPACIONAL',
] as const;

export type Role = (typeof USER_ROLES)[number];

export function getUserRole(role: Role): Role {
  return role;
}