import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'votes'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')

      table.enum('vote_type', ['up', 'down']).notNullable()

      table.integer('user_id').unsigned().references('id').inTable('users').onDelete('CASCADE')

      table.integer('answer_id').unsigned().references('id').inTable('answers').onDelete('CASCADE')

      table.timestamp('created_at')
      table.timestamp('updated_at')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
