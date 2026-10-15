import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { api } from "../api.js";
import { formatDateButtonLabel, formatDateFullLabel, formatTimeLabel } from "../utils/format.js";

const initialForm = { name: "", phone: "", email: "", notes: "" };

export default function Booking() {
  const [searchParams] = useSearchParams();
  const preselectedService = searchParams.get("service") || "";

  const [services, setServices] = useState(null);
  const [availableDates, setAvailableDates] = useState(null);
  const [loadError, setLoadError] = useState("");

  const [serviceId, setServiceId] = useState(preselectedService);
  const [selectedDate, setSelectedDate] = useState("");
  const [slots, setSlots] = useState([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [selectedSlotId, setSelectedSlotId] = useState("");

  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [confirmation, setConfirmation] = useState(null);

  useEffect(() => {
    Promise.all([api.getServices(), api.getAvailableDates()])
      .then(([svc, dates]) => {
        setServices(svc);
        setAvailableDates(dates);
      })
      .catch((e) => setLoadError(e.message));
  }, []);

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
      .catch((e) => setLoadError(e.message))
      .finally(() => setSlotsLoading(false));
  }, [selectedDate]);

  const selectedService = useMemo(
    () => services?.find((s) => s.id === serviceId) || null,
    [services, serviceId]
  );
  const selectedSlot = useMemo(
    () => slots.find((s) => s.id === selectedSlotId) || null,
    [slots, selectedSlotId]
  );

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  function validate() {
    const next = {};
    if (!serviceId) next.serviceId = "Please choose a service.";
    if (!selectedDate) next.date = "Please choose a date.";
    if (!selectedSlotId) next.slot = "Please choose an appointment time.";
    if (!form.name.trim()) next.name = "Please enter your name.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      next.email = "Please enter a valid email address.";
    }
    if (!form.phone.trim()) next.phone = "Please enter a phone number.";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    setSubmitError("");
    try {
      const booking = await api.createBooking({
        name: form.name,
        phone: form.phone,
        email: form.email,
        notes: form.notes,
        serviceId,
        slotId: selectedSlotId,
      });
      setConfirmation(booking);
    } catch (err) {
      setSubmitError(err.message);
      // Most likely someone else just took this exact time. Refresh the
      // slot list so the user can immediately pick a different one instead
      // of hitting the same conflict again.
      if (selectedDate) {
        api.getSlotsForDate(selectedDate).then(setSlots).catch(() => {});
        setSelectedSlotId("");
      }
    } finally {
      setSubmitting(false);
    }
  }

  if (confirmation) {
    return (
      <div className="container section stack" style={{ maxWidth: "42rem" }}>
        <p className="alert alert--success" role="alert" style={{ fontSize: "1.25rem" }}>
          Your appointment is confirmed for {confirmation.dateLabel} at{" "}
          {formatTimeLabel(confirmation.time)}.
        </p>
        <div className="card stack--tight">
          <h2>Appointment Details</h2>
          <p><strong>Service:</strong> {confirmation.service.name}</p>
          <p><strong>Date:</strong> {confirmation.dateLabel}</p>
          <p><strong>Time:</strong> {formatTimeLabel(confirmation.time)}</p>
          <p><strong>Confirmation Code:</strong> {confirmation.confirmationCode}</p>
          <p>
            A confirmation email has been sent to <strong>{confirmation.email}</strong>.
            Please save your confirmation code - you'll need it, along with
            your email address, to view, reschedule, or cancel this
            appointment on the "My Appointments" page.
          </p>
        </div>
        <button
          type="button"
          className="btn btn--secondary"
          onClick={() => {
            setConfirmation(null);
            setForm(initialForm);
            setServiceId("");
            setSelectedDate("");
            setSelectedSlotId("");
          }}
        >
          Book Another Appointment
        </button>
      </div>
    );
  }

  return (
    <div className="container section stack">
      <h1>Book a Session</h1>
      <p className="prose">
        Choose a service and a time below, then fill out your contact
        information. It only takes a couple of minutes.
      </p>

      {loadError && <p className="alert alert--error" role="alert">{loadError}</p>}

      <form onSubmit={handleSubmit} noValidate className="stack">
        <fieldset>
          <legend>1. Choose a Service</legend>
          <div className={`field ${errors.serviceId ? "field--error" : ""}`}>
            <label htmlFor="service-select">Service</label>
            {!services ? (
              <p>Loading services...</p>
            ) : (
              <select
                id="service-select"
                value={serviceId}
                onChange={(e) => setServiceId(e.target.value)}
              >
                <option value="">-- Select a service --</option>
                {services.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} - ${s.price} ({s.priceUnit})
                  </option>
                ))}
              </select>
            )}
            {errors.serviceId && <p className="field__error" role="alert">{errors.serviceId}</p>}
            {selectedService && (
              <p className="field__hint">{selectedService.duration} session. {selectedService.shortDescription}</p>
            )}
          </div>
        </fieldset>

        <fieldset>
          <legend>2. Choose a Date</legend>
          {!availableDates ? (
            <p>Loading available dates...</p>
          ) : availableDates.length === 0 ? (
            <p>No upcoming availability right now. Please call us to schedule.</p>
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
          {errors.date && <p className="field__error" role="alert">{errors.date}</p>}
        </fieldset>

        {selectedDate && (
          <fieldset>
            <legend>3. Choose a Time on {formatDateFullLabel(selectedDate)}</legend>
            {slotsLoading && <p>Loading available times...</p>}
            {!slotsLoading && slots.length === 0 && (
              <p>No open times left on this day. Please choose a different date.</p>
            )}
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
            {errors.slot && <p className="field__error" role="alert">{errors.slot}</p>}
          </fieldset>
        )}

        <fieldset>
          <legend>4. Your Information</legend>

          <div className={`field ${errors.name ? "field--error" : ""}`}>
            <label htmlFor="booking-name">Full Name</label>
            <input id="booking-name" type="text" value={form.name} onChange={(e) => update("name", e.target.value)} />
            {errors.name && <p className="field__error" role="alert">{errors.name}</p>}
          </div>

          <div className={`field ${errors.phone ? "field--error" : ""}`}>
            <label htmlFor="booking-phone">Phone Number</label>
            <input id="booking-phone" type="tel" value={form.phone} onChange={(e) => update("phone", e.target.value)} />
            {errors.phone && <p className="field__error" role="alert">{errors.phone}</p>}
          </div>

          <div className={`field ${errors.email ? "field--error" : ""}`}>
            <label htmlFor="booking-email">Email Address</label>
            <p className="field__hint">We'll send your confirmation to this address.</p>
            <input id="booking-email" type="email" value={form.email} onChange={(e) => update("email", e.target.value)} />
            {errors.email && <p className="field__error" role="alert">{errors.email}</p>}
          </div>

          <div className="field">
            <label htmlFor="booking-notes">Notes (optional)</label>
            <p className="field__hint">Let us know about any injuries, concerns, or requests.</p>
            <textarea id="booking-notes" value={form.notes} onChange={(e) => update("notes", e.target.value)} />
          </div>
        </fieldset>

        {submitError && <p className="alert alert--error" role="alert">{submitError}</p>}

        <button type="submit" className="btn btn--primary btn--large" disabled={submitting}>
          {submitting ? "Booking..." : "Confirm Booking"}
        </button>
      </form>
    </div>
  );
}
