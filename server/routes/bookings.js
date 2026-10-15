import { Router } from "express";
import { readCollection, writeCollection } from "../db.js";
import { newId, newConfirmationCode } from "../utils/idGen.js";
import {
  sendEmail,
  bookingConfirmationEmail,
  bookingCancellationEmail,
  bookingRescheduleEmail,
} from "../utils/email.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();

function formatDateLabel(dateStr) {
  // dateStr is YYYY-MM-DD. Parsed as UTC-noon to avoid local-timezone
  // day-shift bugs, then rendered in the reader's locale.
  const d = new Date(`${dateStr}T12:00:00Z`);
  return d.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}

function isValidEmail(value) {
  return typeof value === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

async function findBookingWithContext(id) {
  const [bookings, slots, services] = await Promise.all([
    readCollection("bookings"),
    readCollection("slots"),
    readCollection("services"),
  ]);
  const booking = bookings.find((b) => b.id === id);
  if (!booking) return null;
  const slot = slots.find((s) => s.id === booking.slotId);
  const service = services.find((s) => s.id === booking.serviceId);
  return { booking, slot, service };
}

function enrich(booking, slots, services) {
  const slot = slots.find((s) => s.id === booking.slotId);
  const service = services.find((s) => s.id === booking.serviceId);
  return { ...booking, service, dateLabel: formatDateLabel(booking.date), slot };
}

// Create a new booking. This is the critical section that must never let
// two people book the same slot: the slot's status is read AND flipped to
// "booked" inside the same writeCollection() callback, which is serialized
// by db.js's per-collection lock. If two requests race for the same
// slotId, the second one to actually run will see status "booked" already
// and be rejected here - it can never see the pre-lock "available" snapshot.
router.post("/", asyncHandler(async (req, res) => {
  const { name, phone, email, serviceId, slotId, notes } = req.body || {};

  if (!name || !name.trim()) {
    return res.status(400).json({ error: "Please enter your name." });
  }
  if (!isValidEmail(email)) {
    return res.status(400).json({ error: "Please enter a valid email address." });
  }
  if (!phone || !phone.trim()) {
    return res.status(400).json({ error: "Please enter a phone number." });
  }
  if (!serviceId) {
    return res.status(400).json({ error: "Please choose a service." });
  }
  if (!slotId) {
    return res.status(400).json({ error: "Please choose an appointment time." });
  }

  const services = await readCollection("services");
  const service = services.find((s) => s.id === serviceId);
  if (!service) {
    return res.status(400).json({ error: "That service could not be found. Please choose again." });
  }

  let createdBooking = null;
  let conflict = false;

  await writeCollection("slots", async (slots) => {
    const slot = slots.find((s) => s.id === slotId);
    if (!slot || slot.status !== "available") {
      conflict = true;
      return slots; // no change
    }

    const booking = {
      id: newId("bkg"),
      confirmationCode: newConfirmationCode(),
      name: name.trim(),
      phone: phone.trim(),
      email: email.trim().toLowerCase(),
      serviceId,
      slotId,
      date: slot.date,
      time: slot.time,
      notes: (notes || "").trim(),
      status: "confirmed",
      createdAt: new Date().toISOString(),
    };

    await writeCollection("bookings", (bookings) => [...bookings, booking]);
    createdBooking = booking;

    return slots.map((s) =>
      s.id === slotId ? { ...s, status: "booked", bookingId: booking.id } : s
    );
  });

  if (conflict) {
    return res.status(409).json({
      error:
        "Sorry, that time was just booked by someone else. Please choose a different time.",
    });
  }

  const dateLabel = formatDateLabel(createdBooking.date);
  await sendEmail(bookingConfirmationEmail({ booking: createdBooking, service, dateLabel }));

  res.status(201).json({ ...createdBooking, service, dateLabel });
}));

// Look up a booking by email + confirmation code, for the "My Appointments" page.
router.get("/lookup", asyncHandler(async (req, res) => {
  const email = (req.query.email || "").trim().toLowerCase();
  const code = (req.query.code || "").trim().toUpperCase();

  if (!email || !code) {
    return res.status(400).json({
      error: "Please enter both your email address and confirmation code.",
    });
  }

  const [bookings, slots, services] = await Promise.all([
    readCollection("bookings"),
    readCollection("slots"),
    readCollection("services"),
  ]);

  const booking = bookings.find(
    (b) => b.email === email && b.confirmationCode.toUpperCase() === code
  );

  if (!booking) {
    return res.status(404).json({
      error:
        "We couldn't find an appointment matching that email address and confirmation code. Please double-check and try again.",
    });
  }

  res.json(enrich(booking, slots, services));
}));

// Cancel a booking. Requires email + code again as a lightweight ownership check.
router.post("/:id/cancel", asyncHandler(async (req, res) => {
  const { email, code } = req.body || {};
  const context = await findBookingWithContext(req.params.id);

  if (!context) {
    return res.status(404).json({ error: "Appointment not found." });
  }
  const { booking } = context;

  if (
    (email || "").trim().toLowerCase() !== booking.email ||
    (code || "").trim().toUpperCase() !== booking.confirmationCode.toUpperCase()
  ) {
    return res.status(403).json({
      error: "Email address or confirmation code did not match this appointment.",
    });
  }
  if (booking.status === "cancelled") {
    return res.status(400).json({ error: "This appointment is already cancelled." });
  }

  await writeCollection("bookings", (bookings) =>
    bookings.map((b) => (b.id === booking.id ? { ...b, status: "cancelled" } : b))
  );
  await writeCollection("slots", (slots) =>
    slots.map((s) =>
      s.id === booking.slotId ? { ...s, status: "available", bookingId: null } : s
    )
  );

  const dateLabel = formatDateLabel(booking.date);
  await sendEmail(bookingCancellationEmail({ booking, dateLabel }));

  res.json({ ok: true, message: `Your appointment on ${dateLabel} has been cancelled.` });
}));

// Reschedule: move an existing confirmed booking to a different open slot.
router.post("/:id/reschedule", asyncHandler(async (req, res) => {
  const { email, code, newSlotId } = req.body || {};
  const context = await findBookingWithContext(req.params.id);

  if (!context) {
    return res.status(404).json({ error: "Appointment not found." });
  }
  const { booking, service } = context;

  if (
    (email || "").trim().toLowerCase() !== booking.email ||
    (code || "").trim().toUpperCase() !== booking.confirmationCode.toUpperCase()
  ) {
    return res.status(403).json({
      error: "Email address or confirmation code did not match this appointment.",
    });
  }
  if (booking.status === "cancelled") {
    return res.status(400).json({ error: "This appointment was cancelled and can't be rescheduled." });
  }
  if (!newSlotId) {
    return res.status(400).json({ error: "Please choose a new appointment time." });
  }

  let conflict = false;
  let newSlot = null;

  await writeCollection("slots", async (slots) => {
    const target = slots.find((s) => s.id === newSlotId);
    if (!target || target.status !== "available") {
      conflict = true;
      return slots;
    }
    newSlot = target;

    return slots.map((s) => {
      if (s.id === newSlotId) return { ...s, status: "booked", bookingId: booking.id };
      if (s.id === booking.slotId) return { ...s, status: "available", bookingId: null };
      return s;
    });
  });

  if (conflict) {
    return res.status(409).json({
      error: "Sorry, that time was just taken. Please choose a different time.",
    });
  }

  const updated = {
    ...booking,
    slotId: newSlot.id,
    date: newSlot.date,
    time: newSlot.time,
  };
  await writeCollection("bookings", (bookings) =>
    bookings.map((b) => (b.id === booking.id ? updated : b))
  );

  const dateLabel = formatDateLabel(updated.date);
  await sendEmail(bookingRescheduleEmail({ booking: updated, dateLabel }));

  res.json({ ...updated, service, dateLabel });
}));

export default router;
