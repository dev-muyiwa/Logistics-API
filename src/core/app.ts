import express, {Application} from "express";
import authRouter from "../routes/auth.routes";
import {apiErrorHandler, undefinedRouteHandler} from "../utils/handler";
import userRouter from "../routes/user.routes";
import {authorizeAccessToken} from "../middlewares/auth";
import packageRouter from "../routes/package.routes";

const app: Application = express()

app.use(express.urlencoded({extended: true}))
app.use(express.json())

app.use('/api/auth', authRouter)
app.use('/api/users', authorizeAccessToken, userRouter)
app.use('/api/packages', packageRouter)

app.use(undefinedRouteHandler)
app.use(apiErrorHandler)

export default app