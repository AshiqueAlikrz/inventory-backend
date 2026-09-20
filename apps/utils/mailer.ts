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
  constructor(missing: string[] = []) {
    // name the missing settings so it's clear what to add (names only, never values)
    super(missing.length ? `Email is not configured on the server (missing ${missing.join(", ")})` : "Email is not configured on the server");
  }
}

/** Turns a low-level mail error into a status and a message that says what to check, or null if it isn't a known kind. */
export const describeMailError = (err: any): { status: number; message: string } | null => {
  switch (err?.code) {
    case "ETIMEDOUT":
      return { status: 504, message: "The email server didn't respond in time. Check SMTP_HOST and SMTP_PORT in the server settings (587 for most providers)." };
    case "EDNS":
    case "ENOTFOUND":
      return { status: 502, message: "The email server address (SMTP_HOST) could not be found. Check it for typos." };
    case "ECONNECTION":
    case "ESOCKET":
      return { status: 502, message: "Could not connect to the email server. Check SMTP_HOST and SMTP_PORT in the server settings." };
    case "EAUTH":
      return { status: 502, message: "The email server rejected the login. Check SMTP_USER and SMTP_PASS (Gmail needs an app password)." };
    default:
      return null;
  }
};

// Reads SMTP settings lazily so a missing .env only fails the send, not the whole server
export const sendMail = async ({ to, subject, text, attachments }: MailOptions) => {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM } = process.env;
  const missing = ["SMTP_HOST", "SMTP_USER", "SMTP_PASS"].filter((key) => !process.env[key]);
  if (missing.length) {
    throw new MailNotConfiguredError(missing);
  }

  const port = Number(SMTP_PORT) || 587;
  const transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port,
    secure: port === 465,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
    // Without these a wrong or unreachable mail server can leave the request hanging for minutes
    // (defaults: 2 min to connect, 30 s for the greeting, 10 min of silence), which surfaces as a time out.
    connectionTimeout: 8000,
    greetingTimeout: 8000,
    socketTimeout: 15000,
  });

  await transporter.sendMail({
    from: SMTP_FROM || SMTP_USER,
    to,
    subject,
    text,
    attachments,
  });
};
