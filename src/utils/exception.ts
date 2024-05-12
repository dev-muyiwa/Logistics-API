export default class Exception extends Error {
    code: number

    static BAD_REQUEST: number = 400
    static UNAUTHORIZED: number = 401
    static FORBIDDEN: number = 403
    static NOT_FOUND: number = 404
    static SERVER_ERROR: number = 500

    constructor(message: string, code: number = Exception.BAD_REQUEST) {
        super(message)
        this.name = this.constructor.name
        this.code = code
        Error.captureStackTrace(this, this.constructor)
    }

    static notFound () {
        throw new Exception('record does not exist', Exception.NOT_FOUND)
    }

    static forbidden () {
        throw new Exception('forbidden request', Exception.FORBIDDEN)
    }

    static unauthorized () {
        throw new Exception('unauthorized request', Exception.UNAUTHORIZED)
    }
}
