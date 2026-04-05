export const ROLES = {
    ADMIN: 'Admin',
    ANALYST: 'Analyst',
    VIEWER: 'Viewer',
} as const;

export type Role = typeof ROLES[keyof typeof ROLES];

export const DEFAULT_ROLE: Role = ROLES.VIEWER;