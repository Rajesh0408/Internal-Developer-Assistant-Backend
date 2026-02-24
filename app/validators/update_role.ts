import vine from '@vinejs/vine'

export const updateRoleValidator = vine.compile(
  vine.object({
    role: vine.enum(['junior_developer', 'developer', 'senior_developer', 'manager', 'admin']),
  })
)
