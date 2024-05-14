import {Request, Response} from "express";
import {
    validateForgotPasswordParams,
    validateGenerateAccessTokenParams,
    validateResetPasswordParams,
    validateUserLoginParams,
    validateUserRegistrationParams,
    validateVerifyTokenParams
} from "../validation/auth";
import {UserService} from "../services/user.service";
import {AuthService} from "../services/auth.service";
import {errorResponse, successResponse} from "../utils/handler";
import Exception from "../utils/exception";
import {config} from "../core/config";
import {sendEmail} from "../utils/mail";
import {TokenService} from "../services/token.service";
import {JwtPayload} from "jsonwebtoken";
import {ulid} from "ulid";

export class AuthController {

    public async register(req: Request, res: Response) {
        try {
            const validatedInput = validateUserRegistrationParams(req.body);
            const existingUser = await UserService.findOneByEmail(validatedInput.email)
            if (existingUser) {
                throw new Exception('an account exists with this email')
            }

            validatedInput.password = await AuthService.hashPassword(validatedInput.password)
            const userId = ulid()
            const refreshToken = AuthService.generateRefreshToken(userId, validatedInput.email)

            const user = await UserService.createUser({id: userId, ...validatedInput, refresh_token: refreshToken})

            await sendEmail({
                to: validatedInput.email,
                subject: `Welcome to ${config.APP_NAME}!`,
                html: `<h1>You have registered successfully as a user on our platform.</h1>>`
            })

            return successResponse(res, user, 'account created', 201)
        } catch (err) {
            return errorResponse(res, err)
        }
    }

    public async login(req: Request, res: Response) {
        try {
            const {email, password} = validateUserLoginParams(req.body)
            let existingUser = await UserService.findOneByEmail(email)
            if (!existingUser) {
                return Exception.notFound()
            }

            if (!await AuthService.verifyPassword(password, existingUser.password)) {
                throw new Exception('invalid login credentials')
            }

            const accessToken = AuthService.generateAccessToken(existingUser.id, existingUser.email)
            if (!existingUser.refresh_token) {
                const refreshToken = AuthService.generateRefreshToken(existingUser.id, existingUser.email)
                existingUser = await UserService.updateUser({id: existingUser.id, refresh_token: refreshToken})
            }

            return successResponse(res, {
                id: existingUser.id,
                access_token: accessToken,
                refresh_token: existingUser.refresh_token
            }, 'account logged in')
        } catch (err) {
            return errorResponse(res, err)
        }
    }

    public async forgotPassword(req: Request, res: Response) {
        try {
            const {email} = validateForgotPasswordParams(req.body)
            const existingUser = await UserService.findOneByEmail(email)
            if (!existingUser) {
                return Exception.notFound()
            }

            const resetToken = AuthService.generatePasswordResetToken(existingUser.id, email)
            //     store token to db
            const expiryDate = new Date(new Date().getTime() + 60 * 60 * 30)
            await TokenService.createToken({
                code: resetToken,
                type: 'reset',
                user_id: existingUser.id
            })

            const frontendResetUrl = `${config.BASE_URL}/reset-password?t=${resetToken}`

            await sendEmail({
                to: email,
                subject: 'Password Reset requested',
                html: `<h>You have requested for a password reset. Here is your reset url: <a href="${frontendResetUrl}">Click Here</a></h>`
            })

            return successResponse(res, null, 'password reset link sent to your mail')
        } catch (err) {
            return errorResponse(res, err)
        }
    }

    public async verifyPasswordResetToken(req: Request, res: Response) {
        try {
            const {reset_token,} = validateVerifyTokenParams(req.body)
            const token = await TokenService.findOneByCode(reset_token)
            if (!token) {
                return Exception.notFound()
            }
            if (token.verified_at) {
                throw new Exception('reset token has been verified')
            }
            //     verify the token via jwt
            const tokenJwt = await AuthService.verifyPasswordResetToken(reset_token) as JwtPayload
            if (token.user_id != tokenJwt.id) {
                return Exception.unauthorized()
            }
            const expirationTime = new Date()
            expirationTime.setMinutes(expirationTime.getMinutes() + 20)
            await TokenService.updateToken({
                id: token.id,
                verified_at: new Date(),
                expires_at: expirationTime
            })

            return successResponse(res, null, 'reset token verified')
        } catch (err) {
            return errorResponse(res, err)
        }
    }

    public async resetPassword(req: Request, res: Response) {
        try {
            const {new_password, reset_token} = validateResetPasswordParams(req.body, req.query)
            const token = await TokenService.findOneByCode(reset_token)
            if (!token) {
                return Exception.notFound()
            }
            if (!token.verified_at) {
                throw new Exception('reset token has not been verified')
            }

            if (token.expires_at < new Date()) {
                throw new Exception('reset token has expired')
            }

            const user = await UserService.findOneById(token.user_id)
            if (!user) {
                return Exception.notFound()
            }

            const refreshToken = AuthService.generateRefreshToken(user.id, user.email)
            await UserService.updateUser({
                id: user.id,
                password: await AuthService.hashPassword(new_password),
                refresh_token: refreshToken
            })
            await TokenService.deleteToken(reset_token)

            await sendEmail({
                to: user.email,
                subject: 'Successful Password Reset',
                html: `<h>You have successfully reset your password.</h>`
            })

            return successResponse(res, null, 'password reset')
        } catch (err) {
            return errorResponse(res, err)
        }
    }

    public async generateAccessToken(req: Request, res: Response) {
        try {
            const {refresh_token} = validateGenerateAccessTokenParams(req.body)
            const tokenJwt = await AuthService.verifyRefreshToken(refresh_token) as JwtPayload

            const user = await UserService.findOneBy({refresh_token: refresh_token, email: tokenJwt.email})
            if (!user) {
                return Exception.notFound()
            }

            const accessToken = AuthService.generateAccessToken(user.id, user.email)

            return successResponse(res, {access_token: accessToken}, 'access token generated')
        } catch (err) {
            return errorResponse(res, err)
        }
    }
}