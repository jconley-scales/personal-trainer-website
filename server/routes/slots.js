import { Router } from "express";
import { readCollection } from "../db.js";
import { ensureSlotsSeeded } from "../seed.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();

// Which upcoming dates have at least one open slot, so the booking page can
// visually mark full/unavailable days on the date picker instead of making
// the user click through empty days one at a time.
router.get("/available-dates", asyncHandler(async (req, res) => {
  await ensureSlotsSeeded();
  const slots = await readCollection("slots");

  const byDate = new Map();
  for (const slot of slots) {
    if (slot.status !== "available") continue;
    byDate.set(slot.date, (byDate.get(slot.date) || 0) + 1);
  }

  const dates = Array.from(byDate.entries())
    .map(([date, openCount]) => ({ date, openCount }))
    .sort((a, b) => a.date.localeCompare(b.date));

  res.json(dates);
}));

// Open time slots for one specific date.
router.get("/", asyncHandler(async (req, res) => {
  const { date } = req.query;
  if (!date) {
    return res.status(400).json({ error: "Please provide a date, for example ?date=2026-09-10." });
  }

  await ensureSlotsSeeded();
  const slots = await readCollection("slots");
  const dayOfSlots = slots
    .filter((s) => s.date === date && s.status === "available")
    .sort((a, b) => a.time.localeCompare(b.time));

  res.json(dayOfSlots);
}));

export default router;
