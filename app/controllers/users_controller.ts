import type { HttpContext } from '@adonisjs/core/http'
import User from '#models/user'
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
}
