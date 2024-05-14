import { z } from 'zod'

export function validateUserRegistrationParams(data: any) {
  return z
    .object({
      first_name: z
        .string({
          required_error: 'First name is required'
        })
        .trim()
        .min(2, 'Must be 2 or more characters long'),
      last_name: z
        .string({
          required_error: 'Last name is required'
        })
        .trim()
        .min(2, 'Must be 2 or more characters long'),
      email: z.string().trim().email({ message: 'Email is required' }),
      phone_number: z.string().trim().optional().nullish(),
      password: z.string().min(8, 'Must be 8 or more characters long'),
      confirm_password: z.string()
    })
    .refine((data) => data.password === data.confirm_password, {
      message: 'Passwords do not match',
      path: ['confirm_password']
    })
    .refine((data) => {
      if (data.phone_number === '' || data.phone_number === undefined) {
        data.phone_number = null
      }
      return true
    })
    .parse(data)
}

export function validateUserLoginParams(data: any) {
  return z
    .object({
      email: z.string().trim().email({ message: 'Email is required' }),
      password: z.string({
        required_error: 'Password is required'
      })
    })
    .parse(data)
}

export function validateForgotPasswordParams(data: any) {
  return z
    .object({
      email: z.string().trim().email({ message: 'Email is required' })
    })
    .parse(data)
}

export function validateVerifyTokenParams(data: any) {
  return z
    .object({
      reset_token: z
        .string({
          required_error: 'Reset token is required'
        })
        .trim()
    })
    .parse(data)
}

export function validateResetPasswordParams(bodyData: any, queryData: any) {
  const combinedData = { ...bodyData, ...queryData }
  return z
    .object({
      new_password: z.string().min(8, 'Must be 8 or more characters long'),
      confirm_password: z.string(),
      reset_token: z
        .string({
          required_error: 'Reset token is required'
        })
        .trim()
    })
    .refine((data) => data.new_password === data.confirm_password, {
      message: 'Passwords do not match',
      path: ['confirm_password']
    })
    .parse(combinedData)
}

export function validateGenerateAccessTokenParams(data: any) {
  return z
    .object({
      refresh_token: z
        .string({
          required_error: 'Refresh token is required'
        })
        .trim()
    })
    .parse(data)
}
