// Minimal JSON-file "database". Chosen over SQLite so the project runs
// anywhere with zero native build tools (SQLite drivers need node-gyp,
// which is often the #1 friction point on a fresh Windows machine).
//
// The important part for correctness is `writeCollection`: every write goes
// through a single in-memory queue (per file) so that two booking requests
// arriving at nearly the same instant can never both read "slot is free",
// both write "booked", and silently double-book the trainer. Node is
// single-threaded for JS execution, but `await fs.readFile`/`writeFile`
// yield control, so without this queue a second request's read could still
// interleave between a first request's read and write.

import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, "data");

const fileFor = (name) => path.join(DATA_DIR, `${name}.json`);

// One promise-chain "lock" per collection name, so writes to bookings.json
// don't need to wait on unrelated writes to services.json.
const locks = new Map();

function withLock(name, task) {
  const previous = locks.get(name) ?? Promise.resolve();
  const next = previous.then(task, task);
  // Store a settled-ignoring version so one rejected task doesn't jam the
  // queue for everything that comes after it.
  locks.set(
    name,
    next.catch(() => {})
  );
  return next;
}

export async function readCollection(name) {
  const raw = await readFile(fileFor(name), "utf-8");
  return JSON.parse(raw);
}

// Runs `mutator(currentData) -> newData` exclusively with respect to any
// other pending read-modify-write on the same collection, then persists the
// result. This is the only sanctioned way to change booking/slot data.
export async function writeCollection(name, mutator) {
  return withLock(name, async () => {
    const current = await readCollection(name);
    const next = await mutator(current);
    await writeFile(fileFor(name), JSON.stringify(next, null, 2), "utf-8");
    return next;
  });
}
