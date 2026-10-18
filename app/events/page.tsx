"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { LoginForm } from "@/components/LoginForm";
import { PageHeader } from "@/components/PageHeader";
import { googleMapsDirectionsUrl } from "@/lib/driving-distance";

const DRIVE_RANGE_OPTIONS = [3, 5, 10] as const;

const SERIES_SUGGESTIONS = ["NRL22 Canada", "PRS Rimfire"];

interface EventRow {
  id: number;
  name: string;
  series: string;
  event_date: string;
  city: string;
  province: string;
  address: string | null;
  drive_km: string | null;
  drive_minutes: string | null;
  registration_url: string | null;
  notes: string | null;
}

const inputClass =
  "w-full rounded-md border border-neutral-300 bg-white px-2 py-1.5 text-sm text-neutral-900 focus:border-blue-500 focus:outline-none dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100";
const labelClass =
  "block text-xs font-medium text-neutral-600 dark:text-neutral-400";

class AuthRequiredError extends Error {}

async function postJson(path: string, body: unknown) {
  const res = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (res.status === 401) throw new AuthRequiredError();
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(
      typeof data.error === "string" ? data.error : "Request failed",
    );
  }
  return res.json();
}

async function deleteJson(path: string) {
  const res = await fetch(path, { method: "DELETE" });
  if (res.status === 401) throw new AuthRequiredError();
  if (!res.ok) throw new Error("Request failed");
}

