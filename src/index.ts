import { config } from './core/config'
import { setUpDatabase } from './core/db'
import app from './core/app'
import { Client } from 'pg'
import { SentMessageInfo, Transporter } from 'nodemailer'
import { setupMailTransporter } from './utils/mail'
import dotenv from 'dotenv'

console.info(`Starting the server on ${config.NODE_ENV} environment.`)

export let pgClient: Client
export let transporter: Transporter<SentMessageInfo>
setUpDatabase().then(async (client) => {
  dotenv.config()

  transporter = await setupMailTransporter()
  app.listen(config.PORT, () => {
    console.info(`Server is running at port ${config.PORT}`)
    pgClient = client
  })
})
