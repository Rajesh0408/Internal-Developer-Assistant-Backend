import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo, hasMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import User from './user.js'
import Answer from './answer.js'

export default class Question extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare title: string

  @column()
  declare description: string

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
  declare tags: string[] | null

  @column()
  declare userId: number

  @column()
  declare filePath: string | null

  @belongsTo(() => User)
  declare user: BelongsTo<typeof User>

  @hasMany(() => Answer)
  declare answers: HasMany<typeof Answer>

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime
}