export default function EventsPage() {
  const [events, setEvents] = useState<EventRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [needsLogin, setNeedsLogin] = useState(false);
  const [maxHours, setMaxHours] = useState<number | null>(3);
  const retryRef = useRef<() => void>(() => {});

  async function reload() {
    setError(null);
    try {
      const res = await fetch("/api/events");
      if (!res.ok) throw new Error("Could not load events");
      setEvents(await res.json());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load events");
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    reload();
  }, []);

  async function withAuth(action: () => Promise<void>, retry: () => void) {
    setError(null);
    try {
      await action();
      setNeedsLogin(false);
    } catch (e) {
      if (e instanceof AuthRequiredError) {
        setNeedsLogin(true);
        retryRef.current = retry;
        return;
      }
      setError(e instanceof Error ? e.message : "Something went wrong");
    }
  }

  async function handleAddEvent(body: {
    name: string;
    series: string;
    eventDate: string;
    city: string;
    province: string;
    address: string;
    registrationUrl: string;
    notes: string;
  }) {
    await withAuth(
      async () => {
        await postJson("/api/events", {
          ...body,
          address: body.address || undefined,
          registrationUrl: body.registrationUrl || undefined,
          notes: body.notes || undefined,
        });
        await reload();
      },
      () => void handleAddEvent(body),
    );
  }

  async function handleDeleteEvent(id: number) {
    await withAuth(
      async () => {
        await deleteJson(`/api/events/${id}`);
        await reload();
      },
      () => void handleDeleteEvent(id),
    );
  }

  const visibleEvents = (events ?? []).filter(
    (event) =>
      maxHours === null ||
      (event.drive_minutes !== null &&
        Number(event.drive_minutes) <= maxHours * 60),
  );

  return (
    <div className="mx-auto w-full max-w-3xl flex-1 space-y-6 p-4 lg:p-6">
      <PageHeader eyebrow="Plan" title="Events">
        .22 rimfire precision matches (NRL22 Canada, PRS Rimfire, and others),
        with driving distance/time from Calgary (via OSRM routing) so you can
        spot day-trip-able matches.
      </PageHeader>

      {error && (
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      )}
      {needsLogin && (
        <LoginForm
          onSuccess={() => {
            setNeedsLogin(false);
            retryRef.current();
          }}
        />
      )}

      <AddEventForm onAdd={handleAddEvent} />

      <label className="flex items-center gap-2 text-sm text-neutral-700 dark:text-neutral-300">
        Show events within
        <select
          className={`${inputClass} w-auto`}
          value={maxHours ?? "any"}
          onChange={(e) =>
            setMaxHours(
              e.target.value === "any" ? null : Number(e.target.value),
            )
          }
        >
          {DRIVE_RANGE_OPTIONS.map((hours) => (
            <option key={hours} value={hours}>
              {hours}h
            </option>
          ))}
          <option value="any">any distance</option>
        </select>
        by car
      </label>

      {events === null ? (
        <p className="text-sm text-neutral-500">Loading…</p>
      ) : visibleEvents.length === 0 ? (
        <p className="text-sm text-neutral-500">
          {events.length === 0
            ? "No events yet — add the first one above."
            : "No events match this filter."}
        </p>
      ) : (
        <div className="space-y-3">
          {visibleEvents.map((event) => (
            <EventCard
              key={event.id}
              event={event}
              onDelete={() => handleDeleteEvent(event.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function EventCard({
  event,
  onDelete,
}: {
  event: EventRow;
  onDelete: () => void;
}) {
  const destination = event.address
    ? `${event.address}, ${event.city}, ${event.province}`
    : `${event.city}, ${event.province}`;
  const driveMinutes =
    event.drive_minutes === null ? null : Number(event.drive_minutes);
  const driveKm = event.drive_km === null ? null : Number(event.drive_km);
  const badgeClass =
    driveMinutes === null
      ? "bg-neutral-100 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400"
      : driveMinutes <= 3 * 60
        ? "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300"
        : driveMinutes <= 5 * 60
          ? "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300"
          : driveMinutes <= 10 * 60
            ? "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300"
            : "bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300";

  return (
    <div className="rounded-lg border border-neutral-200 bg-white p-3 dark:border-neutral-800 dark:bg-neutral-900">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-medium">{event.name}</h3>
            <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[11px] font-medium text-blue-800 dark:bg-blue-900/40 dark:text-blue-300">
              {event.series}
            </span>
          </div>
          <p className="text-xs text-neutral-500 dark:text-neutral-400">
            {new Date(event.event_date).toLocaleDateString("en-CA", {
              weekday: "short",
              year: "numeric",
              month: "short",
              day: "numeric",
            })}
            {" — "}
            {event.city}, {event.province}
          </p>
          {event.notes && (
            <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
              {event.notes}
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={() => {
            if (confirm(`Delete "${event.name}"?`)) onDelete();
          }}
          className="shrink-0 text-xs font-medium text-neutral-500 hover:text-red-600 dark:text-neutral-400 dark:hover:text-red-400"
        >
          Delete
        </button>
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
        <span className={`rounded-full px-2 py-0.5 font-medium ${badgeClass}`}>
          {driveKm !== null && driveMinutes !== null
            ? `${Math.round(driveKm)} km · ${(driveMinutes / 60).toFixed(1)}h drive`
            : "Distance unknown"}
        </span>
        <a
          href={googleMapsDirectionsUrl(destination)}
          target="_blank"
          rel="noreferrer"
          className="font-medium text-blue-600 hover:underline dark:text-blue-400"
        >
          Directions
        </a>
        {event.registration_url && (
          <a
            href={event.registration_url}
            target="_blank"
            rel="noreferrer"
            className="font-medium text-blue-600 hover:underline dark:text-blue-400"
          >
            Register
          </a>
        )}
      </div>
    </div>
  );
}

function AddEventForm({
  onAdd,
}: {
  onAdd: (body: {
    name: string;
    series: string;
    eventDate: string;
    city: string;
    province: string;
    address: string;
    registrationUrl: string;
    notes: string;
  }) => void;
}) {
  const [name, setName] = useState("");
  const [series, setSeries] = useState("NRL22 Canada");
  const [eventDate, setEventDate] = useState("");
  const [city, setCity] = useState("");
  const [province, setProvince] = useState("AB");
  const [address, setAddress] = useState("");
  const [registrationUrl, setRegistrationUrl] = useState("");
  const [notes, setNotes] = useState("");

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (
      !name.trim() ||
      !series.trim() ||
      !eventDate ||
      !city.trim() ||
      !province.trim()
    )
      return;
    onAdd({
      name: name.trim(),
      series: series.trim(),
      eventDate,
      city: city.trim(),
      province: province.trim(),
      address: address.trim(),
      registrationUrl: registrationUrl.trim(),
      notes: notes.trim(),
    });
    setName("");
    setEventDate("");
    setCity("");
    setAddress("");
    setRegistrationUrl("");
    setNotes("");
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-2 rounded-lg border border-neutral-200 bg-neutral-50 p-3 dark:border-neutral-800 dark:bg-neutral-900/50"
    >
      <h2 className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">
        Add an event
      </h2>
      <div className="grid grid-cols-2 gap-2">
        <div className="col-span-2">
          <label className={labelClass} htmlFor="eventName">
            Match name
          </label>
          <input
            id="eventName"
            className={inputClass}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Foothills Precision Rifle Club Match"
          />
        </div>
        <div className="col-span-2">
          <label className={labelClass} htmlFor="eventSeries">
            Series / league
          </label>
          <input
            id="eventSeries"
            list="series-suggestions"
            className={inputClass}
            value={series}
            onChange={(e) => setSeries(e.target.value)}
            placeholder="e.g. NRL22 Canada, PRS Rimfire"
          />
          <datalist id="series-suggestions">
            {SERIES_SUGGESTIONS.map((s) => (
              <option key={s} value={s} />
            ))}
          </datalist>
        </div>
        <div>
          <label className={labelClass} htmlFor="eventDate">
            Date
          </label>
          <input
            id="eventDate"
            type="date"
            className={inputClass}
            value={eventDate}
            onChange={(e) => setEventDate(e.target.value)}
          />
        </div>
        <div>
          <label className={labelClass} htmlFor="eventProvince">
            Province
          </label>
          <input
            id="eventProvince"
            className={inputClass}
            value={province}
            onChange={(e) => setProvince(e.target.value)}
            placeholder="AB"
          />
        </div>
        <div>
          <label className={labelClass} htmlFor="eventCity">
            City
          </label>
          <input
            id="eventCity"
            className={inputClass}
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="e.g. Cochrane"
          />
        </div>
        <div>
          <label className={labelClass} htmlFor="eventAddress">
            Address (optional, improves distance accuracy)
          </label>
          <input
            id="eventAddress"
            className={inputClass}
            value={address}
            onChange={(e) => setAddress(e.target.value)}
          />
        </div>
      </div>
      <div>
        <label className={labelClass} htmlFor="eventRegistrationUrl">
          Registration link
        </label>
        <input
          id="eventRegistrationUrl"
          className={inputClass}
          value={registrationUrl}
          onChange={(e) => setRegistrationUrl(e.target.value)}
          placeholder="https://practiscore.com/... or the match's own site"
        />
      </div>
      <div>
        <label className={labelClass} htmlFor="eventNotes">
          Notes (optional)
        </label>
        <input
          id="eventNotes"
          className={inputClass}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </div>
      <button
        type="submit"
        className="rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700"
      >
        Add event
      </button>
    </form>
  );
}
