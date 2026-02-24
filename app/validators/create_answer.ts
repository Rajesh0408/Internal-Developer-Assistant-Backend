import vine from '@vinejs/vine'

export const createAnswerValidator = vine.compile(
  vine.object({
    answerText: vine.string().trim().minLength(10).maxLength(5000),

    questionId: vine.number().positive(),
  })
)
