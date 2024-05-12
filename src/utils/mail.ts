import nodemailer from "nodemailer";
import {config} from "../core/config";
import {transporter} from "../index";


export class MailDto {
    from?: string
    to!: string | string[]
    subject!: string
    body?: string
    html?: string
    sender?: string
}

export async function setupMailTransporter() {
    try {
        return nodemailer.createTransport({
            host: config.MAIL.HOST,
            port: config.MAIL.SMTP_PORT,
            name: 'Logistik',
            secure: config.MAIL.TLS === 'yes',
            auth: {
                user: config.MAIL.USER,
                pass: config.MAIL.PASSWORD
            }
        })
    } catch (err) {
        throw err
    }
}

export async function sendEmail(dto: MailDto) {
    return await transporter.sendMail({
        from: dto.from || `Logistik ${config.MAIL.SENDER}`,
        sender: dto.sender || config.MAIL.SENDER,
        to: dto.to,
        subject: dto.subject,
        text: dto.body,
        html: dto.html
    })
}