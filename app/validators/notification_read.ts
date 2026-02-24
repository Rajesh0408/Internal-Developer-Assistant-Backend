import vine from '@vinejs/vine'

export const notificationReadValidator = vine.compile(
  vine.object({
    id: vine.number(),
  })
)
