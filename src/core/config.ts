import dotenv from 'dotenv'

dotenv.config()
export const config = {
  APP_NAME: process.env.APP_NAME,
  BASE_URL: process.env.BASE_URL,
  NODE_ENV: process.env.NODE_ENV || 'development',
  HOST: process.env.HOST || 'localhost',
  PORT: process.env.PORT || 3000,
  BCRYPT_ROUNDS: 13,

  USER_ACCESS_SECRET: process.env.USER_ACCESS_SECRET as string,
  USER_REFRESH_SECRET: process.env.USER_REFRESH_SECRET as string,
  USER_RESET_SECRET: process.env.USER_RESET_SECRET as string,

  DB: {
    NAME: process.env.DB_NAME as string,
    HOST: process.env.DB_HOST,
    PORT: Number(process.env.DB_PORT) || 5432,
    USER: process.env.DB_USER as string,
    PASSWORD: process.env.DB_PASSWORD as string
  },

  MAIL: {
    HOST: process.env.SMTP_HOST,
    SMTP_PORT: Number(process.env.SMTP_PORT)
      ? Number(process.env.SMTP_PORT)
      : 465,
    TLS: process.env.SMTP_TLS || 'yes',
    USER: process.env.SMTP_USERNAME || '',
    PASSWORD: process.env.SMTP_PASSWORD || '',
    SENDER: process.env.SMTP_SENDER
  }
}
