import jwt from 'jsonwebtoken'
import env from '#start/env'

const JWT_SECRET = env.get('JWT_SECRET')!
const EXPIRES_IN = env.get('JWT_EXPIRES_IN') as jwt.SignOptions['expiresIn']

export function signJwt(payload: object) {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: EXPIRES_IN,
  })
}

export function verifyJwt(token: string) {
  return jwt.verify(token, JWT_SECRET)
}
