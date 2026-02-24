import { DateTime } from 'luxon'
import { BaseModel, column, hasMany } from '@adonisjs/lucid/orm'
import type { HasMany } from '@adonisjs/lucid/types/relations'
import Question from './question.js'
import Answer from './answer.js'
import Notification from './notification.js'

export default class User extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare name: string

  @column()
  declare email: string

  @column({ serializeAs: null })
  declare password: string

  @column()
  declare role: 'junior_developer' | 'developer' | 'senior_developer' | 'manager' | 'admin'

  @hasMany(() => Question)
  declare questions: HasMany<typeof Question> // Updated

  @hasMany(() => Answer)
  declare answers: HasMany<typeof Answer> // Updated

  @hasMany(() => Notification)
  declare notifications: HasMany<typeof Notification> // Updated

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime
}
