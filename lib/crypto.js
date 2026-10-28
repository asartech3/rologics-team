import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'rolo-dev-secret-change-me'
const TOKEN_TTL = '7d'

export function hashPassword(password) {
  return bcrypt.hashSync(password, 10)
}

export function comparePassword(plain, hash) {
  return bcrypt.compareSync(plain, hash)
}

export function signToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: TOKEN_TTL })
}

export function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET)
  } catch (e) {
    return null
  }
}
