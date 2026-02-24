import type { HttpContext } from '@adonisjs/core/http'
import Vote from '#models/vote'
import Answer from '#models/answer'
import { getWeight } from '#services/vote_weight_service'
import { createVoteValidator } from '#validators/vote'

export default class VotesController {
  async store({ request, response }: HttpContext) {
    // ✅ Validate input
    const data = await request.validateUsing(createVoteValidator)

    const currentUser = request.user!

    // ✅ Check answer exists
    const answer = await Answer.find(data.answerId)
    if (!answer) {
      return response.notFound({ message: 'Answer not found' })
    }

    // ✅ Prevent duplicate vote
    const existingVote = await Vote.query()
      .where('answerId', data.answerId)
      .where('userId', currentUser.id)
      .first()

    if (existingVote) {
      return response.badRequest({
        message: 'You have already voted on this answer',
      })
    }

    // ✅ Get vote weight based on role
    const weight = getWeight(currentUser.role)

    const scoreChange = data.voteType === 'up' ? weight : -weight

    // ✅ Create vote
    await Vote.create({
      answerId: data.answerId,
      voteType: data.voteType,
      userId: currentUser.id,
    })

    // ✅ Update answer score
    answer.score += scoreChange
    await answer.save()

    return {
      success: true,
      newScore: answer.score,
    }
  }
}
