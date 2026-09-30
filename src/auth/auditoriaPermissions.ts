import type { Role } from './roles';

export const canViewAuditoria = (role: Role | undefined) => role === 'ADMINISTRADOR';
