import type { Role } from './roles';

export const canAccessPersonal = (rol: Role | undefined) => rol === 'ADMINISTRADOR';
