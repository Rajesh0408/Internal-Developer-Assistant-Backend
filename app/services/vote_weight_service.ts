export const ROLE_WEIGHT = {
  junior_developer: 1,
  developer: 2,
  senior_developer: 4,
  manager: 6,
  admin: 8,
} as const

export function getWeight(role: keyof typeof ROLE_WEIGHT) {
  return ROLE_WEIGHT[role]
}
