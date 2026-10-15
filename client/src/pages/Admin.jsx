import { useEffect, useMemo, useState } from "react";
import { api } from "../api.js";
import { formatDateFullLabel, formatTimeLabel } from "../utils/format.js";

const TOKEN_KEY = "bpt_admin_token";
const STATUS_LABELS = { confirmed: "Confirmed", completed: "Completed", cancelled: "Cancelled" };

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}
function addDaysKey(days) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export default function Admin() {
  const [token, setToken] = useState(() => sessionStorage.getItem(TOKEN_KEY) || "");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loggingIn, setLoggingIn] = useState(false);

  if (!token) {
    return (
      <div className="container section stack" style={{ maxWidth: "28rem" }}>
        <h1>Admin Login</h1>
        <form
          className="card stack"
          onSubmit={async (e) => {
            e.preventDefault();
            setLoggingIn(true);
            setLoginError("");
            try {
              const { token: newToken } = await api.adminLogin(password);
              sessionStorage.setItem(TOKEN_KEY, newToken);
              setToken(newToken);
            } catch (err) {
              setLoginError(err.message);
            } finally {
              setLoggingIn(false);
            }
          }}
        >
          <div className="field">
            <label htmlFor="admin-password">Password</label>
            <input
              id="admin-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          {loginError && <p className="alert alert--error" role="alert">{loginError}</p>}
          <button type="submit" className="btn btn--primary btn--large" disabled={loggingIn}>
            {loggingIn ? "Logging in..." : "Log In"}
          </button>
        </form>
      </div>
    );
  }

  return (
    <AdminDashboard
      token={token}
      onLogout={() => {
        sessionStorage.removeItem(TOKEN_KEY);
        setToken("");
      }}
      onUnauthorized={() => {
        sessionStorage.removeItem(TOKEN_KEY);
        setToken("");
      }}
    />
  );
}

