import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { apiRequest } from "../services/api.js";

/**
 * EventsPage — dark Luma-style dashboard
 */
export default function EventsPage({ user = null }) {
  const [tab, setTab] = useState("upcoming"); // 'upcoming' | 'past'
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [logoutPending, setLogoutPending] = useState(false);
  const [deletingEventId, setDeletingEventId] = useState("");
  const [pendingDelete, setPendingDelete] = useState(null);
  const [viewportWidth, setViewportWidth] = useState(() =>
    typeof window === "undefined" ? 1024 : window.innerWidth,
  );
  const { logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    function handleResize() {
      setViewportWidth(window.innerWidth);
    }

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Exact same layout structure matching your reference component
  const responsive =
    viewportWidth <= 480
      ? mobileStyles
      : viewportWidth <= 768
        ? tabletStyles
        : null;

  async function handleLogout() {
    if (logoutPending) return;
    setLogoutPending(true);
    await logout();
    navigate("/signup", { replace: true });
  }

  async function handleDeleteEvent(eventId, eventTitle) {
    if (!eventId || deletingEventId) return;
    setPendingDelete({ eventId, eventTitle });
  }

  async function confirmDeleteEvent() {
    if (!pendingDelete?.eventId || deletingEventId) return;

    const { eventId } = pendingDelete;
    setDeletingEventId(eventId);
    try {
      await apiRequest(`/events/${eventId}`, { method: "DELETE" });
      setEvents((currentEvents) =>
        currentEvents.filter((event) => event.id !== eventId),
      );
      setPendingDelete(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setDeletingEventId("");
    }
  }

  useEffect(() => {
    async function loadEvents() {
      setLoading(true);
      setError("");

      try {
        const payload = await apiRequest("/events");
        setEvents(
          Array.isArray(payload.data?.events) ? payload.data.events : [],
        );
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    loadEvents();
  }, []);

  const upcomingEvents = useMemo(() => events.filter(isUpcoming), [events]);
  const pastEvents = useMemo(
    () => events.filter((event) => !isUpcoming(event)),
    [events],
  );
  const visibleEvents = tab === "upcoming" ? upcomingEvents : pastEvents;

  return (
    <div style={{ ...styles.shell, ...(responsive?.shell || {}) }}>
      {/* ── TOPBAR ── */}
      <header style={{ ...styles.topbar, ...(responsive?.topbar || {}) }}>
        <nav
          style={{ ...styles.topbarLeft, ...(responsive?.topbarLeft || {}) }}
        >
          <span style={styles.starLogo} aria-label="EventsNest">
            ✦
          </span>

          {/* Titles show up natively on hover; labels hide on smaller viewports exactly like your example */}
          <a
            href="/events"
            style={styles.navItem}
            title="Show Events"
            data-active="true"
          >
            <span style={styles.navIcon}>▦</span>{" "}
            {viewportWidth > 580 && "Events"}
          </a>
          <a
            href="/calendars"
            style={{ ...styles.navItem, color: "#8a8a8a" }}
            title="Show Calendar"
          >
            <span style={styles.navIcon}>📅</span>{" "}
            {viewportWidth > 580 && "Calendars"}
          </a>
          <a
            href="/discover"
            style={{ ...styles.navItem, color: "#8a8a8a" }}
            title="Show Discover"
          >
            <span style={styles.navIcon}>◎</span>{" "}
            {viewportWidth > 580 && "Discover"}
          </a>
        </nav>

        <div
          style={{ ...styles.topbarRight, ...(responsive?.topbarRight || {}) }}
        >
          {viewportWidth > 400 && (
            <span style={styles.timeChip}>{useCurrentTime()}</span>
          )}

          <button
            type="button"
            style={{ ...styles.createBtn, ...(responsive?.createBtn || {}) }}
            onClick={() => navigate("/events/new")}
          >
            {viewportWidth <= 480 ? "Create" : "Create Event"}
          </button>

          <button
            type="button"
            style={styles.logoutBtn}
            onClick={handleLogout}
            disabled={logoutPending}
          >
            {logoutPending ? "Signing out..." : "Logout"}
          </button>

          {/* search icon */}
          <button style={styles.iconBtn} aria-label="Search">
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>
          </button>

          {/* notification bell icon */}
          <button style={styles.iconBtn} aria-label="Notifications">
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            >
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
          </button>

          <div style={styles.avatar}>🙂</div>
        </div>
      </header>

      {/* ── MAIN ── */}
      <main style={{ ...styles.main, ...(responsive?.main || {}) }}>
        {pendingDelete && (
          <div style={styles.deleteNotice} role="alert" aria-live="polite">
            <div>
              <strong>Delete event?</strong>
              <div style={styles.deleteNoticeText}>
                "{pendingDelete.eventTitle}" will be removed permanently, including tickets, awards, contestants, and votes.
              </div>
            </div>
            <div style={styles.deleteNoticeActions}>
              <button
                type="button"
                style={styles.deleteNoticeCancel}
                onClick={() => setPendingDelete(null)}
                disabled={deletingEventId}
              >
                Cancel
              </button>
              <button
                type="button"
                style={styles.deleteNoticeConfirm}
                onClick={confirmDeleteEvent}
                disabled={deletingEventId}
              >
                {deletingEventId ? "Deleting…" : "Delete event"}
              </button>
            </div>
          </div>
        )}

        {/* page header row */}
        <div style={{ ...styles.pageHead, ...(responsive?.pageHead || {}) }}>
          <h1 style={styles.pageTitle}>Events</h1>

          {/* upcoming / past toggle */}
          <div
            style={{ ...styles.toggle, ...(responsive?.toggle || {}) }}
            role="tablist"
          >
            <button
              role="tab"
              aria-selected={tab === "upcoming"}
              style={{
                ...styles.toggleBtn,
                ...(tab === "upcoming" ? styles.toggleBtnActive : {}),
              }}
              onClick={() => setTab("upcoming")}
            >
              Upcoming
            </button>
            <button
              role="tab"
              aria-selected={tab === "past"}
              style={{
                ...styles.toggleBtn,
                ...(tab === "past" ? styles.toggleBtnActive : {}),
              }}
              onClick={() => setTab("past")}
            >
              Past
            </button>
          </div>
        </div>

        {/* ── content ── */}
        {loading ? (
          <EmptyState
            tab={tab}
            navigate={navigate}
            message="Loading events..."
            responsive={responsive}
          />
        ) : error ? (
          <EmptyState
            tab={tab}
            navigate={navigate}
            message={error}
            responsive={responsive}
          />
        ) : visibleEvents.length === 0 ? (
          <EmptyState tab={tab} navigate={navigate} responsive={responsive} />
        ) : (
          <div style={{ ...styles.evGrid, ...(responsive?.evGrid || {}) }}>
            {visibleEvents.map((ev) => (
              <EventCard
                key={ev.id}
                ev={ev}
                onOpen={() => navigate(`/events/${ev.id}`)}
                onDelete={() => handleDeleteEvent(ev.id, ev.title)}
                deleting={deletingEventId === ev.id}
                responsive={responsive}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

/* ─── empty state ─── */
function EmptyState({ tab, navigate, message = "", responsive = null }) {
  return (
    <div style={{ ...styles.emptyWrap, ...(responsive?.emptyWrap || {}) }}>
      <div
        style={{
          ...styles.emptyIconWrap,
          ...(responsive?.emptyIconWrap || {}),
        }}
      >
        <div style={{ ...styles.emptyIcon, ...(responsive?.emptyIcon || {}) }}>
          <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
            <rect
              x="6"
              y="14"
              width="56"
              height="54"
              rx="8"
              fill="#2a2a2e"
              stroke="#3a3a40"
              strokeWidth="1.5"
            />
            <rect
              x="6"
              y="14"
              width="56"
              height="16"
              rx="8"
              fill="#323238"
              stroke="#3a3a40"
              strokeWidth="1.5"
            />
            <rect x="16" y="36" width="18" height="4" rx="2" fill="#4a4a52" />
            <rect x="16" y="46" width="12" height="4" rx="2" fill="#3e3e46" />
            <rect x="34" y="46" width="12" height="4" rx="2" fill="#3e3e46" />
            <rect x="16" y="56" width="8" height="8" rx="2" fill="#3e3e46" />
            <rect x="30" y="56" width="8" height="8" rx="2" fill="#4a4a52" />
            <rect x="44" y="36" width="10" height="4" rx="2" fill="#3e3e46" />
            <circle
              cx="54"
              cy="20"
              r="14"
              fill="#2a2a2e"
              stroke="#3a3a40"
              strokeWidth="1.5"
            />
            <text
              x="54"
              y="26"
              textAnchor="middle"
              fill="#6b6b76"
              fontSize="16"
              fontWeight="700"
              fontFamily="system-ui"
            >
              0
            </text>
          </svg>
        </div>
      </div>

      <h2 style={{ ...styles.emptyTitle, ...(responsive?.emptyTitle || {}) }}>
        {message ||
          (tab === "upcoming" ? "No Upcoming Events" : "No Past Events")}
      </h2>
      {!message && (
        <p style={{ ...styles.emptyBody, ...(responsive?.emptyBody || {}) }}>
          {tab === "upcoming"
            ? "You have no upcoming events. Why not host one?"
            : "You haven't hosted or attended any events yet."}
        </p>
      )}

      <button
        type="button"
        style={{
          ...styles.createBtnLarge,
          ...(responsive?.createBtnLarge || {}),
        }}
        onClick={() => navigate("/events/new")}
      >
        <span style={{ marginRight: 6, fontSize: 16 }}>+</span>
        Create Event
      </button>
    </div>
  );
}

function isUpcoming(event) {
  const eventDate = new Date(
    `${event.startDate}T${event.startTime || "00:00"}`,
  );
  return Number.isNaN(eventDate.getTime())
    ? true
    : eventDate.getTime() >= Date.now();
}

/* ─── event card ─── */
function EventCard({
  ev,
  onOpen,
  onDelete,
  deleting = false,
  responsive = null,
}) {
  const dateLabel = formatEventDate(ev.startDate);
  const timeLabel = [ev.startTime, ev.endTime].filter(Boolean).join(" - ");
  const statusLabel = ev.isPublic ? "Public" : "Private";

  return (
    <div
      style={{ ...styles.card, ...(responsive?.card || {}) }}
      onClick={onOpen}
      role="button"
      tabIndex={0}
    >
      <div
        style={{
          ...styles.cardCover,
          ...(responsive?.cardCover || {}),
          position: "relative",
          overflow: "hidden",
        }}
      >
        {ev.coverImage ? (
          <img
            src={ev.coverImage}
            alt={ev.title}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        ) : (
          <span style={{ fontSize: 36 }}>{ev.emoji || "📅"}</span>
        )}
      </div>
      <div style={{ ...styles.cardBody, ...(responsive?.cardBody || {}) }}>
        <div style={styles.cardHeaderRow}>
          <span />
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation(); // Crucial: stops the card from opening the event details page
              onDelete?.();
            }}
            disabled={deleting}
            aria-label={`Delete ${ev.title}`}
            title="Delete event"
            style={{
              ...styles.deleteBtn,
              ...(deleting ? styles.deleteBtnDisabled : {}),
            }}
          >
            {deleting ? "Deleting…" : "Delete"}
          </button>
        </div>
        <p style={{ ...styles.cardDate, ...(responsive?.cardDate || {}) }}>
          {dateLabel}
        </p>
        <p style={{ ...styles.cardTitle, ...(responsive?.cardTitle || {}) }}>
          {ev.title}
        </p>
        <p style={{ ...styles.cardLoc, ...(responsive?.cardLoc || {}) }}>
          {ev.location ? `📍 ${ev.location}` : "📍 Location not set"}
        </p>
        <p style={{ ...styles.cardLoc, ...(responsive?.cardLoc || {}) }}>
          {timeLabel}
        </p>
        <div style={{ ...styles.cardFoot, ...(responsive?.cardFoot || {}) }}>
          <span
            style={{ ...styles.cardGoing, ...(responsive?.cardGoing || {}) }}
          >
            {ev.hostName || ev.hostEmail || "Creator"}{" "}
          </span>
          <span
            style={{
              ...styles.cardTag,
              ...(responsive?.cardTag || {}),
              background: ev.isPublic ? "#1f3d2c" : "#3a2431",
              color: ev.isPublic ? "#86efac" : "#f9a8d4",
            }}
          >
            {statusLabel}
          </span>
        </div>
      </div>
    </div>
  );
}

/* ─── clock hook ─── */
function useCurrentTime() {
  const [t] = useState(() => fmt());
  return t;
}
function fmt() {
  return new Intl.DateTimeFormat("en-NG", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Africa/Lagos",
    timeZoneName: "short",
  }).format(new Date());
}

function formatEventDate(dateString) {
  if (!dateString) return "Date not set";
  const eventDate = new Date(dateString);
  if (Number.isNaN(eventDate.getTime())) return dateString;
  return new Intl.DateTimeFormat("en-NG", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(eventDate);
}

/* ─── styles ─── */
const styles = {
  shell: {
    minHeight: "100vh",
    background: "#14141a",
    color: "#e8e8ec",
    fontFamily: "'DM Sans', system-ui, sans-serif",
    WebkitFontSmoothing: "antialiased",
  },
  topbar: {
    position: "sticky",
    top: 0,
    zIndex: 100,
    height: 52,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "0 28px",
    background: "rgba(20,20,26,0.85)",
    backdropFilter: "blur(18px)",
    WebkitBackdropFilter: "blur(18px)",
    borderBottom: "1px solid rgba(255,255,255,0.07)",
  },
  topbarLeft: { display: "flex", alignItems: "center", gap: 4 },
  starLogo: {
    fontSize: 18,
    color: "#a78bfa",
    marginRight: 16,
    cursor: "pointer",
  },
  navItem: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    fontSize: 13.5,
    fontWeight: 500,
    color: "#e8e8ec",
    textDecoration: "none",
    padding: "5px 11px",
    borderRadius: 8,
    transition: "background .12s",
    cursor: "pointer",
  },
  navIcon: { fontSize: 13, opacity: 0.75 },
  topbarRight: { display: "flex", alignItems: "center", gap: 8 },
  timeChip: {
    fontSize: 12,
    color: "#6b6b76",
    fontVariantNumeric: "tabular-nums",
  },
  createBtn: {
    fontSize: 12.5,
    fontWeight: 600,
    color: "#e8e8ec",
    background: "rgba(255,255,255,0.10)",
    border: "1px solid rgba(255,255,255,0.12)",
    padding: "6px 14px",
    borderRadius: 999,
    cursor: "pointer",
    transition: "background .12s",
  },
  logoutBtn: {
    fontSize: 12.5,
    fontWeight: 600,
    color: "#f0f0f4",
    background: "rgba(248,113,113,0.13)",
    border: "1px solid rgba(248,113,113,0.3)",
    padding: "6px 12px",
    borderRadius: 999,
    cursor: "pointer",
    fontFamily: "'DM Sans', system-ui, sans-serif",
  },
  iconBtn: {
    background: "none",
    border: "none",
    color: "#6b6b76",
    cursor: "pointer",
    padding: 6,
    borderRadius: 8,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  avatar: {
    width: 30,
    height: 30,
    borderRadius: "50%",
    background: "#f5c842",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
  },
  main: { maxWidth: 900, margin: "0 auto", padding: "40px 28px 80px" },
  pageHead: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 32,
  },
  pageTitle: {
    fontSize: 26,
    fontWeight: 700,
    letterSpacing: "-.5px",
    color: "#f0f0f4",
  },
  toggle: {
    display: "flex",
    background: "rgba(255,255,255,0.06)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 10,
    padding: 3,
    gap: 2,
  },
  toggleBtn: {
    fontSize: 13,
    fontWeight: 500,
    color: "#6b6b76",
    background: "none",
    border: "none",
    padding: "6px 16px",
    borderRadius: 7,
    cursor: "pointer",
    fontFamily: "'DM Sans', system-ui, sans-serif",
  },
  toggleBtnActive: { background: "rgba(255,255,255,0.10)", color: "#f0f0f4" },
  emptyWrap: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 80,
    paddingBottom: 60,
    textAlign: "center",
  },
  emptyIconWrap: { marginBottom: 28 },
  emptyIcon: { opacity: 0.85 },
  emptyTitle: {
    fontSize: 22,
    fontWeight: 600,
    color: "#8a8a96",
    marginBottom: 10,
  },
  emptyBody: {
    fontSize: 14,
    color: "#55555e",
    marginBottom: 32,
    lineHeight: 1.6,
  },
  createBtnLarge: {
    display: "inline-flex",
    alignItems: "center",
    textDecoration: "none",
    fontSize: 14,
    fontWeight: 600,
    color: "#e8e8ec",
    background: "rgba(255,255,255,0.10)",
    border: "1px solid rgba(255,255,255,0.13)",
    padding: "11px 24px",
    borderRadius: 999,
    cursor: "pointer",
  },
  evGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
    gap: 16,
  },
  card: {
    background: "#1c1c24",
    border: "1px solid rgba(255,255,255,0.07)",
    borderRadius: 14,
    overflow: "hidden",
    cursor: "pointer",
  },
  cardCover: {
    height: 110,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  cardHeaderRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 8,
  },
  deleteBtn: {
    border: "1px solid rgba(255,255,255,0.12)",
    background: "rgba(255,255,255,0.06)",
    color: "#e8e8ec",
    borderRadius: 999,
    padding: "6px 12px",
    fontSize: 11,
    fontWeight: 800,
    cursor: "pointer",
    backdropFilter: "blur(8px)",
    boxShadow: "none",
    transition: "transform 0.15s ease, background 0.15s ease, border-color 0.15s ease",
  },
  deleteBtnDisabled: {
    opacity: 0.8,
    cursor: "wait",
  },
  deleteNotice: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 16,
    padding: "14px 16px",
    border: "1px solid rgba(239, 68, 68, 0.24)",
    background: "rgba(127, 29, 29, 0.18)",
    borderRadius: 14,
    marginBottom: 18,
    color: "#fecaca",
  },
  deleteNoticeText: {
    marginTop: 4,
    fontSize: 13,
    color: "#fca5a5",
    lineHeight: 1.45,
  },
  deleteNoticeActions: {
    display: "flex",
    gap: 10,
    flexShrink: 0,
  },
  deleteNoticeCancel: {
    border: "1px solid rgba(255,255,255,0.14)",
    background: "rgba(255,255,255,0.06)",
    color: "#e5e7eb",
    padding: "9px 14px",
    borderRadius: 999,
    fontWeight: 700,
    cursor: "pointer",
  },
  deleteNoticeConfirm: {
    border: "1px solid rgba(239, 68, 68, 0.5)",
    background: "linear-gradient(180deg, rgba(239,68,68,0.95), rgba(185,28,28,0.95))",
    color: "#fff1f2",
    padding: "9px 14px",
    borderRadius: 999,
    fontWeight: 800,
    cursor: "pointer",
  },
  cardBody: { padding: "12px 14px 14px" },
  cardDate: { fontSize: 11, color: "#6b6b76", marginBottom: 4 },
  cardTitle: {
    fontSize: 14,
    fontWeight: 700,
    color: "#e8e8ec",
    marginBottom: 5,
    lineHeight: 1.3,
  },
  cardLoc: { fontSize: 12, color: "#55555e", marginBottom: 10 },
  cardFoot: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  cardGoing: { fontSize: 11, color: "#6b6b76" },
  cardTag: {
    fontSize: 10.5,
    fontWeight: 700,
    padding: "2px 8px",
    borderRadius: 999,
  },
};

/* ── TABLET BREAKPOINT (768px down to 481px) ── */
const tabletStyles = {
  shell: { paddingBottom: 28 },
  topbar: { padding: "0 18px" },
  main: { maxWidth: 860, padding: "34px 24px 72px" },
  pageHead: { gap: 16, alignItems: "flex-start" },
  topbarRight: { gap: 6, flexWrap: "wrap", justifyContent: "flex-end" },
  evGrid: { gridTemplateColumns: "repeat(auto-fill, minmax(230px, 1fr))" },
};

/* ── MOBILE BREAKPOINT (480px down to 320px) ── */
const mobileStyles = {
  shell: { paddingBottom: 20 },
  topbar: {
    height: "auto",
    padding: "10px 14px",
    gap: 8,
  },
  topbarLeft: { gap: 4 },
  topbarRight: { gap: 8 },
  createBtn: { padding: "6px 12px", fontSize: "11.5px" },
  main: { padding: "14px 12px 40px" },
  pageHead: {
    flexDirection: "column",
    alignItems: "stretch",
    gap: 14,
    marginBottom: 22,
  },
  pageTitle: { fontSize: 24 },
  toggle: { width: "100%" },
  evGrid: { gridTemplateColumns: "1fr" },
  emptyWrap: { paddingTop: 52, paddingBottom: 44 },
  emptyTitle: { fontSize: 18 },
  emptyBody: { fontSize: 13, marginBottom: 24 },
  createBtnLarge: { width: "100%", justifyContent: "center" },
  card: { borderRadius: 16 },
  cardCover: { height: 96 },
  cardBody: { padding: "12px 13px 14px" },
};
