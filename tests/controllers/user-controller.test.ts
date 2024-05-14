import { Request, Response } from 'express'
import { UserController } from '../../src/controllers/user.controller'
import { UserService } from '../../src/services/user.service'
import { AuthService } from '../../src/services/auth.service'
import { User } from '../../src/models/user'
import { AuthenticatedRequest } from '../../src/middlewares/auth'
import clearAllMocks = jest.clearAllMocks

jest.mock('../../src/services/user.service')
jest.mock('../../src/services/auth.service')
jest.mock('../../src/services/package.service')

describe('UserController', () => {
  let req: Partial<Request>
  let res: Partial<Response>
  let userController: UserController
  let user: User

  beforeAll(() => {
    user = {
      id: 'user_id',
      first_name: 'first_name',
      last_name: 'last_name',
      email: 'test@example.com',
      refresh_token: 'refreshToken'
    } as User

    ;(UserService.createUser as jest.Mock).mockResolvedValueOnce(user)
    ;(AuthService.generateAccessToken as jest.Mock).mockReturnValueOnce(
      'access_token'
    )
  })

  beforeEach(() => {
    req = {}
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    }
    userController = new UserController()
  })

  afterEach(() => {
    clearAllMocks()
  })

  describe('getMe', () => {
    it('should get the info on the currently authenticated user', async () => {
      const req = {
        user: user
      } as AuthenticatedRequest

      await userController.getMe(req as AuthenticatedRequest, res as Response)

      expect(res.status).toHaveBeenCalledWith(200)
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: expect.objectContaining({
          ...user
        }),
        message: 'profile fetched'
      })
    })
  })

  describe('updateMe', () => {
    it('should update the user profile with provided fields', async () => {
      const req = {
        user: user
      } as AuthenticatedRequest

      const updatedUser = {
        id: 'user_id',
        first_name: 'first_name_new',
        last_name: 'last_name_new'
      } as User

      req.body = updatedUser

      ;(UserService.updateUser as jest.Mock).mockResolvedValueOnce(updatedUser)

      await userController.updateMe(
        req as AuthenticatedRequest,
        res as Response
      )

      expect(UserService.updateUser).toHaveBeenCalledWith(updatedUser)

      expect(res.status).toHaveBeenCalledWith(200)
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: updatedUser,
        message: 'profile updated'
      })
    })
  })

  describe('AuthController - logout', () => {
    it('should logout the user by removing the refresh token', async () => {
      const req = {
        user: user
      } as AuthenticatedRequest

      ;(UserService.updateUser as jest.Mock).mockResolvedValueOnce({
        id: 'user_id',
        refresh_token: null
      })
      await userController.logout(req as AuthenticatedRequest, res as Response)

      expect(UserService.updateUser).toHaveBeenCalledWith({
        id: 'user_id',
        refresh_token: null
      })

      expect(res.status).toHaveBeenCalledWith(200)
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: 'account logged out'
        })
      )
    })
  })
})
