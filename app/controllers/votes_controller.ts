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

    // ✅ Prevent duplicate vote logic replaced with toggle & unvote logic
    const existingVote = await Vote.query()
      .where('answerId', data.answerId)
      .where('userId', currentUser.id)
      .first()

    // ✅ Get vote weight based on role
    const weight = getWeight(currentUser.role)

    if (existingVote) {
      if (existingVote.voteType === data.voteType) {
        // UNVOTE: Remove previously added weight
        const scoreChange = data.voteType === 'up' ? -weight : weight
        await existingVote.delete()
        answer.score += scoreChange
      } else {
        // TOGGLE VOTE: Reverse old vote and apply new (2x weight)
        const scoreChange = data.voteType === 'up' ? weight * 2 : -weight * 2
        existingVote.voteType = data.voteType
        await existingVote.save()
        answer.score += scoreChange
      }
    } else {
      // NEW VOTE: Apply regular weight
      const scoreChange = data.voteType === 'up' ? weight : -weight
      await Vote.create({
        answerId: data.answerId,
        voteType: data.voteType,
        userId: currentUser.id,
      })
      answer.score += scoreChange
    }

    // ✅ Update answer score
    await answer.save()

    return {
      success: true,
      newScore: answer.score,
    }
  }
}
