import type { HttpContext } from '@adonisjs/core/http'
import Answer from '#models/answer'
import Question from '#models/question'
import Notification from '#models/notification'
import User from '#models/user'
import { createAnswerValidator } from '#validators/create_answer'
import nodemailer from 'nodemailer'

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
        emailSent: true,
        sentAt: null,
        userId: question.userId,
      })

      // Try sending an email via Ethereal (dummy SMTP)
      try {
        const owner = await User.find(question.userId)
        if (owner) {
          const testAccount = await nodemailer.createTestAccount()
          const transporter = nodemailer.createTransport({
            host: 'smtp.ethereal.email',
            port: 587,
            secure: false,
            auth: {
              user: testAccount.user,
              pass: testAccount.pass,
            },
          })

          const info = await transporter.sendMail({
            from: '"DevAssistant" <no-reply@devassistant.local>',
            to: owner.email,
            subject: 'New Answer to your Question!',
            text: `Hello ${owner.name}, a new answer was posted to your question!`,
          })

          console.log('Test Email Alert sent!')
          console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info))
        }
      } catch (e) {
        console.error('Failed to send automated email notification', e)
      }
    }

    return response.created(answer)
  }
}
