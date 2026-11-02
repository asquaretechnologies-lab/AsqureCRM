import nodemailer, { Transporter } from 'nodemailer';
import { logger } from './logger';

let transporter: Transporter | null = null;

function isSmtpConfigured(): boolean {
  return Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
}

function getTransporter(): Transporter {
  if (!transporter) {
    const port = Number(process.env.SMTP_PORT || 587);
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port,
      secure: port === 465,
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    });
  }
  return transporter;
}

/**
 * Sends an email. When SMTP is not configured (no provider yet),
 * the message is written to the logger instead so flows can be tested.
 */
export async function sendMail(to: string, subject: string, text: string, html?: string): Promise<void> {
  if (!isSmtpConfigured()) {
    logger.warn(`[MAILER:DEV] SMTP not configured. Email to=${to} subject="${subject}" body="${text}"`);
    return;
  }
  await getTransporter().sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to,
    subject,
    text,
    html,
  });
}
