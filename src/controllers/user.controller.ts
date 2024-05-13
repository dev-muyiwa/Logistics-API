import {Response} from "express";
import {errorResponse, successResponse} from "../utils/handler";
import {AuthenticatedRequest} from "../middlewares/auth";
import {User} from "../models/user";
import {validateUpdateUserParams} from "../validation/user";
import {UserService} from "../services/user.service";

export class UserController {
    public async getMe(req: AuthenticatedRequest, res: Response) {
        try {
            const {password, ...user} = req.user as User

            return successResponse(res, user, 'profile fetched')
        } catch (err) {
            return errorResponse(res, err)
        }
    }

    public async updateMe(req: AuthenticatedRequest, res: Response) {
        try {
            const user = req.user as User
            const {first_name, last_name, phone_number} = validateUpdateUserParams(req.body)

            const {password, ...updatedUser} = await UserService.updateUser({
                id: user.id,
                first_name: first_name ?? user.first_name,
                last_name: last_name ?? user.last_name,
                phone_number: phone_number ?? user.phone_number
            })

            return successResponse(res, updatedUser, 'profile updated')
        } catch (err) {
            return errorResponse(res, err)
        }
    }

    public async logout(req: AuthenticatedRequest, res: Response) {
        try {
            const user = req.user as User

            await UserService.updateUser({
                id: user.id,
                refresh_token: null
            })

            return successResponse(res, null, 'account logged out')
        } catch (err) {
            return errorResponse(res, err)
        }
    }
}