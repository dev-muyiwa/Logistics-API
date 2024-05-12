import express, {Application} from "express";
import authRouter from "../routes/auth.routes";
import {apiErrorHandler, undefinedRouteHandler} from "../utils/handler";

const app: Application = express()

app.use(express.urlencoded({extended: true}))
app.use(express.json())

app.use('/api/auth', authRouter)

app.use(undefinedRouteHandler)
app.use(apiErrorHandler)

export default app