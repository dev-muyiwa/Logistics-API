import {Router} from "express";
import {PackageController} from "../controllers/package.controller";
import {authorizeAccessToken} from "../middlewares/auth";

const packageRouter: Router = Router()
const packageController: PackageController = new PackageController()

packageRouter.post('/', authorizeAccessToken, packageController.createPackage)
packageRouter.get('/:packageId', packageController.findPackage)
packageRouter.put('/:packageId/submit', authorizeAccessToken, packageController.submitPackageForDelivery)


export default packageRouter