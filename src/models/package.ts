export enum PackageStatus {
    Pending = "Pending",
    In_Transit = "In Transit",
    Out_for_Delivery = "Out for Delivery",
    Delivered = "Delivered"
}

export class Package {
    id?: string
    name?: string
    description?: string | null
    status?: PackageStatus
    pickup_date?: Date
    primary_email?: string
    secondary_email?: string | null
    tracking_code?: string
    user_id?: string
}