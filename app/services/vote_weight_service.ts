export const ROLE_WEIGHT: Record<string, number> = {
  intern: 1,
  junior_developer: 2,
  developer: 3,
  frontend_developer: 4,
  backend_developer: 4,
  senior_developer: 5,
  manager: 7,
  admin: 10,
}

export function getWeight(role: string): number {
  return ROLE_WEIGHT[role] || 1
}
