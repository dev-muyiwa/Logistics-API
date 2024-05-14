import { Router } from 'express'
import { UserController } from '../controllers/user.controller'

const userRouter: Router = Router()
const userController: UserController = new UserController()

userRouter.get('/me', userController.getMe)
userRouter.put('/me', userController.updateMe)
userRouter.get('/me/packages', userController.getMyPackages)
userRouter.post('/me/logout', userController.logout)

export default userRouter
