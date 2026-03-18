import vine from '@vinejs/vine'

export const signupValidator = vine.compile(
  vine.object({
    name: vine.string().trim().minLength(3).maxLength(100),

    email: vine.string().trim().email().normalizeEmail(),

    phoneNumber: vine.string().optional(),

    password: vine.string().minLength(8).maxLength(32),
  })
)
