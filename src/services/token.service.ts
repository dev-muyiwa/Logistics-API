import { Token } from '../models/token'
import { ulid } from 'ulid'
import { pgClient } from '../index'
import Exception from '../utils/exception'

export class TokenService {
  public static async createToken(data: Token) {
    const { code, type, expires_at, user_id } = data
    const id = ulid()
    const query = `INSERT INTO tokens (id, code, type, expires_at, user_id, updated_at)
                       VALUES ($1, $2, $3, $4, $5, $6)
                       RETURNING *`
    const result = await pgClient.query(query, [
      id,
      code,
      type,
      expires_at,
      user_id,
      new Date()
    ])

    if (result && result.rowCount! > 0) {
      return result.rows[0]
    } else {
      throw new Exception('error creating record', Exception.SERVER_ERROR)
    }
  }

  public static async findOneByCode(code: string) {
    const query = `SELECT * FROM tokens WHERE code = $1`
    const result = await pgClient.query(query, [code])

    if (result && result.rows.length > 0) {
      return result.rows[0]
    } else {
      return null
    }
  }

  public static async updateToken(data: Token) {
    const { id, expires_at, verified_at } = data
    const query = `UPDATE tokens SET expires_at = $2, verified_at = $3, updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *`
    const result = await pgClient.query(query, [id, expires_at, verified_at])
    if (result.rows.length === 0) {
      return Exception.notFound()
    }

    return result.rows[0]
  }

  public static async deleteToken(code: string) {
    const query = `DELETE FROM tokens WHERE code = $1`
    const result = await pgClient.query(query, [code])
  }
}
