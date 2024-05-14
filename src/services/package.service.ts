import { Package } from '../models/package'
import { ulid } from 'ulid'
import { pgClient } from '../index'
import Exception from '../utils/exception'

export class PackageService {
  public static async createPackage(data: Package) {
    const {
      name,
      description,
      primary_email,
      secondary_email,
      user_id,
      pickup_date
    } = data
    const query = `INSERT INTO packages (id, name, description, pickup_date, primary_email, secondary_email, tracking_code,
                                   user_id, updated_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
             RETURNING *`
    const result = await pgClient.query(query, [
      ulid(),
      name,
      description,
      pickup_date,
      primary_email,
      secondary_email,
      ulid(),
      user_id,
      new Date()
    ])

    if (result && result.rowCount! > 0) {
      return result.rows[0]
    } else {
      throw new Exception('error creating record', Exception.SERVER_ERROR)
    }
  }

  public static async getPackagesForAUser(id: string, page: number) {
    const limit = 20
    const offset = (page - 1) * limit
    const paginatedQuery = `SELECT * FROM packages WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3`
    const countQuery = `SELECT COUNT(*) AS total_count FROM packages WHERE user_id = $1`
    try {
      await pgClient.query('BEGIN')

      const paginatedResult = await pgClient.query(paginatedQuery, [
        id,
        limit,
        offset
      ])
      const countResult = await pgClient.query(countQuery, [id])

      await pgClient.query('COMMIT')

      return {
        data: paginatedResult.rows,
        total_count: countResult.rows[0].total_count
      }
    } catch (err) {
      await pgClient.query('ROLLBACK')
      throw new Exception('error fetching data', Exception.SERVER_ERROR)
    }
  }

  public static async findOneById(id: string) {
    const query = `SELECT * FROM packages WHERE id = $1`
    const result = await pgClient.query(query, [id])

    if (result && result.rowCount! > 0) {
      return result.rows[0]
    } else {
      return null
    }
  }

  public static async updatePackage(data: Package) {
    const { id, ...fieldsToUpdate } = data
    if (!id) {
      throw new Exception(
        'missing id for update operation',
        Exception.SERVER_ERROR
      )
    }

    if (Object.keys(fieldsToUpdate).length === 0) {
      throw new Error('no fields to update provided')
    }

    const setClause = Object.keys(fieldsToUpdate)
      .map((key, index) => `${key} = $${index + 2}`)
      .join(', ')

    const values = [id, ...Object.values(fieldsToUpdate)]
    const query = `UPDATE packages SET ${setClause}, updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *`

    const result = await pgClient.query(query, values)
    if (result.rows.length === 0) {
      return Exception.notFound()
    }

    return result.rows[0]
  }
}
