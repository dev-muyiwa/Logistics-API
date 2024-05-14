import { AuthenticatedRequest } from '../middlewares/auth'
import { Request, Response } from 'express'
import { errorResponse, successResponse } from '../utils/handler'
import { validatePackageCreationParams } from '../validation/package'
import { User } from '../models/user'
import { PackageService } from '../services/package.service'
import { sendEmail } from '../utils/mail'
import { formatDate } from '../utils/util'
import { PackageStatus } from '../models/package'
import Exception from '../utils/exception'

export class PackageController {
  async createPackage(req: AuthenticatedRequest, res: Response) {
    try {
      const user = req.user as User
      const { name, description, primary_email, secondary_email, pickup_date } =
        validatePackageCreationParams(req.body)

      const newPackage = await PackageService.createPackage({
        name: name,
        description: description,
        primary_email: primary_email,
        secondary_email: secondary_email,
        pickup_date: new Date(pickup_date),
        user_id: user.id
      })

      return successResponse(res, newPackage, 'package created', 201)
    } catch (err) {
      return errorResponse(res, err)
    }
  }

  async findPackage(req: Request, res: Response) {
    try {
      // const user = req.user as User
      const { packageId } = req.params

      const existingPackage = await PackageService.findOneById(packageId)
      if (!existingPackage) {
        return Exception.notFound()
      }

      return successResponse(res, existingPackage, 'package fetched')
    } catch (err) {
      return errorResponse(res, err)
    }
  }

  async submitPackageForDelivery(req: AuthenticatedRequest, res: Response) {
    try {
      const user = req.user as User
      const { packageId } = req.params

      let existingPackage = await PackageService.findOneById(packageId)
      if (!existingPackage || existingPackage.user_id !== user.id) {
        return Exception.notFound()
      }

      if (existingPackage.status !== PackageStatus.Pending) {
        throw new Exception('you can only submit pending packages')
      }

      existingPackage = await PackageService.updatePackage({
        id: existingPackage.id,
        status: PackageStatus.In_Transit
      })
      await sendEmail({
        to: existingPackage.primary_email,
        subject: 'Package confirmation',
        html: `<p>Hello.\n You have a package to be delivered to you on ${formatDate(existingPackage.pickup_date)} with tracking code ${existingPackage.id}.</p>`
      })

      await PackageController.updatePackageStatus(
        existingPackage.id,
        user.email!
      )

      return successResponse(
        res,
        existingPackage,
        'package is being processed for delivery'
      )
    } catch (err) {
      return errorResponse(res, err)
    }
  }

  private static async updatePackageStatus(
    packageId: string,
    senderEmail: string
  ) {
    const interval = 1 * 60 * 1000 // 2 minutes in milliseconds

    const updateInterval = setInterval(async () => {
      try {
        const existingPackage = await PackageService.findOneById(packageId)

        let nextStatus: PackageStatus
        switch (existingPackage.status) {
          case PackageStatus.In_Transit:
            nextStatus = PackageStatus.Ready_for_Pickup
            break
          case PackageStatus.Ready_for_Pickup:
            nextStatus = PackageStatus.Out_for_Delivery
            break
          case PackageStatus.Out_for_Delivery:
            nextStatus = PackageStatus.Delivered
            break
          default:
            nextStatus = existingPackage.status
            break
        }

        await PackageService.updatePackage({
          id: existingPackage.id,
          status: nextStatus
        })
        console.log(`Package ${packageId} status updated to: ${nextStatus}`)

        if (nextStatus === PackageStatus.Delivered) {
          clearInterval(updateInterval)
          console.log(`Package ${packageId} is delivered.`)
          await sendEmail({
            to: [senderEmail, existingPackage.primary_email],
            subject: `Successful Delivery of package ${packageId}`,
            html: `<p>Hello.\n Your package with ID of ${packageId} has been successfully delivered.</p>`
          })
          return
        }
      } catch (error) {
        console.error('Error occurred while updating package status:', error)
        clearInterval(updateInterval)
      }
    }, interval)
  }
}
