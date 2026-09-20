import nodemailer from "nodemailer";

interface MailAttachment {
  filename: string;
  content: Buffer;
  contentType: string;
}

interface MailOptions {
  to: string;
  subject: string;
  text: string;
  attachments?: MailAttachment[];
}

export class MailNotConfiguredError extends Error {
  constructor() {
    super("Email is not configured on the server");
  }
}

// Reads SMTP settings lazily so a missing .env only fails the send, not the whole server
export const sendMail = async ({ to, subject, text, attachments }: MailOptions) => {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM } = process.env;
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
    throw new MailNotConfiguredError();
  }

  const port = Number(SMTP_PORT) || 587;
  const transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port,
    secure: port === 465,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  });

  await transporter.sendMail({
    from: SMTP_FROM || SMTP_USER,
    to,
    subject,
    text,
    attachments,
  });
};
