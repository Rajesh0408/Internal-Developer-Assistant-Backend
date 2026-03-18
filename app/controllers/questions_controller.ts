import type { HttpContext } from '@adonisjs/core/http'
import app from '@adonisjs/core/services/app'
import Question from '#models/question'
import User from '#models/user'
import Document from '#models/document'
import { createQuestionValidator } from '#validators/create_question'

export default class QuestionsController {
  async store({ request, response }: HttpContext) {
    const data = await request.validateUsing(createQuestionValidator)

    if (!request.user) {
      return response.unauthorized({ message: 'Unauthorized' })
    }

    const file = request.file('proof', {
      extnames: ['jpg', 'png', 'pdf', 'zip', 'doc', 'docx', 'txt'],
      size: '10mb',
    })

    let savedFileName: string | null = null

    if (file && file.isValid) {
      await file.move(app.makePath('uploads'), {
        name: `${new Date().getTime()}_${file.clientName}`,
      })
      savedFileName = file.fileName!
    }

    const question = await Question.create({
      title: data.title,
      description: data.description,
      tags: data.tags || null,
      userId: request.user.id,
      filePath: savedFileName,
    })

    return question
  }

  async index({ request }: HttpContext) {
    const page = request.input('page', 1)
    const limit = request.input('limit', 10)
    const filter = request.input('filter', 'recent')
    const user = request.user!

    const query = Question.query().preload('user').preload('answers')

    if (filter === 'recent') {
      query.orderBy('createdAt', 'desc')
    } else if (filter === 'popular') {
      query.withCount('answers', (q) => q.as('answers_count')).orderBy('answers_count', 'desc')
    } else if (filter === 'following') {
      await user.load('following')
      const followingIds = user.following.map((f) => f.id)
      query.where((q) => {
        q.whereIn('userId', followingIds)
         .orWhereHas('answers', (ansQuery) => {
           ansQuery.whereIn('userId', followingIds)
         })
      }).orderBy('createdAt', 'desc')
    } else if (filter === 'my_domains') {
      if (user.domains && user.domains.length > 0) {
        query.where((q) => {
          for (const domain of user.domains!) {
             q.orWhereRaw('tags::text ILIKE ?', [`%${domain}%`])
          }
        }).orderBy('createdAt', 'desc')
      } else {
        query.orderBy('createdAt', 'desc')
      }
    }

    return await query.paginate(page, limit)
  }

  async show({ params, response }: HttpContext) {
    const question = await Question.query()
      .where('id', params.id)
      .preload('user')
      .preload('answers', (query) => {
        query.preload('user')
        query.orderBy('score', 'desc')
      })
      .first()

    if (!question) {
      return response.notFound({ message: 'Question not found' })
    }

    // Sort answers in memory combining score and role weights
    const roleWeights: Record<string, number> = {
      admin: 10,
      manager: 9,
      senior_developer: 8,
      backend_developer: 7,
      frontend_developer: 7,
      developer: 6,
      junior_developer: 5,
      intern: 4,
    }
    
    question.answers.sort((a, b) => {
      if (a.score !== b.score) return b.score - a.score;
      const weightA = roleWeights[a.user.role] || 0;
      const weightB = roleWeights[b.user.role] || 0;
      return weightB - weightA;
    })

    return question
  }

  async search({ request }: HttpContext) {
    const keyword = request.input('keyword')
    const page = request.input('page', 1)
    const limit = request.input('limit', 10)

    const query = Question.query().preload('user').preload('answers')
    let users: any[] = []
    let documents: any[] = []

    if (keyword) {
      query.where((q) => {
        q.whereILike('title', `%${keyword}%`)
         .orWhereILike('description', `%${keyword}%`)
         .orWhereRaw('tags::text ILIKE ?', [`%${keyword}%`])
      })
      
      users = await User.query()
        .where((q) => {
          q.whereILike('name', `%${keyword}%`)
           .orWhereILike('email', `%${keyword}%`)
           .orWhereRaw('domains::text ILIKE ?', [`%${keyword}%`])
        })
        .limit(5)
        
      documents = await Document.query()
        .whereILike('title', `%${keyword}%`)
        .orWhereILike('filePath', `%${keyword}%`)
        .limit(5)
    }
    
    query.orderBy('createdAt', 'desc')

    const questionsPaginator = await query.paginate(page, limit)
    
    return {
      questions: questionsPaginator,
      users: users,
      documents: documents
    }
  }

  async destroy({ params, request, response }: HttpContext) {
    const question = await Question.find(params.id)
    if (!question) return response.notFound({ message: 'Question not found' })

    const user = request.user!
    if (user.role !== 'admin' && question.userId !== user.id) {
      return response.unauthorized({ message: 'Not authorized to delete this question' })
    }

    await question.delete()
    return { success: true, message: 'Question deleted successfully' }
  }
}
