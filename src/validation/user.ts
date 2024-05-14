import {z, ZodError} from "zod";
import Exception from "../utils/exception";

export function validateUpdateUserParams(data: any) {
    return z
        .object({
            first_name: z
                .string({
                    required_error: 'First name is required'
                })
                .trim()
                .optional().nullish(),
            last_name: z
                .string({
                    required_error: 'Last name is required'
                })
                .trim()
                .optional().nullish(),
            phone_number: z.string().trim().optional().nullish(),
        }).refine(data => {
            if (data.first_name === '' || data.first_name === undefined) data.first_name = null
            if (data.last_name === '' || data.last_name === undefined) data.last_name = null
            if (data.phone_number === '' || data.phone_number === undefined) data.phone_number = null;

            return true;
        }).parse(data)
}

export function validateGetPackagesPaginationParams(data: any) {
    return z
        .object(({
            page: z.string().optional().default('1')
        }))
        .refine(data => {
            const page = parseInt(data.page);
            if (isNaN(page)) {
                throw new Exception('Page must be a number');
            }
            return { page };
        }).parse(data)
}