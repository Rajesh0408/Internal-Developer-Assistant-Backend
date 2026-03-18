import type { HttpContext } from '@adonisjs/core/http'
import User from '#models/user'
import Question from '#models/question'
import Answer from '#models/answer'
import vine from '@vinejs/vine'
import { updateRoleValidator } from '#validators/update_role'
import { updateProfileValidator } from '#validators/update_profile'

export default class UsersController {
  async index() {
    return await User.query().orderBy('id', 'desc')
  }

  async adminCreate({ request, response }: HttpContext) {
    const data = await request.validateUsing(
      vine.compile(
        vine.object({
          name: vine.string().trim().minLength(2),
          email: vine.string().email().normalizeEmail(),
          password: vine.string().minLength(6),
          role: vine.enum(['admin', 'manager', 'senior_developer', 'backend_developer', 'frontend_developer', 'developer', 'junior_developer', 'intern'] as const)
        })
      )
    )

    const existingUser = await User.findBy('email', data.email)
    if (existingUser) {
      return response.badRequest({ message: 'Email already in use' })
    }

    const user = new User()
    user.name = data.name
    user.email = data.email
    user.password = data.password
    user.role = data.role

    await user.save()

    return user
  }

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

  async me({ request }: HttpContext) {
    const user = request.user!
    const questions = await Question.query().where('userId', user.id).count('* as total')
    const answers = await Answer.query().where('userId', user.id).count('* as total')

    await user.load('questions', (q) => q.orderBy('createdAt', 'desc'))
    await user.load('answers', (q) => q.preload('question').orderBy('createdAt', 'desc'))

    return {
      ...user.serialize(),
      questionsCount: Number(questions[0].$extras.total),
      answersCount: Number(answers[0].$extras.total),
      questions: user.questions,
      answers: user.answers,
    }
  }

  async showProfile({ params, request, response }: HttpContext) {
    const user = await User.find(params.id)
    if (!user) return response.notFound({ message: 'User not found' })

    const questionsStats = await Question.query().where('userId', user.id).count('* as total')
    const answersStats = await Answer.query().where('userId', user.id).count('* as total')

    const currentUser = request.user!
    let isFollowing = false
    if (currentUser.id !== user.id) {
      const followQuery = await currentUser.related('following').query().where('following_id', user.id).first()
      isFollowing = !!followQuery
    }

    await user.load('questions', (q) => q.orderBy('createdAt', 'desc').limit(10))
    await user.load('answers', (q) => q.preload('question').orderBy('createdAt', 'desc').limit(10))
    await user.load('followers')
    await user.load('following')

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      domains: user.domains,
      createdAt: user.createdAt,
      questionsCount: Number(questionsStats[0].$extras.total),
      answersCount: Number(answersStats[0].$extras.total),
      followersCount: user.followers.length,
      followingCount: user.following.length,
      isFollowing,
      questions: user.questions,
      answers: user.answers,
    }
  }

  async updateProfile({ request }: HttpContext) {
    const data = await request.validateUsing(updateProfileValidator)
    const user = request.user!

    if (data.name !== undefined) user.name = data.name
    if (data.domains !== undefined) user.domains = data.domains
    if (data.phoneNumber !== undefined) user.phoneNumber = data.phoneNumber

    await user.save()

    return user
  }

  async follow({ params, request, response }: HttpContext) {
    const user = request.user!
    const targetUserId = Number(params.id)

    if (user.id === targetUserId) {
      return response.badRequest({ message: 'You cannot follow yourself' })
    }

    const targetUser = await User.find(targetUserId)
    if (!targetUser) return response.notFound({ message: 'User not found' })

    await user.related('following').attach([targetUser.id])

    return { message: 'Successfully followed user' }
  }

  async unfollow({ params, request }: HttpContext) {
    const user = request.user!
    await user.related('following').detach([Number(params.id)])

    return { message: 'Successfully unfollowed user' }
  }

  async followers({ request }: HttpContext) {
    const user = request.user!
    await user.load('followers')
    return user.followers
  }

  async following({ request }: HttpContext) {
    const user = request.user!
    await user.load('following')
    return user.following
  }

  async globalStats() {
    const questions = await Question.query().count('* as total')
    const answers = await Answer.query().count('* as total')
    return {
      totalQuestions: Number(questions[0].$extras.total),
      totalAnswers: Number(answers[0].$extras.total),
    }
  }

  async destroy({ params, response }: HttpContext) {
    const user = await User.find(params.id)
    if (!user) return response.notFound({ message: 'User not found' })
    if (user.role === 'admin') return response.badRequest({ message: 'Cannot delete an admin' })
    await user.delete()
    return { success: true, message: 'User deleted successfully' }
  }
}
