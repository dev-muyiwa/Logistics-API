import {pgClient} from "../index";
import {ulid} from "ulid";
import Exception from "../utils/exception";
import {User} from "../models/user";

export class UserService {
    public static async findOneByEmail(email: string) {
        const query = `SELECT *
                       FROM users
                       WHERE email = $1`
        const result = await pgClient?.query(query, [email])

        if (result && result.rows.length > 0) {
            return result.rows[0]
        } else {
            return null
        }
    }

    public static async findOneById(id: string) {
        const query = `SELECT *
                       FROM users
                       WHERE id = $1`
        const result = await pgClient?.query(query, [id])

        if (result && result.rows.length > 0) {
            return result.rows[0]
        } else {
            return null
        }
    }

    public static async findOneBy(data: User) {
        if (Object.keys(data).length === 0) {
            throw new Error('no fields to update provided')
        }

        const values = Object.values(data).filter(value => value !== undefined)
        const selectClause = Object.keys(data)
            .map((key, index) => `${key} = $${index + 1}`)
            .join(' AND ')

        const query = `SELECT *
                       FROM users
                       WHERE ${selectClause}`;
        const result = await pgClient.query(query, [...values]);

        if (result.rows.length === 0) {
            return Exception.notFound();
        }

        return result.rows[0];
    }

    public static async createUser(data: User,) {
        const {first_name, last_name, email, phone_number, password, refresh_token} = data
        const id = ulid()
        const query = `INSERT INTO users (id, first_name, last_name, email, phone_number, password, refresh_token,
                                          updated_at)
                       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                       RETURNING id, first_name, last_name, email, phone_number, refresh_token, created_at, updated_at`
        const result = await pgClient.query(query, [id, first_name, last_name, email, phone_number, password, refresh_token, new Date()])

        if (result && result.rowCount! > 0) {
            return result.rows[0]
        } else {
            throw new Exception('error creating record', Exception.SERVER_ERROR)
        }
    }

    public static async updateUser(data: User) {
        const {id, ...fieldsToUpdate} = data
        if (!id) {
            throw new Exception('missing id for update operation', Exception.SERVER_ERROR)
        }

        if (Object.keys(fieldsToUpdate).length === 0) {
            throw new Error('no fields to update provided')
        }

        const setClause = Object.keys(fieldsToUpdate)
            .map((key, index) => `${key} = $${index + 2}`)
            .join(', ')

        const values = [id, ...Object.values(fieldsToUpdate)];
        const query = `UPDATE users
                       SET ${setClause},
                           updated_at = CURRENT_TIMESTAMP
                       WHERE id = $1
                       RETURNING *`

        const result = await pgClient.query(query, values);
        if (result.rows.length === 0) {
            return Exception.notFound()
        }

        return result.rows[0]
    }
}