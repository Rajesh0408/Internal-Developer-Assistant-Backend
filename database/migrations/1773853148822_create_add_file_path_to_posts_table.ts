import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  async up() {
    this.schema.alterTable('questions', (table) => {
      table.string('file_path').nullable()
    })
    this.schema.alterTable('answers', (table) => {
      table.string('file_path').nullable()
    })
  }

  async down() {
    this.schema.alterTable('questions', (table) => {
      table.dropColumn('file_path')
    })
    this.schema.alterTable('answers', (table) => {
      table.dropColumn('file_path')
    })
  }
}