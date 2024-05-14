import { Router } from 'express'
import { AuthController } from '../controllers/auth.controller'

const authRouter: Router = Router()
const authController: AuthController = new AuthController()

authRouter.post('/register', authController.register)
authRouter.post('/login', authController.login)
authRouter.post('/forgot-password', authController.forgotPassword)
authRouter.post('/verify-reset-token', authController.verifyPasswordResetToken)
authRouter.post('/reset-password', authController.resetPassword)

authRouter.post('/generate-token', authController.generateAccessToken)

export default authRouter
