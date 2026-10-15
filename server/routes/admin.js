import { Router } from "express";
import { readCollection, writeCollection } from "../db.js";
import { createSession, requireAdmin } from "../middleware/adminAuth.js";
import { newId } from "../utils/idGen.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();

router.post("/login", (req, res) => {
  const { password } = req.body || {};
  const expected = process.env.ADMIN_PASSWORD || "changeme123";

  if (password !== expected) {
    return res.status(401).json({ error: "Incorrect password. Please try again." });
  }
  const token = createSession();
  res.json({ token });
});

router.use(requireAdmin);

// All bookings, newest first, enriched with service names for display.
router.get("/bookings", asyncHandler(async (req, res) => {
  const [bookings, services] = await Promise.all([
    readCollection("bookings"),
    readCollection("services"),
  ]);
  const enriched = bookings
    .map((b) => ({ ...b, service: services.find((s) => s.id === b.serviceId) || null }))
    .sort((a, b) => `${b.date}${b.time}`.localeCompare(`${a.date}${a.time}`));
  res.json(enriched);
}));

// Mark a booking confirmed / completed / cancelled from the admin dashboard.
router.post("/bookings/:id/status", asyncHandler(async (req, res) => {
  const { status } = req.body || {};
  if (!["confirmed", "completed", "cancelled"].includes(status)) {
    return res.status(400).json({ error: "Invalid status." });
  }

  const bookings = await readCollection("bookings");
  const booking = bookings.find((b) => b.id === req.params.id);
  if (!booking) return res.status(404).json({ error: "Booking not found." });

  await writeCollection("bookings", (all) =>
    all.map((b) => (b.id === booking.id ? { ...b, status } : b))
  );

  // Cancelling from the admin side should free up the slot too, same as a
  // customer-initiated cancellation.
  if (status === "cancelled") {
    await writeCollection("slots", (slots) =>
      slots.map((s) =>
        s.id === booking.slotId ? { ...s, status: "available", bookingId: null } : s
      )
    );
  }

  res.json({ ok: true });
}));

// Full slot list (including booked/blocked) for a date range, for the admin
// availability manager.
router.get("/slots", asyncHandler(async (req, res) => {
  const { from, to } = req.query;
  const slots = await readCollection("slots");
  const filtered = slots.filter((s) => {
    if (from && s.date < from) return false;
    if (to && s.date > to) return false;
    return true;
  });
  filtered.sort((a, b) => `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`));
  res.json(filtered);
}));

// Manually block a specific date/time so it can't be booked (e.g. vacation,
// a personal appointment). Creates the slot if it doesn't exist yet.
router.post("/slots/block", asyncHandler(async (req, res) => {
  const { date, time } = req.body || {};
  if (!date || !time) {
    return res.status(400).json({ error: "Please provide both a date and a time." });
  }

  let blocked = false;
  await writeCollection("slots", (slots) => {
    const existing = slots.find((s) => s.date === date && s.time === time);
    if (existing) {
      if (existing.status !== "available") {
        return slots; // already booked or blocked - leave as-is
      }
      blocked = true;
      return slots.map((s) => (s === existing ? { ...s, status: "blocked" } : s));
    }
    blocked = true;
    return [
      ...slots,
      { id: newId("slot"), date, time, status: "blocked", bookingId: null },
    ];
  });

  if (!blocked) {
    return res.status(409).json({ error: "That time is already booked and can't be blocked." });
  }
  res.json({ ok: true });
}));

// Re-open a previously blocked slot.
router.post("/slots/:id/unblock", asyncHandler(async (req, res) => {
  let found = false;
  await writeCollection("slots", (slots) =>
    slots.map((s) => {
      if (s.id !== req.params.id) return s;
      if (s.status !== "blocked") return s;
      found = true;
      return { ...s, status: "available" };
    })
  );

  if (!found) {
    return res.status(404).json({ error: "Blocked slot not found." });
  }
  res.json({ ok: true });
}));

export default router;
