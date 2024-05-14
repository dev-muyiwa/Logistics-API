import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import { config } from '../core/config'
import Exception from '../utils/exception'

export class AuthService {
  public static async hashPassword(password: string) {
    const salt = await bcrypt.genSalt(config.BCRYPT_ROUNDS)
    return await bcrypt.hash(password, salt)
  }

  public static async verifyPassword(password: string, hash: string) {
    return await bcrypt.compare(password, hash)
  }

  public static generateRefreshToken(id: string, email: string) {
    return jwt.sign(
      { id: id, email: email, type: 'refresh' },
      config.USER_REFRESH_SECRET,
      {
        expiresIn: '4d',
        issuer: 'Moyosore'
      }
    )
  }

  public static generatePasswordResetToken(id: string, email: string) {
    return jwt.sign(
      { id: id, email: email, type: 'reset' },
      config.USER_RESET_SECRET,
      {
        expiresIn: '30m',
        issuer: 'Moyosore'
      }
    )
  }

  public static generateAccessToken(id: string, email: string) {
    return jwt.sign(
      { id: id, email: email, type: 'access' },
      config.USER_ACCESS_SECRET,
      { expiresIn: '1h', issuer: 'Moyosore' }
    )
  }

  public static verifyRefreshToken(token: string) {
    return new Promise((resolve, reject) => {
      jwt.verify(token, config.USER_REFRESH_SECRET, (err, decoded) => {
        if (err) {
          reject(new Exception(`invalid refresh token`))
        }
        resolve(decoded)
      })
    })
  }

  public static verifyPasswordResetToken(token: string) {
    return new Promise((resolve, reject) => {
      jwt.verify(token, config.USER_RESET_SECRET, (err, decoded) => {
        if (err) {
          reject(new Exception(`invalid reset token`))
        }
        resolve(decoded)
      })
    })
  }

  public static verifyAccessToken(token: string) {
    return new Promise((resolve, reject) => {
      jwt.verify(token, config.USER_ACCESS_SECRET, (err, decoded) => {
        if (err) {
          reject(new Exception(`invalid access token`))
        }
        resolve(decoded)
      })
    })
  }
}
