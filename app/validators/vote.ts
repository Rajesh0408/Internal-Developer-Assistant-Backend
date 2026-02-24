import vine from '@vinejs/vine'

export const createVoteValidator = vine.compile(
  vine.object({
    answerId: vine.number().positive(),

    voteType: vine.enum(['up', 'down']),
  })
)
