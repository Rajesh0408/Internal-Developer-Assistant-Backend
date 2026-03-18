import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  async up() {
    await this.raw('ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check')
  }

  async down() {
    // 
  }
}