// Generates mock available time slots so the booking calendar has real data
// to show out of the box. Safe to re-run: it only ADDS slots for dates that
// don't already have any, so it never overwrites existing bookings.
//
// Business hours (mock): Mon-Fri 8:00-16:00 (hourly), Sat 9:00-12:00, closed Sunday.

import { readCollection, writeCollection } from "./db.js";
import { newId } from "./utils/idGen.js";

const WEEKDAY_HOURS = [8, 9, 10, 11, 12, 13, 14, 15, 16];
const SATURDAY_HOURS = [9, 10, 11];
const DAYS_AHEAD = 21;

function toDateKey(date) {
  return date.toISOString().slice(0, 10); // YYYY-MM-DD
}

function hoursForDay(dayOfWeek) {
  if (dayOfWeek === 0) return []; // Sunday: closed
  if (dayOfWeek === 6) return SATURDAY_HOURS;
  return WEEKDAY_HOURS;
}

export async function ensureSlotsSeeded() {
  const existing = await readCollection("slots");
  const existingDates = new Set(existing.map((s) => s.date));

  const newSlots = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let i = 1; i <= DAYS_AHEAD; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() + i);
    const dateKey = toDateKey(date);

    if (existingDates.has(dateKey)) continue; // don't touch days we already have

    for (const hour of hoursForDay(date.getDay())) {
      newSlots.push({
        id: newId("slot"),
        date: dateKey,
        time: `${String(hour).padStart(2, "0")}:00`,
        status: "available", // available | booked | blocked
        bookingId: null,
      });
    }
  }

  if (newSlots.length === 0) return existing;

  return writeCollection("slots", (current) => {
    const stillMissing = newSlots.filter(
      (s) => !current.some((c) => c.date === s.date)
    );
    return [...current, ...stillMissing];
  });
}

// Allow running directly: `node seed.js`
if (import.meta.url === `file://${process.argv[1]}`) {
  ensureSlotsSeeded().then((slots) => {
    console.log(`Slots ready: ${slots.length} total.`);
  });
}
