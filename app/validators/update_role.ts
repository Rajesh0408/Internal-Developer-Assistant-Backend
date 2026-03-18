import vine from '@vinejs/vine'

export const updateRoleValidator = vine.compile(
  vine.object({
    role: vine.enum(['intern', 'junior_developer', 'developer', 'frontend_developer', 'backend_developer', 'senior_developer', 'manager', 'admin']),
  })
)
