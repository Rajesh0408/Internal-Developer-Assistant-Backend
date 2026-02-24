import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'notifications'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')

      table.text('message').notNullable()

      table.enum('type', ['email', 'in_app']).notNullable()

      table.boolean('is_read').notNullable().defaultTo(false)

      table.boolean('email_sent').notNullable().defaultTo(false)

      table.timestamp('sent_at').nullable()

      table.integer('user_id').unsigned().references('id').inTable('users').onDelete('CASCADE')

      table.timestamp('created_at')
      table.timestamp('updated_at')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