function AdminDashboard({ token, onLogout, onUnauthorized }) {
  const [bookings, setBookings] = useState(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState("");

  const [blockedSlots, setBlockedSlots] = useState(null);
  const [blockForm, setBlockForm] = useState({ date: todayKey(), time: "09:00" });
  const [blockError, setBlockError] = useState("");
  const [blockBusy, setBlockBusy] = useState(false);

  function handleAuthError(err) {
    if (err.message.includes("Not authorized")) {
      onUnauthorized();
      return true;
    }
    return false;
  }

  function loadBookings() {
    api
      .adminGetBookings(token)
      .then(setBookings)
      .catch((err) => {
        if (!handleAuthError(err)) setError(err.message);
      });
  }

  function loadBlockedSlots() {
    api
      .adminGetSlots(token, todayKey(), addDaysKey(60))
      .then((slots) => setBlockedSlots(slots.filter((s) => s.status === "blocked")))
      .catch((err) => {
        if (!handleAuthError(err)) setError(err.message);
      });
  }

  useEffect(() => {
    loadBookings();
    loadBlockedSlots();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const visibleBookings = useMemo(() => {
    if (!bookings) return null;
    if (statusFilter === "all") return bookings;
    return bookings.filter((b) => b.status === statusFilter);
  }, [bookings, statusFilter]);

  async function setStatus(id, status) {
    setBusyId(id);
    setError("");
    try {
      await api.adminSetBookingStatus(token, id, status);
      setBookings((all) => all.map((b) => (b.id === id ? { ...b, status } : b)));
    } catch (err) {
      if (!handleAuthError(err)) setError(err.message);
    } finally {
      setBusyId("");
    }
  }

  async function handleBlock(e) {
    e.preventDefault();
    setBlockBusy(true);
    setBlockError("");
    try {
      await api.adminBlockSlot(token, blockForm.date, blockForm.time);
      loadBlockedSlots();
    } catch (err) {
      if (!handleAuthError(err)) setBlockError(err.message);
    } finally {
      setBlockBusy(false);
    }
  }

  async function handleUnblock(id) {
    setBlockBusy(true);
    setBlockError("");
    try {
      await api.adminUnblockSlot(token, id);
      loadBlockedSlots();
    } catch (err) {
      if (!handleAuthError(err)) setBlockError(err.message);
    } finally {
      setBlockBusy(false);
    }
  }

  return (
    <div className="container section stack">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
        <h1 style={{ margin: 0 }}>Admin Dashboard</h1>
        <button type="button" className="btn btn--secondary" onClick={onLogout}>
          Log Out
        </button>
      </div>

      {error && <p className="alert alert--error" role="alert">{error}</p>}

      <section className="stack">
        <h2>Bookings</h2>

        <div className="field" style={{ maxWidth: "20rem" }}>
          <label htmlFor="status-filter">Filter by Status</label>
          <select id="status-filter" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="all">All Bookings</option>
            <option value="confirmed">Confirmed</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>

        {!visibleBookings && <p>Loading bookings...</p>}
        {visibleBookings && visibleBookings.length === 0 && <p>No bookings found.</p>}

        {visibleBookings && visibleBookings.length > 0 && (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  {["Date", "Time", "Client", "Contact", "Service", "Status", "Actions"].map((h) => (
                    <th
                      key={h}
                      scope="col"
                      style={{ textAlign: "left", padding: "0.75rem", borderBottom: "2px solid var(--color-border)" }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {visibleBookings.map((b) => (
                  <tr key={b.id}>
                    <td style={cellStyle}>{formatDateFullLabel(b.date)}</td>
                    <td style={cellStyle}>{formatTimeLabel(b.time)}</td>
                    <td style={cellStyle}>{b.name}</td>
                    <td style={cellStyle}>
                      <div>{b.phone}</div>
                      <div>{b.email}</div>
                    </td>
                    <td style={cellStyle}>{b.service?.name || "-"}</td>
                    <td style={cellStyle}>{STATUS_LABELS[b.status] || b.status}</td>
                    <td style={cellStyle}>
                      <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                        {b.status !== "completed" && (
                          <button
                            type="button"
                            className="btn btn--secondary"
                            style={{ padding: "0.5rem 1rem", minHeight: "2.25rem", fontSize: "1rem" }}
                            disabled={busyId === b.id}
                            onClick={() => setStatus(b.id, "completed")}
                          >
                            Mark Complete
                          </button>
                        )}
                        {b.status !== "cancelled" && (
                          <button
                            type="button"
                            className="btn btn--danger"
                            style={{ padding: "0.5rem 1rem", minHeight: "2.25rem", fontSize: "1rem" }}
                            disabled={busyId === b.id}
                            onClick={() => setStatus(b.id, "cancelled")}
                          >
                            Cancel
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="stack">
        <h2>Block Off Time</h2>
        <p className="prose">
          Block a specific date and time so clients can't book it (vacation, a personal appointment, etc).
        </p>

        <form onSubmit={handleBlock} className="card stack" style={{ maxWidth: "26rem" }}>
          <div className="field">
            <label htmlFor="block-date">Date</label>
            <input
              id="block-date"
              type="date"
              min={todayKey()}
              value={blockForm.date}
              onChange={(e) => setBlockForm((f) => ({ ...f, date: e.target.value }))}
            />
          </div>
          <div className="field">
            <label htmlFor="block-time">Time</label>
            <input
              id="block-time"
              type="time"
              value={blockForm.time}
              onChange={(e) => setBlockForm((f) => ({ ...f, time: e.target.value }))}
            />
          </div>
          {blockError && <p className="alert alert--error" role="alert">{blockError}</p>}
          <button type="submit" className="btn btn--primary" disabled={blockBusy}>
            {blockBusy ? "Blocking..." : "Block This Time"}
          </button>
        </form>

        <h3>Currently Blocked Times</h3>
        {!blockedSlots && <p>Loading...</p>}
        {blockedSlots && blockedSlots.length === 0 && <p>No blocked times.</p>}
        {blockedSlots && blockedSlots.length > 0 && (
          <ul className="stack--tight" style={{ listStyle: "none", padding: 0 }}>
            {blockedSlots.map((s) => (
              <li key={s.id} className="card" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
                <span>{formatDateFullLabel(s.date)} at {formatTimeLabel(s.time)}</span>
                <button type="button" className="btn btn--secondary" disabled={blockBusy} onClick={() => handleUnblock(s.id)}>
                  Unblock
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

const cellStyle = { padding: "0.75rem", borderBottom: "1px solid var(--color-border)", verticalAlign: "top" };
