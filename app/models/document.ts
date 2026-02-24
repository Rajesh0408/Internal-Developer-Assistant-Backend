import { DateTime } from 'luxon'
import { BaseModel, column } from '@adonisjs/lucid/orm'

export default class Document extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare title: string

  @column()
  declare filePath: string

  @column()
  declare uploadedBy: number

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime
}
