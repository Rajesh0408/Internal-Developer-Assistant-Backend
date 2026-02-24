import vine from '@vinejs/vine'

export const createQuestionValidator = vine.compile(
  vine.object({
    title: vine.string().minLength(10).maxLength(255),
    description: vine.string().minLength(20),
    tags: vine.array(vine.string()).optional(),
  })
)
