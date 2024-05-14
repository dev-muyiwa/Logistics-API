import { Client } from 'pg'
import { config } from './config'

export async function setUpDatabase(): Promise<Client> {
  const client = new Client({
    user: config.DB.USER,
    password: config.DB.PASSWORD,
    database: config.DB.NAME,
    host: config.DB.HOST,
    port: config.DB.PORT
  })

  try {
    await client.connect()
    console.log('Connected to DB')
  } catch (err) {
    await client.end()
    console.log('Error with Database:', err)
  }

  return client
}
