import {AuthenticatedRequest} from "../middlewares/auth";
import {Response} from "express";
import {errorResponse, successResponse} from "../utils/handler";
import {validatePackageCreationParams} from "../validation/package";
import {User} from "../models/user";
import {PackageService} from "../services/package.service";
import {sendEmail} from "../utils/mail";
import {formatDate} from "../utils/util";
import {PackageStatus} from "../models/package";
import Exception from "../utils/exception";

export class PackageController {
    async createPackage(req: AuthenticatedRequest, res: Response) {
        try {
            const user = req.user as User
            const {
                name,
                description,
                primary_email,
                secondary_email,
                pickup_date
            } = validatePackageCreationParams(req.body)

            const newPackage = await PackageService.createPackage({
                name: name,
                description: description,
                primary_email: primary_email,
                secondary_email: secondary_email,
                pickup_date: new Date(pickup_date),
                user_id: user.id,
            })

            await sendEmail({
                to: primary_email,
                subject: 'Package confirmation',
                html: `<p>Hello.\n You have a package to be delivered to you on ${formatDate(new Date(pickup_date))} with tracking code ${newPackage.tracking_code}.</p>`
            })

            await PackageController.updatePackageStatus(newPackage.id, user.email!)

            return successResponse(res, newPackage, 'package created', 201)
        } catch (err) {
            return errorResponse(res, err)
        }
    }

    async findPackage(req: AuthenticatedRequest, res: Response) {
        try {
            const user = req.user as User
            const {packageId} = req.params

            const existingPackage = await PackageService.findOneById(packageId)
            if (!existingPackage || existingPackage.user_id !== user.id) {
                return Exception.notFound()
            }

            return successResponse(res, existingPackage, 'package fetched')
        } catch (err) {
            return errorResponse(res, err)
        }
    }

    private static async updatePackageStatus(packageId: string, senderEmail: string) {
        const interval = 2 * 60 * 1000 // 2 minutes in milliseconds

        const updateInterval = setInterval(async () => {
            try {
                const existingPackage = await PackageService.findOneById(packageId);

                if (existingPackage.status === PackageStatus.Delivered) {
                    clearInterval(updateInterval);
                    console.log(`Package ${packageId} is delivered.`);
                    await sendEmail({
                        to: [senderEmail, existingPackage.primary_email],
                        subject: `Successful Delivery of package ${packageId}`,
                        html: `<p>Hello.\n Your package with ID of ${packageId} has been successfully delivered.</p>`
                    })
                    return;
                }

                let nextStatus: PackageStatus;
                switch (existingPackage.status) {
                    case PackageStatus.Pending:
                        nextStatus = PackageStatus.In_Transit;
                        break;
                    case PackageStatus.In_Transit:
                        nextStatus = PackageStatus.Out_for_Delivery;
                        break;
                    case PackageStatus.Out_for_Delivery:
                        nextStatus = PackageStatus.Delivered;
                        break;
                    default:
                        nextStatus = existingPackage.status;
                        break;
                }

                await PackageService.updatePackage({id: existingPackage.id, status: nextStatus});
                console.log(`Package ${packageId} status updated to: ${nextStatus}`)

            } catch (error) {
                console.error('Error occurred while updating package status:', error)
                clearInterval(updateInterval)
            }
        }, interval);
    }
}