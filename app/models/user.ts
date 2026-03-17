import { DateTime } from 'luxon'
import { BaseModel, column, hasMany, manyToMany } from '@adonisjs/lucid/orm'
import type { HasMany, ManyToMany } from '@adonisjs/lucid/types/relations'
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

  @column()
  declare phoneNumber: string | null

  @column({ serializeAs: null })
  declare password: string

  @column()
  declare role: 'intern' | 'junior_developer' | 'developer' | 'frontend_developer' | 'backend_developer' | 'senior_developer' | 'manager' | 'admin'

  @column({
    prepare: (value: any) => (Array.isArray(value) ? JSON.stringify(value) : value),
    consume: (value: any) => {
      if (typeof value === 'string') {
        try {
          const parsed = JSON.parse(value)
          if (Array.isArray(parsed)) return parsed
        } catch {}
        
        let cv = value.trim()
        if (cv.startsWith('{') && cv.endsWith('}')) {
          cv = cv.substring(1, cv.length - 1)
        }
        return cv.split(',').map(s => s.replace(/["']/g, '').trim()).filter(Boolean)
      }
      return Array.isArray(value) ? value : []
    },
  })
  declare domains: string[] | null

  @hasMany(() => Question)
  declare questions: HasMany<typeof Question>

  @hasMany(() => Answer)
  declare answers: HasMany<typeof Answer>

  @hasMany(() => Notification)
  declare notifications: HasMany<typeof Notification>

  @manyToMany(() => User, {
    pivotTable: 'followers',
    pivotForeignKey: 'following_id',
    pivotRelatedForeignKey: 'follower_id',
  })
  declare followers: ManyToMany<typeof User>

  @manyToMany(() => User, {
    pivotTable: 'followers',
    pivotForeignKey: 'follower_id',
    pivotRelatedForeignKey: 'following_id',
  })
  declare following: ManyToMany<typeof User>

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime
}
