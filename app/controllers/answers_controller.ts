import type { HttpContext } from '@adonisjs/core/http'
import Answer from '#models/answer'
import Question from '#models/question'
import Notification from '#models/notification'
import { createAnswerValidator } from '#validators/create_answer'

export default class AnswersController {
  async store({ request, response }: HttpContext) {
    // ✅ Validate request body
    const data = await request.validateUsing(createAnswerValidator)

    const currentUser = request.user!

    // ✅ Ensure question exists
    const question = await Question.find(data.questionId)
    if (!question) {
      return response.notFound({ message: 'Question not found' })
    }

    // ✅ Create answer
    const answer = await Answer.create({
      answerText: data.answerText,
      questionId: data.questionId,
      userId: currentUser.id,
      score: 0,
    })

    // ✅ Avoid self-notification
    if (question.userId !== currentUser.id) {
      await Notification.create({
        message: 'Someone answered your question',
        type: 'in_app',
        isRead: false,
        emailSent: false,
        sentAt: null,
        userId: question.userId,
      })
    }

    return response.created(answer)
  }
}
