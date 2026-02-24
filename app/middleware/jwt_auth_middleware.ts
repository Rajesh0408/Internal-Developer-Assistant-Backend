import type { HttpContext } from '@adonisjs/core/http'
import User from '#models/user'
import { verifyJwt } from '#utils/jwt'

export default class JwtAuthMiddleware {
  async handle({ request, response }: HttpContext, next: () => Promise<void>) {
    const authHeader = request.header('authorization')

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return response.unauthorized({ message: 'Missing or invalid token' })
    }

    const token = authHeader.replace('Bearer ', '')

    try {
      const payload = verifyJwt(token) as { id: number }

      const user = await User.find(payload.id)
      if (!user) {
        return response.unauthorized({ message: 'User not found' })
      }

      // attach user to request
      request.user = user

      await next()
    } catch {
      return response.unauthorized({ message: 'Invalid or expired token' })
    }
  }
}
