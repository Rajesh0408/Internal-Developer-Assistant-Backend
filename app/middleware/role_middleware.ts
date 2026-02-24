import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'

export default class RoleMiddleware {
  async handle({ request, response }: HttpContext, next: NextFn, options: { role?: string } = {}) {
    const user = request.user

    if (!user) {
      return response.unauthorized({ message: 'Not authenticated' })
    }

    const { role } = options

    if (role && user.role !== role) {
      return response.forbidden({ message: 'Access denied' })
    }

    const output = await next()
    return output
  }
}
