import { useEffect, useMemo, useState } from "react";
import { api } from "../api.js";
import { formatDateButtonLabel, formatDateFullLabel, formatTimeLabel } from "../utils/format.js";

const STATUS_LABELS = {
  confirmed: "Confirmed",
  completed: "Completed",
  cancelled: "Cancelled",
};

export default function ManageBooking() {
  const [lookupForm, setLookupForm] = useState({ email: "", code: "" });
  const [lookupErrors, setLookupErrors] = useState({});
  const [lookupError, setLookupError] = useState("");
  const [lookupLoading, setLookupLoading] = useState(false);

  const [booking, setBooking] = useState(null);
  const [actionMessage, setActionMessage] = useState("");
  const [actionError, setActionError] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  const [confirmingCancel, setConfirmingCancel] = useState(false);
  const [rescheduling, setRescheduling] = useState(false);
  const [availableDates, setAvailableDates] = useState(null);
  const [selectedDate, setSelectedDate] = useState("");
  const [slots, setSlots] = useState([]);
  const [selectedSlotId, setSelectedSlotId] = useState("");
  const [slotsLoading, setSlotsLoading] = useState(false);

  async function handleLookup(e) {
    e.preventDefault();
    const errs = {};
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(lookupForm.email)) {
      errs.email = "Please enter a valid email address.";
    }
    if (!lookupForm.code.trim()) {
      errs.code = "Please enter your confirmation code.";
    }
    setLookupErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setLookupLoading(true);
    setLookupError("");
    setActionMessage("");
    try {
      const result = await api.lookupBooking(lookupForm.email, lookupForm.code);
      setBooking(result);
      setConfirmingCancel(false);
      setRescheduling(false);
    } catch (err) {
      setBooking(null);
      setLookupError(err.message);
    } finally {
      setLookupLoading(false);
    }
  }

  async function handleCancel() {
    setActionLoading(true);
    setActionError("");
    try {
      const result = await api.cancelBooking(booking.id, {
        email: lookupForm.email,
        code: lookupForm.code,
      });
      setActionMessage(result.message);
      setBooking((b) => ({ ...b, status: "cancelled" }));
      setConfirmingCancel(false);
    } catch (err) {
      setActionError(err.message);
    } finally {
      setActionLoading(false);
    }
  }

  function startReschedule() {
    setRescheduling(true);
    setSelectedDate("");
    setSelectedSlotId("");
    setActionMessage("");
    setActionError("");
    if (!availableDates) {
      api.getAvailableDates().then(setAvailableDates).catch((e) => setActionError(e.message));
    }
  }

  useEffect(() => {
    if (!selectedDate) {
      setSlots([]);
      return;
    }
    setSlotsLoading(true);
    setSelectedSlotId("");
    api
      .getSlotsForDate(selectedDate)
      .then(setSlots)
      .catch((e) => setActionError(e.message))
      .finally(() => setSlotsLoading(false));
  }, [selectedDate]);

  async function handleConfirmReschedule() {
    if (!selectedSlotId) {
      setActionError("Please choose a new date and time first.");
      return;
    }
    setActionLoading(true);
    setActionError("");
    try {
      const result = await api.rescheduleBooking(booking.id, {
        email: lookupForm.email,
        code: lookupForm.code,
        newSlotId: selectedSlotId,
      });
      setBooking((b) => ({ ...b, date: result.date, time: result.time, dateLabel: result.dateLabel }));
      setActionMessage(
        `Your appointment has been moved. Your new appointment is ${result.dateLabel} at ${formatTimeLabel(result.time)}.`
      );
      setRescheduling(false);
    } catch (err) {
      setActionError(err.message);
    } finally {
      setActionLoading(false);
    }
  }

  const dateLabel = useMemo(
    () => booking && (booking.dateLabel || formatDateFullLabel(booking.date)),
    [booking]
  );

  return (
    <div className="container section stack">
      <h1>My Appointments</h1>
      <p className="prose">
        Look up your appointment using the email address and confirmation
        code from your booking confirmation email.
      </p>

      <form onSubmit={handleLookup} noValidate className="card stack" style={{ maxWidth: "34rem" }}>
        <div className={`field ${lookupErrors.email ? "field--error" : ""}`}>
          <label htmlFor="lookup-email">Email Address</label>
          <input
            id="lookup-email"
            type="email"
            value={lookupForm.email}
            onChange={(e) => setLookupForm((f) => ({ ...f, email: e.target.value }))}
          />
          {lookupErrors.email && <p className="field__error" role="alert">{lookupErrors.email}</p>}
        </div>

        <div className={`field ${lookupErrors.code ? "field--error" : ""}`}>
          <label htmlFor="lookup-code">Confirmation Code</label>
          <p className="field__hint">Found in your confirmation email, e.g. "AB3C7Q".</p>
          <input
            id="lookup-code"
            type="text"
            value={lookupForm.code}
            onChange={(e) => setLookupForm((f) => ({ ...f, code: e.target.value }))}
          />
          {lookupErrors.code && <p className="field__error" role="alert">{lookupErrors.code}</p>}
        </div>

        {lookupError && <p className="alert alert--error" role="alert">{lookupError}</p>}

        <button type="submit" className="btn btn--primary btn--large" disabled={lookupLoading}>
          {lookupLoading ? "Searching..." : "Find My Appointment"}
        </button>
      </form>

      {booking && (
        <div className="card stack" style={{ maxWidth: "34rem" }}>
          <h2>Your Appointment</h2>
          <p><strong>Service:</strong> {booking.service?.name}</p>
          <p><strong>Date:</strong> {dateLabel}</p>
          <p><strong>Time:</strong> {formatTimeLabel(booking.time)}</p>
          <p><strong>Status:</strong> {STATUS_LABELS[booking.status] || booking.status}</p>

          {actionMessage && <p className="alert alert--success" role="status">{actionMessage}</p>}
          {actionError && <p className="alert alert--error" role="alert">{actionError}</p>}

          {booking.status === "confirmed" && !rescheduling && (
            <div className="stack--tight" style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
              <button type="button" className="btn btn--secondary" onClick={startReschedule}>
                Reschedule Appointment
              </button>
              <button
                type="button"
                className="btn btn--danger"
                onClick={() => setConfirmingCancel(true)}
              >
                Cancel Appointment
              </button>
            </div>
          )}

          {confirmingCancel && (
            <div className="card card--alt stack--tight">
              <p style={{ margin: 0, fontWeight: 700 }}>
                Are you sure you want to cancel your appointment on {dateLabel} at{" "}
                {formatTimeLabel(booking.time)}? This cannot be undone.
              </p>
              <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
                <button type="button" className="btn btn--danger" onClick={handleCancel} disabled={actionLoading}>
                  {actionLoading ? "Cancelling..." : "Yes, Cancel My Appointment"}
                </button>
                <button type="button" className="btn btn--secondary" onClick={() => setConfirmingCancel(false)}>
                  No, Keep My Appointment
                </button>
              </div>
            </div>
          )}

          {rescheduling && (
            <div className="card card--alt stack">
              <h3>Choose a New Date &amp; Time</h3>
              {!availableDates ? (
                <p>Loading available dates...</p>
              ) : (
                <div className="date-grid" role="group" aria-label="Available dates">
                  {availableDates.map((d) => (
                    <button
                      key={d.date}
                      type="button"
                      className="date-btn"
                      aria-pressed={selectedDate === d.date}
                      onClick={() => setSelectedDate(d.date)}
                    >
                      {formatDateButtonLabel(d.date)}
                    </button>
                  ))}
                </div>
              )}

              {selectedDate && (
                <>
                  <h4 style={{ margin: 0 }}>Times on {formatDateFullLabel(selectedDate)}</h4>
                  {slotsLoading && <p>Loading available times...</p>}
                  {!slotsLoading && slots.length === 0 && <p>No open times on this day.</p>}
                  {!slotsLoading && slots.length > 0 && (
                    <div className="slot-grid" role="group" aria-label="Available times">
                      {slots.map((s) => (
                        <button
                          key={s.id}
                          type="button"
                          className="slot-btn"
                          aria-pressed={selectedSlotId === s.id}
                          onClick={() => setSelectedSlotId(s.id)}
                        >
                          {formatTimeLabel(s.time)}
                        </button>
                      ))}
                    </div>
                  )}
                </>
              )}

              <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
                <button
                  type="button"
                  className="btn btn--primary"
                  onClick={handleConfirmReschedule}
                  disabled={actionLoading || !selectedSlotId}
                >
                  {actionLoading ? "Saving..." : "Confirm New Time"}
                </button>
                <button type="button" className="btn btn--secondary" onClick={() => setRescheduling(false)}>
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
