import { useState } from "react";
import { api } from "../api.js";

const initialForm = { name: "", email: "", message: "" };

export default function Contact() {
  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState("idle"); // idle | sending | sent | error
  const [serverError, setServerError] = useState("");

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  function validate() {
    const next = {};
    if (!form.name.trim()) next.name = "Please enter your name.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      next.email = "Please enter a valid email address.";
    }
    if (!form.message.trim()) next.message = "Please enter a message.";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!validate()) return;

    setStatus("sending");
    setServerError("");
    try {
      await api.sendContactMessage(form);
      setStatus("sent");
      setForm(initialForm);
    } catch (err) {
      setStatus("error");
      setServerError(err.message);
    }
  }

  return (
    <div className="container section stack">
      <h1>Contact Us</h1>

      <div className="grid">
        <div className="card stack--tight">
          <h2>Get in Touch</h2>
          <p style={{ margin: 0 }}>
            <strong>Phone:</strong>{" "}
            <a href="tel:+15551234567">(555) 123-4567</a>
          </p>
          <p style={{ margin: 0 }}>
            <strong>Email:</strong>{" "}
            <a href="mailto:hello@brightpathtraining.example">hello@brightpathtraining.example</a>
          </p>
          <p style={{ margin: 0 }}>
            <strong>Address:</strong> 123 Wellness Way, Springfield, ST 00000
          </p>

          <h3>Studio Location</h3>
          <iframe
            title="Map showing studio location"
            src="https://www.google.com/maps?q=123+Wellness+Way,+Springfield&output=embed"
            style={{ border: 0, width: "100%", height: "18rem", borderRadius: "0.5rem" }}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </div>

        <form className="card stack" onSubmit={handleSubmit} noValidate aria-describedby="contact-form-status">
          <h2>Send a Message</h2>

          <div className={`field ${errors.name ? "field--error" : ""}`}>
            <label htmlFor="contact-name">Your Name</label>
            <input
              id="contact-name"
              type="text"
              value={form.name}
              onChange={(e) => update("name", e.target.value)}
              aria-invalid={Boolean(errors.name)}
              aria-describedby={errors.name ? "contact-name-error" : undefined}
            />
            {errors.name && (
              <p id="contact-name-error" className="field__error" role="alert">{errors.name}</p>
            )}
          </div>

          <div className={`field ${errors.email ? "field--error" : ""}`}>
            <label htmlFor="contact-email">Your Email Address</label>
            <input
              id="contact-email"
              type="email"
              value={form.email}
              onChange={(e) => update("email", e.target.value)}
              aria-invalid={Boolean(errors.email)}
              aria-describedby={errors.email ? "contact-email-error" : undefined}
            />
            {errors.email && (
              <p id="contact-email-error" className="field__error" role="alert">{errors.email}</p>
            )}
          </div>

          <div className={`field ${errors.message ? "field--error" : ""}`}>
            <label htmlFor="contact-message">Message</label>
            <textarea
              id="contact-message"
              value={form.message}
              onChange={(e) => update("message", e.target.value)}
              aria-invalid={Boolean(errors.message)}
              aria-describedby={errors.message ? "contact-message-error" : undefined}
            />
            {errors.message && (
              <p id="contact-message-error" className="field__error" role="alert">{errors.message}</p>
            )}
          </div>

          <button type="submit" className="btn btn--primary btn--large" disabled={status === "sending"}>
            {status === "sending" ? "Sending..." : "Send Message"}
          </button>

          <div id="contact-form-status" aria-live="polite">
            {status === "sent" && (
              <p className="alert alert--success">
                Thank you! Your message has been sent. We'll get back to you within one business day.
              </p>
            )}
            {status === "error" && (
              <p className="alert alert--error" role="alert">{serverError}</p>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
