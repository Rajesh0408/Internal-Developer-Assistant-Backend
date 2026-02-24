import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import User from './user.js'
import Answer from './answer.js'

export default class Vote extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare voteType: 'up' | 'down'

  @column()
  declare userId: number

  @column()
  declare answerId: number

  @belongsTo(() => User)
  declare user: BelongsTo<typeof User>

  @belongsTo(() => Answer)
  declare answer: BelongsTo<typeof Answer>
}
