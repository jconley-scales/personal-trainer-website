import { Router } from "express";
import { sendEmail } from "../utils/email.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();

function isValidEmail(value) {
  return typeof value === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

// Forwards the contact form to the business owner's inbox (or the mock
// email log in development - see utils/email.js). Not persisted to a
// collection since it's a one-way message, not a record we need to query.
router.post("/", asyncHandler(async (req, res) => {
  const { name, email, message } = req.body || {};

  if (!name || !name.trim()) {
    return res.status(400).json({ error: "Please enter your name." });
  }
  if (!isValidEmail(email)) {
    return res.status(400).json({ error: "Please enter a valid email address." });
  }
  if (!message || !message.trim()) {
    return res.status(400).json({ error: "Please enter a message." });
  }

  const ownerEmail = process.env.FROM_EMAIL || "hello@example.com";
  await sendEmail({
    to: ownerEmail,
    subject: `New contact form message from ${name.trim()}`,
    text: `From: ${name.trim()} <${email.trim()}>\n\n${message.trim()}`,
  });

  res.status(201).json({ ok: true });
}));

export default router;
