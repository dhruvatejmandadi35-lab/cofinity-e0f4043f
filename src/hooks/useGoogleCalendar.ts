import { useState, useEffect, useCallback } from "react";

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
const SCOPES = "https://www.googleapis.com/auth/calendar.readonly";
const STORAGE_KEY = "google_cal_token";

export type GoogleEvent = {
  id: string;
  summary: string;
  description?: string;
  start: { dateTime?: string; date?: string };
  end: { dateTime?: string; date?: string };
  location?: string;
  htmlLink: string;
};

declare global {
  interface Window {
    google: any;
    gapi: any;
  }
}

export function useGoogleCalendar() {
  const [accessToken, setAccessToken] = useState<string | null>(
    () => localStorage.getItem(STORAGE_KEY)
  );
  const [events, setEvents] = useState<GoogleEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadScript = (src: string) =>
    new Promise<void>((resolve, reject) => {
      if (document.querySelector(`script[src="${src}"]`)) { resolve(); return; }
      const s = document.createElement("script");
      s.src = src;
      s.onload = () => resolve();
      s.onerror = () => reject();
      document.head.appendChild(s);
    });

  const signIn = useCallback(async () => {
    await loadScript("https://accounts.google.com/gsi/client");
    return new Promise<void>((resolve, reject) => {
      const client = window.google.accounts.oauth2.initTokenClient({
        client_id: CLIENT_ID,
        scope: SCOPES,
        callback: (response: any) => {
          if (response.error) { reject(response.error); return; }
          localStorage.setItem(STORAGE_KEY, response.access_token);
          setAccessToken(response.access_token);
          resolve();
        },
      });
      client.requestAccessToken();
    });
  }, []);

  const signOut = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setAccessToken(null);
    setEvents([]);
  }, []);

  const fetchEvents = useCallback(async (token: string) => {
    setLoading(true);
    setError(null);
    try {
      const now = new Date().toISOString();
      const future = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString();
      const res = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${now}&timeMax=${future}&singleEvents=true&orderBy=startTime&maxResults=50`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.status === 401) { signOut(); return; }
      const data = await res.json();
      setEvents(data.items || []);
    } catch {
      setError("Failed to load Google Calendar events");
    } finally {
      setLoading(false);
    }
  }, [signOut]);

  useEffect(() => {
    if (accessToken) fetchEvents(accessToken);
  }, [accessToken, fetchEvents]);

  return { accessToken, events, loading, error, signIn, signOut, fetchEvents };
}
