export class Token {
  id?: string
  code?: string
  type?: 'reset' | 'otp'
  verified_at?: Date
  expires_at?: Date
  user_id?: string
}
