import {z} from "zod";

export function validatePackageCreationParams(data: any) {
    return z
        .object({
            name: z
                .string({
                    required_error: 'Name is required'
                })
                .trim()
                .min(2, 'Must be 2 or more characters long'),
            description: z
                .string({
                    required_error: 'Last name is required'
                })
                .trim()
                .min(2, 'Must be 2 or more characters long').optional().nullish(),
            primary_email: z.string().trim().email({message: 'Recipient\'s primary email is required'}),
            secondary_email: z.string().trim().email({message: 'Secondary email is required'}).optional().nullish(),
            pickup_date: z.string({required_error: 'Pickup date is required'}),
        })
        .refine((data) => data.primary_email !== data.secondary_email, {
            message: 'Secondary email cannot be the same as the primary email',
            path: ['secondary_email']
        }).refine(data => new Date(data.pickup_date) > new Date(), {
            message: 'Pickup date must be greater than the current date',
            path: ['pickup_date']
        }).refine(data => {
            if (data.description === '' || data.description === undefined) data.description = null
            if (data.secondary_email === '' || data.secondary_email === undefined) data.secondary_email = null

            return true;
        }).parse(data)
}