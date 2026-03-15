import type { HttpContext } from '@adonisjs/core/http'
import Question from '#models/question'
import { createQuestionValidator } from '#validators/create_question'

export default class QuestionsController {
  async store({ request, response }: HttpContext) {
    const data = await request.validateUsing(createQuestionValidator)

    if (!request.user) {
      return response.unauthorized({ message: 'Unauthorized' })
    }

    const question = await Question.create({
      title: data.title,
      description: data.description,
      tags: data.tags || null,
      userId: request.user.id,
    })

    return question
  }

  async index() {
    return await Question.query().preload('user').preload('answers')
  }

  async show({ params, response }: HttpContext) {
    const question = await Question.query()
      .where('id', params.id)
      .preload('user')
      .preload('answers', (query) => {
        query.preload('user')
      })
      .first()

    if (!question) {
      return response.notFound({ message: 'Question not found' })
    }

    return question
  }

  async search({ request }: HttpContext) {
    const keyword = request.input('keyword')

    if (!keyword) {
      return await Question.query().preload('user').preload('answers')
    }

    return await Question.query()
      .whereILike('title', `%${keyword}%`)
      .orWhereILike('description', `%${keyword}%`)
      .orWhereRaw('tags::text ILIKE ?', [`%${keyword}%`])
      .preload('user')
      .preload('answers')
  }
}
