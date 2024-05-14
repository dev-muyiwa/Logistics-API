import {Router} from "express";
import {PackageController} from "../controllers/package.controller";
import {authorizeAccessToken} from "../middlewares/auth";

const packageRouter: Router = Router()
const packageController: PackageController = new PackageController()

packageRouter.post('/', authorizeAccessToken, packageController.createPackage)
packageRouter.post('/:packageId', packageController.findPackage)


export default packageRouter