import {Request, Response} from 'express';
import {AuthController} from "../../src/controllers/auth.controller";
import {UserService} from "../../src/services/user.service";
import {AuthService} from "../../src/services/auth.service";
import {sendEmail} from "../../src/utils/mail";
import {User} from "../../src/models/user";
import {TokenService} from "../../src/services/token.service";
import clearAllMocks = jest.clearAllMocks;


jest.mock('../../src/services/user.service');
jest.mock('../../src/services/token.service');
jest.mock('../../src/services/auth.service');
jest.mock('../../src/utils/mail');

describe('AuthController', () => {
    let req: Partial<Request>;
    let res: Partial<Response>;
    let authController: AuthController;

    beforeEach(() => {
        req = {};
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis(),
        };
        authController = new AuthController();
    });

    afterEach(() => {
        clearAllMocks()
    })

    describe('register', () => {
        it('should create a new user', async () => {
            req.body = {
                first_name: "John",
                last_name: "Doe",
                email: 'test@example.com',
                password: 'password',
                confirm_password: 'password'
            } as User
            (UserService.findOneByEmail as jest.Mock).mockResolvedValueOnce(null);
            (AuthService.hashPassword as jest.Mock).mockResolvedValueOnce('hashedPassword');
            (AuthService.generateRefreshToken as jest.Mock).mockReturnValueOnce('refreshToken');
            (UserService.createUser as jest.Mock).mockResolvedValueOnce({
                email: 'test@example.com',
                refresh_token: 'refreshToken'
            });

            (sendEmail as jest.Mock).mockResolvedValueOnce(null);
            await authController.register(req as Request, res as Response);

            expect(UserService.findOneByEmail).toHaveBeenCalledWith('test@example.com');
            expect(AuthService.hashPassword).toHaveBeenCalledWith('password');
            expect(sendEmail).toHaveBeenCalledTimes(1)

            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                data: expect.objectContaining({
                    email: 'test@example.com',
                    refresh_token: 'refreshToken'
                }),
                message: 'account created'
            })
        });

        it('should throw an error if email already exists', async () => {
            (UserService.findOneByEmail as jest.Mock).mockResolvedValueOnce({email: 'test@example.com'})

            req.body = {
                first_name: "John",
                last_name: "Doe",
                email: 'test@example.com',
                password: 'password',
                confirm_password: 'password'
            } as User

            await authController.register(req as Request, res as Response)

            expect(UserService.findOneByEmail).toHaveBeenCalledWith('test@example.com');
            expect(AuthService.hashPassword).not.toHaveBeenCalled();
            expect(UserService.createUser).not.toHaveBeenCalled();
            expect(sendEmail).not.toHaveBeenCalled();
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                success: false,
                message: 'an account exists with this email'
            }))
        })
    });

    describe('login', () => {
        it('should login an existing user', async () => {
            req.body = {
                email: 'test@example.com',
                password: 'password',
            } as User

            (UserService.findOneByEmail as jest.Mock)
                .mockResolvedValueOnce({
                    id: 'user_id',
                    email: 'test@example.com',
                    password: 'password',
                    refresh_token: 'refresh_token'
                });
            (AuthService.verifyPassword as jest.Mock).mockResolvedValueOnce(true);
            (AuthService.generateAccessToken as jest.Mock).mockReturnValueOnce('access_token');

            await authController.login(req as Request, res as Response);

            expect(UserService.findOneByEmail).toHaveBeenCalledWith('test@example.com');
            expect(AuthService.generateAccessToken as jest.Mock).toHaveBeenCalled();

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                data: expect.objectContaining({
                    id: 'user_id',
                    access_token: 'access_token',
                    refresh_token: 'refresh_token'
                }),
                message: 'account logged in'
            })
        })

        it('should login an existing user and generate a new refresh token if there is none', async () => {
            req.body = {
                email: 'test@example.com',
                password: 'password',
            } as User

            (UserService.findOneByEmail as jest.Mock)
                .mockResolvedValueOnce({
                    id: 'user_id',
                    email: 'test@example.com',
                    password: 'password',
                    refresh_token: null
                });
            (AuthService.verifyPassword as jest.Mock).mockResolvedValueOnce(true);
            (AuthService.generateRefreshToken as jest.Mock).mockReturnValueOnce('new_refresh_token');
            (UserService.updateUser as jest.Mock).mockResolvedValueOnce({
                id: 'user_id',
                refresh_token: 'new_refresh_token'
            });

            (AuthService.generateAccessToken as jest.Mock).mockReturnValueOnce('access_token');

            await authController.login(req as Request, res as Response);

            expect(UserService.findOneByEmail).toHaveBeenCalledWith('test@example.com');
            expect(AuthService.generateAccessToken as jest.Mock).toHaveBeenCalled();

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                data: expect.objectContaining({
                    id: 'user_id',
                    access_token: 'access_token',
                    refresh_token: 'new_refresh_token'
                }),
                message: 'account logged in'
            })
        })

        it('should return and error if the email wasn\'t found', async () => {
            req.body = {
                email: 'test@example.com',
                password: 'password',
            } as User

            (UserService.findOneByEmail as jest.Mock).mockResolvedValueOnce(null);

            await authController.login(req as Request, res as Response);

            expect(UserService.findOneByEmail).toHaveBeenCalledWith('test@example.com');
            expect(AuthService.verifyPassword).not.toHaveBeenCalled();
            expect(AuthService.generateAccessToken).not.toHaveBeenCalled();

            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                success: false,
                message: 'record does not exist'
            }))
        });

        it('should return an error if the password is incorrect', async () => {
            req.body = {
                email: 'test@example.com',
                password: 'password1',
            } as User

            (UserService.findOneByEmail as jest.Mock)
                .mockResolvedValueOnce({
                    id: 'user_id',
                    email: 'test@example.com',
                    password: 'password',
                    refresh_token: null
                });

            await authController.login(req as Request, res as Response);

            expect(UserService.findOneByEmail).toHaveBeenCalledWith('test@example.com');
            expect(AuthService.verifyPassword).toHaveBeenCalled();
            expect(AuthService.generateAccessToken).not.toHaveBeenCalled();

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                success: false,
                message: 'invalid login credentials'
            }))
        });
    })

    describe('forgotPassword', () => {
        it('should send a password reset email for an existing user', async () => {
            req.body = {email: 'test@example.com'};
            const resetToken = 'reset_token';

            (UserService.findOneByEmail as jest.Mock).mockResolvedValueOnce({id: 'user_id'});
            (AuthService.generatePasswordResetToken as jest.Mock).mockReturnValueOnce(resetToken);
            (TokenService.createToken as jest.Mock).mockResolvedValueOnce(null);
            (sendEmail as jest.Mock).mockResolvedValueOnce(null);

            await authController.forgotPassword(req as Request, res as Response);

            expect(UserService.findOneByEmail).toHaveBeenCalledWith('test@example.com');
            expect(AuthService.generatePasswordResetToken).toHaveBeenCalledWith('user_id', 'test@example.com');
            expect(TokenService.createToken).toHaveBeenCalledWith({
                code: resetToken,
                type: 'reset',
                user_id: 'user_id'
            });
            expect(sendEmail).toHaveBeenCalled();

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                success: true,
                message: 'password reset link sent to your mail'
            }));
        });

        it('should return 404 if email does not exist', async () => {
            req.body = {email: 'test@example.com'};

            (UserService.findOneByEmail as jest.Mock).mockResolvedValueOnce(null);

            await authController.forgotPassword(req as Request, res as Response);

            expect(UserService.findOneByEmail).toHaveBeenCalledWith('test@example.com');

            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                success: false,
                message: 'record does not exist'
            }));
        });
    });

    describe('verifyPasswordResetToken', () => {
        it('should verify and update the password reset token', async () => {
            req.body = {reset_token: 'reset_token'};

            const token = {id: 'token_id', user_id: 'user_id', verified_at: null};
            const tokenJwt = {id: 'user_id'};

            (TokenService.findOneByCode as jest.Mock).mockResolvedValueOnce(token);
            (AuthService.verifyPasswordResetToken as jest.Mock).mockResolvedValueOnce(tokenJwt);
            (TokenService.updateToken as jest.Mock).mockResolvedValueOnce(null);

            await authController.verifyPasswordResetToken(req as Request, res as Response);

            expect(TokenService.findOneByCode).toHaveBeenCalledWith('reset_token');
            expect(AuthService.verifyPasswordResetToken).toHaveBeenCalledWith('reset_token');
            expect(TokenService.updateToken).toHaveBeenCalledWith({
                id: 'token_id',
                verified_at: expect.any(Date),
                expires_at: expect.any(Date)
            });

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                success: true,
                message: 'reset token verified'
            }));
        });

        it('should return 404 if token does not exist', async () => {
            req.body = {reset_token: 'reset_token'};

            (TokenService.findOneByCode as jest.Mock).mockResolvedValueOnce(null);

            await authController.verifyPasswordResetToken(req as Request, res as Response);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                success: false,
                message: 'record does not exist'
            }));
        });

        it('should return 403 if token has already been verified', async () => {
            req.body = {reset_token: 'verified_token'};

            const token = {id: 'token_id', user_id: 'user_id', verified_at: new Date()};

            (TokenService.findOneByCode as jest.Mock).mockResolvedValueOnce(token);

            await authController.verifyPasswordResetToken(req as Request, res as Response);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                success: false,
                message: 'reset token has been verified'
            }));
        });
    });

    describe('resetPassword', () => {
        it('should reset the password and send confirmation email', async () => {
            req.body = {new_password: 'new_password', confirm_password: 'new_password'};
            req.query = {reset_token: 'reset_token'};

            const expirationTime = new Date()
            expirationTime.setMinutes(expirationTime.getMinutes() + 20)

            const token = {id: 'token_id', user_id: 'user_id', verified_at: new Date(), expires_at: expirationTime};
            const user = {id: 'user_id', email: 'test@example.com'};

            (TokenService.findOneByCode as jest.Mock).mockResolvedValueOnce(token);
            (UserService.findOneById as jest.Mock).mockResolvedValueOnce(user);
            (AuthService.hashPassword as jest.Mock).mockResolvedValueOnce('hashedPassword');
            (AuthService.generateRefreshToken as jest.Mock).mockReturnValueOnce('refreshToken');
            (UserService.updateUser as jest.Mock).mockResolvedValueOnce(null);
            (TokenService.deleteToken as jest.Mock).mockResolvedValueOnce(null);
            (sendEmail as jest.Mock).mockResolvedValueOnce(null);

            await authController.resetPassword(req as Request, res as Response);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                success: true,
                message: 'password reset'
            }));
        });

        it('should throw an error if the token has not been verified', async () => {
            req.body = {new_password: 'new_password', confirm_password: 'new_password'};
            req.query = {reset_token: 'reset_token'};

            const token = {id: 'token_id', user_id: 'user_id', verified_at: null, expires_at: null};

            (TokenService.findOneByCode as jest.Mock).mockResolvedValueOnce(token);

            await authController.resetPassword(req as Request, res as Response);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                success: false,
                message: 'reset token has not been verified'
            }));
        });

        it('should throw an error if the token has expired', async () => {
            req.body = {new_password: 'new_password', confirm_password: 'new_password'};
            req.query = {reset_token: 'reset_token'};

            const expirationTime = new Date()
            expirationTime.setMinutes(expirationTime.getMinutes() - 20)

            const token = {id: 'token_id', user_id: 'user_id', verified_at: new Date(), expires_at: expirationTime};

            (TokenService.findOneByCode as jest.Mock).mockResolvedValueOnce(token);

            await authController.resetPassword(req as Request, res as Response);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                success: false,
                message: 'reset token has expired'
            }));
        });

        it('should throw an error if the user does not exist', async () => {
            req.body = {new_password: 'new_password', confirm_password: 'new_password'};
            req.query = {reset_token: 'reset_token'};

            const expirationTime = new Date()
            expirationTime.setMinutes(expirationTime.getMinutes() + 20)

            const token = {id: 'token_id', user_id: 'user_id', verified_at: new Date(), expires_at: expirationTime};

            (TokenService.findOneByCode as jest.Mock).mockResolvedValueOnce(token);

            await authController.resetPassword(req as Request, res as Response);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                success: false,
                message: 'record does not exist'
            }));
        });
    });

    describe('generateAccessToken', () => {
        it('should generate an access token for a valid refresh token', async () => {
            req.body = {refresh_token: 'refresh_token'};

            const user = {id: 'user_id', email: 'test@example.com'};

            (AuthService.verifyRefreshToken as jest.Mock).mockReturnValueOnce({id: user.id, email: 'test@example.com'});
            (UserService.findOneBy as jest.Mock).mockResolvedValueOnce(user);
            (AuthService.generateAccessToken as jest.Mock).mockReturnValueOnce('access_token');

            await authController.generateAccessToken(req as Request, res as Response);

            expect(AuthService.verifyRefreshToken).toHaveBeenCalledWith('refresh_token');
            expect(UserService.findOneBy).toHaveBeenCalledWith({
                refresh_token: 'refresh_token',
                email: 'test@example.com'
            });
            expect(AuthService.generateAccessToken).toHaveBeenCalledWith('user_id', 'test@example.com');

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                success: true,
                data: {
                    access_token: 'access_token',
                },
                message: 'access token generated'
            }));
        });

        it('should return an error if user does not exist', async () => {
            req.body = {refresh_token: 'refresh_token'};

            (AuthService.verifyRefreshToken as jest.Mock).mockReturnValueOnce({email: 'test@example.com'});
            (UserService.findOneBy as jest.Mock).mockResolvedValueOnce(null);

            await authController.generateAccessToken(req as Request, res as Response);

            expect(AuthService.verifyRefreshToken).toHaveBeenCalledWith('refresh_token');
            expect(UserService.findOneBy).toHaveBeenCalledWith({
                refresh_token: 'refresh_token',
                email: 'test@example.com'
            });

            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                success: false,
                message: 'record does not exist'
            }));
        });
    });
});
