import type { HttpContext } from '@adonisjs/core/http'
import Notification from '#models/notification'

export default class NotificationsController {
  // Get all notifications for logged-in user
  async index({ request }: HttpContext) {
    const currentUser = request.user!

    return Notification.query().where('user_id', currentUser.id).orderBy('created_at', 'desc')
  }

  // Mark notification as read
  async markAsRead({ params, request, response }: HttpContext) {
    const currentUser = request.user!

    const notification = await Notification.findOrFail(params.id)

    if (notification.userId !== currentUser.id) {
      return response.forbidden({ message: 'Unauthorized' })
    }

    notification.isRead = true
    await notification.save()

    return { message: 'Notification marked as read' }
  }
}
