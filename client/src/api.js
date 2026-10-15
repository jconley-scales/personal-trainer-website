const BASE = import.meta.env.VITE_API_URL || "";

async function request(path, options = {}) {
  const res = await fetch(`${BASE}/api${path}`, {
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
    ...options,
  });

  let data = null;
  try {
    data = await res.json();
  } catch {
    // no JSON body (e.g. 204) - that's fine
  }

  if (!res.ok) {
    const message = data?.error || "Something went wrong. Please try again.";
    throw new Error(message);
  }
  return data;
}

export const api = {
  getServices: () => request("/services"),

  getAvailableDates: () => request("/slots/available-dates"),
  getSlotsForDate: (date) => request(`/slots?date=${encodeURIComponent(date)}`),

  sendContactMessage: (payload) =>
    request("/contact", { method: "POST", body: JSON.stringify(payload) }),

  createBooking: (payload) =>
    request("/bookings", { method: "POST", body: JSON.stringify(payload) }),
  lookupBooking: (email, code) =>
    request(`/bookings/lookup?email=${encodeURIComponent(email)}&code=${encodeURIComponent(code)}`),
  cancelBooking: (id, payload) =>
    request(`/bookings/${id}/cancel`, { method: "POST", body: JSON.stringify(payload) }),
  rescheduleBooking: (id, payload) =>
    request(`/bookings/${id}/reschedule`, { method: "POST", body: JSON.stringify(payload) }),

  adminLogin: (password) =>
    request("/admin/login", { method: "POST", body: JSON.stringify({ password }) }),
  adminGetBookings: (token) =>
    request("/admin/bookings", { headers: { Authorization: `Bearer ${token}` } }),
  adminSetBookingStatus: (token, id, status) =>
    request(`/admin/bookings/${id}/status`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({ status }),
    }),
  adminGetSlots: (token, from, to) =>
    request(`/admin/slots?from=${from}&to=${to}`, {
      headers: { Authorization: `Bearer ${token}` },
    }),
  adminBlockSlot: (token, date, time) =>
    request("/admin/slots/block", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({ date, time }),
    }),
  adminUnblockSlot: (token, id) =>
    request(`/admin/slots/${id}/unblock`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    }),
};
