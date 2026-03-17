import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'users'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.json('domains').defaultTo('[]')
    })

    // Convert Enum to Varchar
    await this.raw('ALTER TABLE users ALTER COLUMN role TYPE varchar(255) USING role::varchar')
    // Optionally drop the enum type if no longer used by other tables
    await this.raw('DROP TYPE IF EXISTS users_role_enum')
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('domains')
    })
    
    // We cannot easily convert varchar back to the original enum cleanly without recreating it, but for a down migration we can just leave it as varchar or try to recreate the enum. Leaving it as varchar is safest.
  }
}