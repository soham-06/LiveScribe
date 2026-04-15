import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import {
  HiOutlineCalendar,
  HiOutlineRefresh,
  HiOutlineClock,
  HiOutlineVideoCamera,
  HiOutlineLocationMarker,
  HiOutlineChevronLeft,
  HiOutlineChevronRight,
  HiOutlineExternalLink,
} from 'react-icons/hi';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

function formatTime(dateStr) {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });
}

function isSameDay(a, b) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function dayKey(d) {
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

export default function GoogleCalendar() {
  const { session } = useAuth();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [connected, setConnected] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState(new Date());
  const [connecting, setConnecting] = useState(false);

  // Supabase stores the Google OAuth access_token as `provider_token`
  // on the session object when the user signed in via Google OAuth.
  useEffect(() => {
    setConnected(!!session?.provider_token);
  }, [session]);

  /* ── Fetch events from Google Calendar REST API ────────── */
  const fetchEvents = useCallback(async () => {
    if (!session?.provider_token) return;
    setLoading(true);
    setError(null);

    const y = currentDate.getFullYear();
    const m = currentDate.getMonth();
    const timeMin = new Date(y, m, 1).toISOString();
    const timeMax = new Date(y, m + 1, 0, 23, 59, 59).toISOString();

    try {
      const res = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/primary/events?` +
        new URLSearchParams({
          timeMin,
          timeMax,
          singleEvents: 'true',
          orderBy: 'startTime',
          maxResults: '250',
        }),
        { headers: { Authorization: `Bearer ${session.provider_token}` } }
      );

      if (!res.ok) {
        if (res.status === 401) {
          setConnected(false);
          setError('Google session expired. Please reconnect.');
          return;
        }
        throw new Error(`Calendar API returned ${res.status}`);
      }

      const data = await res.json();
      setEvents(data.items || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [session?.provider_token, currentDate]);

  useEffect(() => {
    if (connected) fetchEvents();
  }, [connected, fetchEvents]);

  /* ── Google OAuth via Supabase ─────────────────────────── */
  const handleConnect = async () => {
    setConnecting(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        scopes: 'https://www.googleapis.com/auth/calendar.readonly',
        redirectTo: window.location.origin + '/dashboard',
        queryParams: { access_type: 'online', prompt: 'consent' },
      },
    });
    if (error) {
      setError(error.message);
      setConnecting(false);
    }
  };

  /* ── Calendar-grid helpers ─────────────────────────────── */
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDow = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells = [];
  for (let i = 0; i < firstDow; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d));

  // bucket events by day key
  const byDay = {};
  events.forEach((ev) => {
    const s = ev.start?.dateTime || ev.start?.date;
    if (!s) return;
    const k = dayKey(new Date(s));
    (byDay[k] ||= []).push(ev);
  });

  const selectedEvents = byDay[dayKey(selectedDay)] || [];

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));
  const goToday = () => {
    const now = new Date();
    setCurrentDate(new Date(now.getFullYear(), now.getMonth(), 1));
    setSelectedDay(now);
  };

  /* ── Colour coding (Google calendar colors by colorId) ─── */
  const COLOR = {
    1: '#7986cb', 2: '#33b679', 3: '#8e24aa', 4: '#e67c73',
    5: '#f6bf26', 6: '#f4511e', 7: '#039be5', 8: '#616161',
    9: '#3f51b5', 10: '#0b8043', 11: '#d50000',
  };

  /* ════════════════════════════════════════════════════════ */
  /*  NOT CONNECTED                                          */
  /* ════════════════════════════════════════════════════════ */
  if (!connected) {
    return (
      <section className="gcal-section" id="google-calendar">
        <div className="gcal-header">
          <div className="gcal-title">
            <HiOutlineCalendar />
            <span>Google Calendar</span>
          </div>
        </div>

        <div className="gcal-connect-cta">
          <div className="gcal-connect-icon-wrap">
            <HiOutlineCalendar />
          </div>
          <h3>Connect Google Calendar</h3>
          <p>View your upcoming events and sync your schedule right here.</p>
          <button
            className="btn btn-primary gcal-connect-btn"
            onClick={handleConnect}
            disabled={connecting}
            id="connect-google-calendar"
          >
            {connecting ? (
              <>
                <span className="spinner spinner-sm" />
                Connecting…
              </>
            ) : (
              <>
                {/* Google "G" logo */}
                <svg width="18" height="18" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" /><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" /><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" /><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" /></svg>
                Sign in with Google
              </>
            )}
          </button>
          {error && <p className="gcal-error-msg">{error}</p>}
        </div>
      </section>
    );
  }

  /* ════════════════════════════════════════════════════════ */
  /*  CONNECTED — calendar + events                          */
  /* ════════════════════════════════════════════════════════ */
  return (
    <section className="gcal-section" id="google-calendar">
      <div className="gcal-header">
        <div className="gcal-title">
          <HiOutlineCalendar />
          <span>Google Calendar</span>
        </div>
        <div className="gcal-header-actions">
          <button className="btn btn-ghost" onClick={goToday} id="gcal-today">
            Today
          </button>
          <button
            className="btn btn-ghost gcal-icon-btn"
            onClick={fetchEvents}
            disabled={loading}
            title="Refresh"
            id="gcal-refresh"
          >
            <HiOutlineRefresh className={loading ? 'gcal-spin' : ''} />
          </button>
        </div>
      </div>

      {error && (
        <div className="gcal-error-bar">
          <span>{error}</span>
          <button className="btn btn-ghost" onClick={() => setError(null)}>✕</button>
        </div>
      )}

      <div className="gcal-body">
        {/* ── Mini-calendar grid ── */}
        <div className="gcal-mini">
          <div className="gcal-month-nav">
            <button className="btn btn-ghost gcal-icon-btn" onClick={prevMonth} id="gcal-prev">
              <HiOutlineChevronLeft />
            </button>
            <span className="gcal-month-label">{MONTHS[month]} {year}</span>
            <button className="btn btn-ghost gcal-icon-btn" onClick={nextMonth} id="gcal-next">
              <HiOutlineChevronRight />
            </button>
          </div>

          <div className="gcal-dow-row">
            {DAYS.map((d) => (
              <div key={d} className="gcal-dow">{d}</div>
            ))}
          </div>

          <div className="gcal-grid">
            {cells.map((date, i) => {
              if (!date)
                return <div key={`e-${i}`} className="gcal-cell gcal-cell--empty" />;

              const k = dayKey(date);
              const has = !!byDay[k]?.length;
              const sel = isSameDay(date, selectedDay);
              const today = isSameDay(date, new Date());

              return (
                <button
                  key={k}
                  className={[
                    'gcal-cell',
                    today && 'gcal-cell--today',
                    sel && 'gcal-cell--selected',
                    has && 'gcal-cell--has',
                  ].filter(Boolean).join(' ')}
                  onClick={() => setSelectedDay(date)}
                >
                  <span>{date.getDate()}</span>
                  {has && <span className="gcal-dot" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Events list ── */}
        <div className="gcal-events">
          <div className="gcal-events-header">
            <span className="gcal-events-weekday">{DAYS[selectedDay.getDay()]}</span>
            <span className="gcal-events-daynum">{selectedDay.getDate()}</span>
            <span className="gcal-events-month">{MONTHS[selectedDay.getMonth()]}</span>
          </div>

          {loading ? (
            <div className="gcal-events-list">
              {[1, 2, 3].map((i) => (
                <div key={i} className="skeleton gcal-skel" />
              ))}
            </div>
          ) : selectedEvents.length === 0 ? (
            <div className="gcal-empty">
              <HiOutlineCalendar />
              <p>No events</p>
            </div>
          ) : (
            <div className="gcal-events-list">
              {selectedEvents.map((ev) => {
                const start = ev.start?.dateTime || ev.start?.date;
                const end = ev.end?.dateTime || ev.end?.date;
                const allDay = !ev.start?.dateTime;
                const color = COLOR[ev.colorId] || 'var(--accent-primary)';

                return (
                  <div key={ev.id} className="gcal-ev">
                    <div className="gcal-ev-bar" style={{ background: color }} />
                    <div className="gcal-ev-body">
                      <div className="gcal-ev-name">{ev.summary || '(No title)'}</div>
                      <div className="gcal-ev-meta">
                        {allDay ? (
                          <span className="gcal-ev-tag">All day</span>
                        ) : (
                          <span className="gcal-ev-time">
                            <HiOutlineClock />
                            {formatTime(start)} – {formatTime(end)}
                          </span>
                        )}
                        {ev.location && (
                          <span className="gcal-ev-loc">
                            <HiOutlineLocationMarker />
                            {ev.location.length > 28
                              ? ev.location.slice(0, 28) + '…'
                              : ev.location}
                          </span>
                        )}
                        {ev.hangoutLink && (
                          <span className="gcal-ev-meet">
                            <HiOutlineVideoCamera />
                            Meet
                          </span>
                        )}
                      </div>
                    </div>
                    {(ev.hangoutLink || ev.htmlLink) && (
                      <a
                        href={ev.hangoutLink || ev.htmlLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="gcal-ev-link"
                        title="Open"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <HiOutlineExternalLink />
                      </a>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
