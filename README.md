# Bright Path Personal Training

A senior-friendly personal trainer business website: React + Vite frontend,
Node/Express backend, JSON-file storage (no database server or native
build tools required). Fully functional out of the box with mock services
and generated appointment slots.

## Project structure

```
personal-trainer-website/
  server/                  Express API
    data/                  JSON "database" files (services, slots, bookings)
    routes/                One file per resource (services, slots, bookings, admin, contact)
    middleware/adminAuth.js  Simple token-based admin auth
    utils/                 Email sending, ID/confirmation-code generation
    db.js                  Read/write helper with a per-file write lock
                            (this is what prevents double-booking races)
    seed.js                Generates mock available time slots
    index.js                Server entry point
  client/                  React + Vite frontend
    src/
      pages/               Home, About, Services, Booking, ManageBooking, Contact, Admin
      components/          Nav, Footer, ServiceCard
      utils/format.js       Shared date/time display formatting
      api.js               Thin fetch wrapper for the API
      index.css            Design system + accessibility notes (read this first)
```

## Running it locally

This machine doesn't currently have Node.js installed, so these commands
couldn't be run as part of building this project - please run them
yourself once Node.js (v18+) is installed:

```bash
# from the personal-trainer-website/ folder
npm run install:all     # installs server/ and client/ dependencies
npm run dev              # runs the API (port 4000) and the client (port 5173) together
```

Then open http://localhost:5173.

Optional: copy `server/.env.example` to `server/.env` to set a real admin
password (default is `changeme123`) and, if you want real emails instead of
the console/log-file mock, SMTP credentials. See the comments in that file.

### Building for deployment

The client builds to static files:

```bash
npm run build --prefix client   # outputs client/dist
```

Serve `client/dist` from any static host (Netlify, Vercel static, S3 + CDN,
etc.), and run `server/` as a small Node process (Render, Railway, Fly.io,
a VPS, etc.) - point the client at it via `client/.env`'s `VITE_API_URL`.
The JSON files in `server/data/` need a writable, persistent filesystem, so
a purely serverless/static host won't work for the API by itself.

## How double-booking prevention works

All slot/booking writes go through `writeCollection()` in
[server/db.js](server/db.js), which serializes every read-modify-write for
a given JSON file behind an in-memory promise queue. A new booking reads
the slot's current status and flips it to `"booked"` inside that same
locked operation, so two requests racing for the same time slot can never
both see `"available"` - the second one is rejected with a friendly
"that time was just booked" error and the client is prompted to pick
another time.

## Accessibility choices (read before changing styles)

Most of the reasoning lives as comments directly in
[client/src/index.css](client/src/index.css) and
[client/index.html](client/index.html), since that's where you're most
likely to be working when you touch visual design. Summary:

- **Base font is 18px, sized in `rem`** everywhere (not `px`), so increasing
  the browser/OS text size scales the whole layout instead of causing
  overlap or clipped text.
- **No `maximum-scale`/`user-scalable=no`** in the viewport meta tag -
  pinch-to-zoom must keep working.
- **Contrast**: text/background/button color pairs were chosen to clear
  WCAG AA at minimum, most AAA (7:1+). If you change any color in
  `index.css`, re-check contrast before shipping.
- **44x44px minimum touch targets** on every button/link/input
  (`--tap-target` CSS variable).
- **No icon-only controls** - every button/link has a visible text label.
- **No dropdown/hover menus** - the top nav is a flat list of links that
  collapses into a single "Menu" button (not just a hamburger icon) on
  narrow screens.
- **Labels are real `<label>` elements above each field**, not placeholder
  text, and validation errors are plain-language sentences (e.g. "Please
  enter a valid email address") shown next to the field with `role="alert"`.
- **No autoplaying media, no flashing/rapid animation.** A
  `prefers-reduced-motion` rule also flattens the few hover/focus
  transitions that do exist.
- **Confirmation messages are explicit sentences** ("Your appointment is
  confirmed for Tuesday, June 3rd at 10:00 AM"), not just a checkmark icon.
- **Keyboard/screen-reader support**: semantic HTML (`<nav>`, `<fieldset>`/
  `<legend>`, `<table>` with `scope="col"`), a skip-to-content link, and a
  visible high-contrast focus ring (`:focus-visible`) on every interactive
  element.

## Admin access

Go to `/admin` and log in with the password from `ADMIN_PASSWORD` in
`server/.env` (default `changeme123` - **change this before deploying**).
From the dashboard you can view every booking, mark sessions
completed/cancelled, and block off specific date/time slots so they can't
be booked (e.g. for vacation).

Admin sessions are simple in-memory tokens (no user accounts/database) -
intentional for a small, single-trainer site. They reset whenever the
server restarts.

## Mock data

- `server/data/services.json` - six sample services/packages with
  descriptions and pricing; edit freely.
- `server/data/slots.json` - auto-generated on first run (and rolled
  forward automatically) for the next 21 days: Mon-Fri 8am-4pm hourly,
  Sat 9am-12pm, closed Sunday. Adjust the hours/window in `server/seed.js`.
- Confirmation/cancellation/reschedule emails are logged to
  `server/data/sent-emails.log` and the server console unless you configure
  real SMTP credentials in `server/.env`.
