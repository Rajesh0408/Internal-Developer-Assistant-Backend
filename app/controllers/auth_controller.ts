import type { HttpContext } from '@adonisjs/core/http'
import User from '#models/user'
import hash from '@adonisjs/core/services/hash'
import { signJwt } from '#utils/jwt'
import { signupValidator } from '#validators/signup'
import { loginValidator } from '#validators/login'

export default class AuthController {
  async signup({ request, response }: HttpContext) {
    const data = await request.validateUsing(signupValidator)

    const user = await User.create({
      name: data.name,
      email: data.email,
      password: await hash.make(data.password),
      role: 'developer',
    })

    return response.created({
      message: 'User registered successfully',
      userId: user.id,
    })
  }

  async login({ request, response }: HttpContext) {
    const data = await request.validateUsing(loginValidator)

    const user = await User.findBy('email', data.email)
    if (!user) {
      return response.unauthorized({ error: 'Invalid credentials' })
    }

    const isValid = await hash.verify(user.password, data.password)
    if (!isValid) {
      return response.unauthorized({ error: 'Invalid credentials' })
    }

    const token = signJwt({
      id: user.id,
      role: user.role,
      email: user.email,
    })

    return {
      token,
      type: 'Bearer',
    }
  }
}
