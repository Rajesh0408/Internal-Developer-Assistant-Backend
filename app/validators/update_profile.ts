import vine from '@vinejs/vine'

export const updateProfileValidator = vine.compile(
  vine.object({
    name: vine.string().trim().minLength(2).optional(),
    phoneNumber: vine.string().optional(),
    domains: vine.array(vine.string()).optional(),
  })
)