import { BaseSeeder } from '@adonisjs/lucid/seeders'
import User from '#models/user'
import hash from '@adonisjs/core/services/hash'

export default class extends BaseSeeder {
  async run() {
    await User.updateOrCreate(
      { email: 'superadmin@example.com' },
      {
        name: 'Super Admin',
        email: 'superadmin@example.com',
        password: await hash.make('admin123'),
        role: 'admin',
        domains: ['Architecture', 'Management', 'Security']
      }
    )
  }
}