// Sends confirmation / cancellation / reschedule emails.
//
// If SMTP_* env vars are configured, we send real email via nodemailer.
// Otherwise (the out-of-the-box default) we "send" by writing the message
// to data/sent-emails.log and printing it to the console, so booking still
// works end-to-end in local development without any email account setup.

import nodemailer from "nodemailer";
import { appendFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LOG_FILE = path.join(__dirname, "..", "data", "sent-emails.log");

const businessName = process.env.BUSINESS_NAME || "Bright Path Personal Training";
const fromEmail = process.env.FROM_EMAIL || "no-reply@example.com";

let transporter = null;
if (process.env.SMTP_HOST) {
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    auth: process.env.SMTP_USER
      ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
      : undefined,
  });
}

export async function sendEmail({ to, subject, text }) {
  if (transporter) {
    await transporter.sendMail({
      from: `"${businessName}" <${fromEmail}>`,
      to,
      subject,
      text,
    });
    return;
  }

  const entry =
    `\n--- ${new Date().toISOString()} ---\n` +
    `To: ${to}\nFrom: ${businessName} <${fromEmail}>\nSubject: ${subject}\n\n${text}\n`;

  console.log(`[email:mock]${entry}`);
  await appendFile(LOG_FILE, entry, "utf-8");
}

export function bookingConfirmationEmail({ booking, service, dateLabel }) {
  return {
    to: booking.email,
    subject: `Your appointment is confirmed - ${dateLabel}`,
    text:
      `Hi ${booking.name},\n\n` +
      `Your appointment is confirmed for ${dateLabel} at ${booking.time}.\n\n` +
      `Service: ${service.name} (${service.duration})\n` +
      `Confirmation code: ${booking.confirmationCode}\n\n` +
      `Please keep this confirmation code. You can use it, along with your email ` +
      `address, on the "My Appointments" page of our website to view, reschedule, ` +
      `or cancel this appointment at any time.\n\n` +
      `If you have any questions, just reply to this email or give us a call.\n\n` +
      `We look forward to seeing you!\n${businessName}`,
  };
}

export function bookingCancellationEmail({ booking, dateLabel }) {
  return {
    to: booking.email,
    subject: `Your appointment on ${dateLabel} has been cancelled`,
    text:
      `Hi ${booking.name},\n\n` +
      `This confirms that your appointment on ${dateLabel} at ${booking.time} has ` +
      `been cancelled. No further action is needed.\n\n` +
      `If this was a mistake, or you'd like to book a new time, please visit our ` +
      `Booking page whenever you're ready.\n\n${businessName}`,
  };
}

export function bookingRescheduleEmail({ booking, dateLabel }) {
  return {
    to: booking.email,
    subject: `Your appointment was rescheduled - ${dateLabel}`,
    text:
      `Hi ${booking.name},\n\n` +
      `Your appointment has been moved. Your new appointment time is ${dateLabel} ` +
      `at ${booking.time}.\n\n` +
      `Confirmation code: ${booking.confirmationCode}\n\n${businessName}`,
  };
}
