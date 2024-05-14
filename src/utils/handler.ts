import { NextFunction, Request, Response } from 'express'
import Exception from './exception'
import { ZodError } from 'zod'

export function successResponse(
  res: Response,
  data: any,
  message: string,
  code: number = 200
): Response {
  return res.status(code).json({ success: true, data: data, message: message })
}

export function errorResponse(
  res: Response,
  err: any,
  message?: string,
  code: number = Exception.BAD_REQUEST
): Response {
  if (err instanceof Exception) {
    return res
      .status(err.code)
      .json({ success: false, error: null, message: err.message })
  } else if (err instanceof ZodError) {
    return errorResponse(
      res,
      err.errors.map((error) => {
        if (error.message) {
          return { field: error.path, message: error.message }
        }
      }),
      'Validation errors'
    )
  } else {
    return res
      .status(code)
      .json({ success: false, error: err, message: err.message ?? message })
  }
}

export function undefinedRouteHandler(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const error = new Exception(`Endpoint does not exist`, Exception.NOT_FOUND)
  errorResponse(res, error)
}

export function apiErrorHandler(err: Error, req: Request, res: Response): void {
  errorResponse(res, err)
}
