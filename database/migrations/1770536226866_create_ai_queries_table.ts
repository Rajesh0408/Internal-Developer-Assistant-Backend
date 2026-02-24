import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'ai_queries'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')

      table.text('question').notNullable()
      table.text('response').notNullable()

      table.integer('user_id').unsigned().references('id').inTable('users').onDelete('CASCADE')

      table.timestamp('created_at')
      table.timestamp('updated_at')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
