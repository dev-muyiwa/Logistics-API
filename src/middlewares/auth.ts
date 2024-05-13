import {NextFunction, Request, Response} from 'express'
import Exception from "../utils/exception";
import {AuthService} from "../services/auth.service";
import {JwtPayload} from "jsonwebtoken";
import {UserService} from "../services/user.service";
import {errorResponse} from "../utils/handler";
import {User} from "../models/user";

export interface AuthenticatedRequest extends Request {
    id?: string
    user?: User
}

export async function authorizeAccessToken(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
) {
    try {
        if (!req?.headers?.authorization?.startsWith('Bearer')) {
            throw new Exception("missing bearer token in the request header")
        }
        const token: string = req.headers.authorization.split(' ')[1].trim()
        if (!token || token === '') {
            throw new Exception('invalid bearer token')
        }

        const decodedJwt = await AuthService.verifyAccessToken(token) as JwtPayload
        const {id} = decodedJwt
        const user = await UserService.findOneById(id)
        if (!user) {
            return Exception.notFound()
        }

        if (!user.refresh_token) {
            return Exception.forbidden()
        }

        req.id = id
        req.user = user

        return next()
    } catch (err) {
        return errorResponse(res, err)
    }
}