export const ROLES = ['farmer', 'officer'] as const
export type Role = (typeof ROLES)[number]

export const isRole = (value: unknown): value is Role => ROLES.includes(value as Role)
