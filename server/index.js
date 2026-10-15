import "dotenv/config";
import express from "express";
import cors from "cors";

import servicesRouter from "./routes/services.js";
import slotsRouter from "./routes/slots.js";
import bookingsRouter from "./routes/bookings.js";
import adminRouter from "./routes/admin.js";
import contactRouter from "./routes/contact.js";
import { ensureSlotsSeeded } from "./seed.js";

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

app.use("/api/services", servicesRouter);
app.use("/api/slots", slotsRouter);
app.use("/api/bookings", bookingsRouter);
app.use("/api/admin", adminRouter);
app.use("/api/contact", contactRouter);

app.get("/api/health", (req, res) => res.json({ ok: true }));

// Fallback error handler so an unexpected error returns a plain-language
// JSON message instead of an HTML stack trace or a hung request.
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: "Something went wrong on our end. Please try again." });
});

await ensureSlotsSeeded();

app.listen(PORT, () => {
  console.log(`Server ready at http://localhost:${PORT}`);
});
