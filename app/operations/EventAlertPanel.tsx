"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

type EventItem = {
  event_type: string;
  severity: string;
  status: string;
  signal: string;
  equipment_id: string;
  timestamp: string;
  message: string;
  recommended_review: string;
};

type EventsResponse = {
  equipment_id: string;
  status: string;
  sensor_window: {
    sample_count: number;
    oldest_timestamp: string;
    newest_timestamp: string;
  };
  events: EventItem[];
  observed_changes: {
    vibration_percent: number;
    temperature_percent: number;
    flow_percent: number;
    pressure_percent: number;
  };
  method: string;
};

export default function EventAlertPanel() {
  const [data, setData] = useState<EventsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadEvents() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        "${process.env.NEXT_PUBLIC_API_URL}/equipment/C-104/events",
        { cache: "no-store" }
      );

      if (!response.ok) {
        throw new Error("Event intelligence request failed.");
      }

      const result = await response.json();

      if (result.error) {
        throw new Error(result.error);
      }

      setData(result);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load event intelligence."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadEvents();

    const channel = supabase
      .channel("operations-event-intelligence")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "sensor_readings",
        },
        () => {
          loadEvents();
        }
      )
      .subscribe();

    const interval = window.setInterval(() => {
      loadEvents();
    }, 60000);

    return () => {
      window.clearInterval(interval);
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <section className="mb-6 rounded-2xl border border-white/10 bg-white/[0.03] p-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <div className="text-xs uppercase tracking-[0.2em] text-zinc-500">
            Event Intelligence
          </div>

          <h2 className="mt-2 text-xl font-semibold">
            Alerts & Engineering Events
          </h2>

          <p className="mt-1 text-sm text-zinc-500">
            Analytical events generated from the available C-104 sensor window.
          </p>
        </div>

        <div className="rounded-full border border-amber-900/60 bg-amber-950/20 px-3 py-1.5 text-[10px] uppercase tracking-wider text-amber-400">
          Human Review
        </div>
      </div>

      {loading && (
        <div className="mt-5 rounded-xl border border-white/10 bg-black/20 p-4 text-sm text-zinc-500">
          Analyzing current sensor events...
        </div>
      )}

      {error && (
        <div className="mt-5 rounded-xl border border-red-900 bg-red-950/30 p-4 text-sm text-red-300">
          {error}
          <button
            type="button"
            onClick={loadEvents}
            className="ml-4 rounded-md border border-red-800 px-3 py-1 text-xs text-red-300 hover:bg-red-950"
          >
            Retry
          </button>
        </div>
      )}

      {data && !loading && !error && (
        <>
          <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-4">
            <div className="rounded-xl border border-white/10 bg-black/20 p-4">
              <div className="text-[10px] uppercase tracking-wider text-zinc-600">
                Events
              </div>
              <div className="mt-2 text-2xl font-semibold">
                {data.events.length}
              </div>
            </div>

            <div className="rounded-xl border border-white/10 bg-black/20 p-4">
              <div className="text-[10px] uppercase tracking-wider text-zinc-600">
                Vibration
              </div>
              <div className="mt-2 text-2xl font-semibold">
                {data.observed_changes.vibration_percent > 0 ? "+" : ""}
                {data.observed_changes.vibration_percent.toFixed(1)}%
              </div>
            </div>

            <div className="rounded-xl border border-white/10 bg-black/20 p-4">
              <div className="text-[10px] uppercase tracking-wider text-zinc-600">
                Temperature
              </div>
              <div className="mt-2 text-2xl font-semibold">
                {data.observed_changes.temperature_percent > 0 ? "+" : ""}
                {data.observed_changes.temperature_percent.toFixed(1)}%
              </div>
            </div>

            <div className="rounded-xl border border-white/10 bg-black/20 p-4">
              <div className="text-[10px] uppercase tracking-wider text-zinc-600">
                Sensor Samples
              </div>
              <div className="mt-2 text-2xl font-semibold">
                {data.sensor_window.sample_count}
              </div>
            </div>
          </div>

          <div className="mt-5 space-y-3">
            {data.events.map((event, index) => {
              const high = event.severity === "High";
              const medium = event.severity === "Medium";

              return (
                <div
                  key={`${event.signal}-${event.event_type}-${index}`}
                  className={`rounded-xl border p-5 ${
                    high
                      ? "border-red-900/70 bg-red-950/20"
                      : medium
                        ? "border-amber-900/60 bg-amber-950/10"
                        : "border-white/10 bg-black/20"
                  }`}
                >
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs uppercase tracking-wider text-zinc-500">
                          {event.event_type}
                        </span>

                        <span
                          className={`rounded-full border px-2 py-0.5 text-[9px] uppercase tracking-wider ${
                            high
                              ? "border-red-800 text-red-400"
                              : medium
                                ? "border-amber-800 text-amber-400"
                                : "border-white/10 text-zinc-500"
                          }`}
                        >
                          {event.severity}
                        </span>

                        <span className="rounded-full border border-white/10 px-2 py-0.5 text-[9px] uppercase tracking-wider text-zinc-500">
                          {event.status}
                        </span>
                      </div>

                      <h3 className="mt-2 font-semibold text-zinc-200">
                        {event.signal}  {event.message}
                      </h3>
                    </div>

                    <div className="text-xs text-zinc-600">
                      {new Date(event.timestamp).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>
                  </div>

                  <div className="mt-4 rounded-lg border border-white/5 bg-black/20 p-3">
                    <div className="text-[10px] uppercase tracking-wider text-zinc-600">
                      Engineering Review
                    </div>
                    <p className="mt-1 text-xs leading-5 text-zinc-500">
                      {event.recommended_review}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-4 rounded-xl border border-white/5 bg-black/10 p-4 text-xs leading-5 text-zinc-600">
            {data.method}
          </div>
        </>
      )}
    </section>
  );
}





