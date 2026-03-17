import type { HttpContext } from '@adonisjs/core/http'
import User from '#models/user'
import Question from '#models/question'
import Answer from '#models/answer'
import { updateRoleValidator } from '#validators/update_role'

export default class UsersController {
  async updateRole({ params, request, response }: HttpContext) {
    const data = await request.validateUsing(updateRoleValidator)

    const user = await User.find(params.id)
    if (!user) {
      return response.notFound({ message: 'User not found' })
    }

    user.role = data.role
    await user.save()

    return {
      message: 'Role updated successfully',
      user,
    }
  }

  async stats({ request }: HttpContext) {
    const user = request.user!

    const questions = await Question.query().where('userId', user.id).count('* as total')
    const answers = await Answer.query().where('userId', user.id).count('* as total')

    return {
      totalQuestions: Number(questions[0].$extras.total),
      totalAnswers: Number(answers[0].$extras.total),
    }
  }
}
