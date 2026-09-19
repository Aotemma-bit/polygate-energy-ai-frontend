"use client";

import EventAlertPanel from "./EventAlertPanel";

import { useEffect, useMemo, useState } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type Asset = {
  equipment_id: string;
  equipment_name: string;
  equipment_type: string;
  facility: string;
  status: string;
  risk_score: number;
  risk_level: string;
  risk_label: string;
  maintenance_events: number;
  top_failure_mode: string | null;
  top_failure_confidence: string | null;
};

type MaintenanceEvent = {
  date?: string;
  maintenance_date?: string;
  event_date?: string;
  timestamp?: string;
  event_type?: string;
  description?: string;
};

type OperationsResponse = {
  status: string;
  summary: {
    total_assets: number;
    critical_assets: number;
    elevated_assets: number;
    watch_assets: number;
    normal_assets: number;
    maintenance_events: number;
  };
  assets: Asset[];
  engineering_concerns: {
    name: string;
    asset_count: number;
  }[];
  method: string;
  error?: string;
};

function riskBadge(level: string) {
  if (level === "Critical") {
    return "border-red-900 bg-red-950/40 text-red-400";
  }

  if (level === "Elevated") {
    return "border-amber-900 bg-amber-950/40 text-amber-400";
  }

  if (level === "Watch") {
    return "border-yellow-900 bg-yellow-950/30 text-yellow-400";
  }

  return "border-emerald-900 bg-emerald-950/30 text-emerald-400";
}

function riskBar(level: string) {
  if (level === "Critical") return "bg-red-500";
  if (level === "Elevated") return "bg-amber-500";
  if (level === "Watch") return "bg-yellow-500";
  return "bg-emerald-500";
}

function maintenanceDate(event: MaintenanceEvent) {
  const raw =
    event.date ||
    event.maintenance_date ||
    event.event_date ||
    event.timestamp;

  if (!raw) return "Date unavailable";

  if (event.date || event.maintenance_date || event.event_date) {
    return String(raw);
  }

  const parsed = new Date(raw);

  if (Number.isNaN(parsed.getTime())) {
    return String(raw);
  }

  return parsed.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function OperationsPage() {
  const [data, setData] = useState<OperationsResponse | null>(null);
  const [maintenanceEvents, setMaintenanceEvents] = useState<
    MaintenanceEvent[]
  >([]);
  const [sensorReadings, setSensorReadings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadOverview(showLoading = false) {
    try {
      if (showLoading) {
        setLoading(true);
      }
      setError("");

      const overviewResponse = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/operations/overview`,
        {
          cache: "no-store",
        }
      );

      if (!overviewResponse.ok) {
        throw new Error("Operations overview request failed.");
      }

      const overview = await overviewResponse.json();

      if (overview.error) {
        throw new Error(overview.error);
      }

      setData(overview);

      try {
        const intelligenceResponse = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/equipment/C-104/intelligence`,
          {
            cache: "no-store",
          }
        );

        if (intelligenceResponse.ok) {
          const intelligence = await intelligenceResponse.json();

          if (!intelligence.error) {
            setMaintenanceEvents(intelligence.maintenance || []);
            setSensorReadings(
              Array.isArray(intelligence.sensor_readings)
                ? intelligence.sensor_readings
                : []
            );
          }
        }
      } catch {
        console.warn(
          "Equipment intelligence request failed; operations overview remains available."
        );
      }
    } catch (err) {
      if (showLoading) {
        setError(
          err instanceof Error
            ? err.message
            : "Unknown frontend error while loading operations."
        );
      } else {
        console.warn(
          "Background operations refresh failed; keeping the last successful dashboard state.",
          err
        );
      }
    } finally {
      if (showLoading) {
        setLoading(false);
      }
    }
  }

  useEffect(() => {
    loadOverview(true);
    const interval = window.setInterval(() => {
      loadOverview(false);
    }, 15000);
    return () => {
      window.clearInterval(interval);
    };
  }, []);

  const trendData = useMemo(() => {
    return [...sensorReadings]
      .reverse()
      .map((reading) => ({
        time: new Date(reading.timestamp).toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
        }),
        vibration: Number(reading.vibration),
        temperature: Number(reading.temperature),
        pressure: Number(reading.pressure),
        flow_rate: Number(reading.flow_rate),
      }));
  }, [sensorReadings]);
  const highestRiskAsset = useMemo(() => {
    if (!data?.assets?.length) return null;

    return [...data.assets].sort(
      (a, b) => b.risk_score - a.risk_score
    )[0];
  }, [data]);

  return (
    <main className="min-h-screen bg-[#07090c] text-white">
      <div className="mx-auto max-w-7xl px-6 py-10">

        {/* HEADER */}
        <header className="mb-10 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="text-xs font-semibold tracking-[0.25em] text-zinc-500">
              POLYGATE ENERGY AI
            </div>

            <h1 className="mt-2 text-3xl font-semibold tracking-tight">
              Operations Command Center
            </h1>

            <p className="mt-2 text-sm text-zinc-400">
              Enterprise energy operations intelligence
            </p>
          </div>

          <div className="flex items-center gap-3">
            <a
              href="/assets"
              className="rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-2.5 text-xs font-medium text-zinc-300 transition hover:border-zinc-700 hover:bg-zinc-900"
            >
              FieldFlow
            </a>

            <div className="rounded-full border border-emerald-900 bg-emerald-950/40 px-4 py-2 text-xs text-emerald-400">
              <span className="mr-2">&gt;</span>
              Decision Support Online
            </div>
          </div>
        </header>

        {loading && (
          <div className="rounded-3xl border border-zinc-800 bg-zinc-950 p-10 text-center text-sm text-zinc-500">
            Loading operations intelligence...
          </div>
        )}

        {error && (
          <div className="rounded-3xl border border-red-900 bg-red-950/30 p-6 text-sm text-red-300">
            <div>{error}</div>

            <button
              onClick={() => loadOverview(true)}
              className="mt-4 rounded-lg border border-red-900 px-3 py-1.5 text-xs text-red-300 hover:bg-red-950/50"
            >
              Retry
            </button>
          </div>
        )}

        {data && !loading && !error && (
          <>
            {/* SUMMARY METRICS */}
            <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
              {[
                [
                  "Total Assets",
                  data.summary.total_assets,
                  "indexed operational assets",
                  "text-zinc-100",
                ],
                [
                  "Critical",
                  data.summary.critical_assets,
                  "highest risk classification",
                  "text-red-400",
                ],
                [
                  "Elevated",
                  data.summary.elevated_assets,
                  "requires engineering attention",
                  "text-amber-400",
                ],
                [
                  "Watch",
                  data.summary.watch_assets,
                  "requires continued monitoring",
                  "text-yellow-400",
                ],
                [
                  "Maintenance Events",
                  data.summary.maintenance_events,
                  "available historical events",
                  "text-zinc-100",
                ],
              ].map(([label, value, detail, valueClass]) => (
                <div
                  key={label}
                  className="rounded-2xl border border-zinc-800 bg-zinc-950 p-5"
                >
                  <div className="text-xs uppercase tracking-[0.16em] text-zinc-500">
                    {label}
                  </div>

                  <div className={`mt-3 text-3xl font-semibold ${valueClass}`}>
                    {value}
                  </div>

                  <div className="mt-1 text-xs text-zinc-600">
                    {detail}
                  </div>
                </div>
              ))}
            </section>

            {/* OPERATIONAL ATTENTION */}
            <section className="mt-6 rounded-3xl border border-zinc-800 bg-zinc-950 p-7">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <div className="text-xs uppercase tracking-[0.2em] text-zinc-500">
                    Operational Attention
                  </div>
                  <h2 className="mt-2 text-xl font-medium">
                    What Needs Attention Now
                  </h2>
                  <p className="mt-2 text-sm text-zinc-500">
                    Current sensor condition and analytical signals from the available operating window.
                  </p>
                </div>

                <div className="rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-[10px] uppercase tracking-wider text-amber-400">
                  Engineering Review
                </div>
              </div>

              {sensorReadings.length > 0 ? (
                <>
                  <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    {[
                      ["Vibration", `${sensorReadings[0].vibration ?? ""} mm/s`, "Current sensor reading"],
                      ["Temperature", `${sensorReadings[0].temperature ?? ""} C`],
                      ["Pressure", `${sensorReadings[0].pressure ?? ""} bar`, "Current sensor reading"],
                      ["Flow Rate", `${sensorReadings[0].flow_rate ?? ""} units`, "Current sensor reading"],
                    ].map(([label, value, detail]) => (
                      <div
                        key={label}
                        className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4"
                      >
                        <div className="text-[10px] uppercase tracking-[0.16em] text-zinc-600">
                          {label}
                        </div>
                        <div className="mt-2 text-2xl font-semibold text-zinc-100">
                          {value}
                        </div>
                        <div className="mt-1 text-xs text-zinc-600">
                          {detail}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-4 grid gap-4 lg:grid-cols-2">
                    <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-5">
                      <div className="text-[10px] uppercase tracking-[0.16em] text-amber-500">
                        Analytical Signal
                      </div>
                      <div className="mt-2 text-sm font-medium text-zinc-200">
                        Vibration increased across the available sensor window
                      </div>
                      <div className="mt-2 text-xs leading-5 text-zinc-500">
                        {sensorReadings.length > 1
                          ? `Observed change: ${(((Number(sensorReadings[0].vibration) - Number(sensorReadings[sensorReadings.length - 1].vibration)) / Number(sensorReadings[sensorReadings.length - 1].vibration)) * 100).toFixed(1)}%`
                          : "Insufficient readings to calculate a change."}
                      </div>
                    </div>

                    <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-5">
                      <div className="text-[10px] uppercase tracking-[0.16em] text-zinc-600">
                        Decision Support
                      </div>
                      <div className="mt-2 text-sm font-medium text-zinc-200">
                        Review C-104 mechanical condition
                      </div>
                      <div className="mt-2 text-xs leading-5 text-zinc-500">
                        The current dashboard combines sensor trends, risk analytics, and maintenance history. Outputs are for qualified engineering review and are not autonomous operating commands.
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="mt-6 rounded-xl border border-zinc-800 bg-zinc-900/40 p-5 text-sm text-zinc-500">
                  No sensor readings are currently available.
                </div>
              )}
            </section>
            <EventAlertPanel />

            {/* DECISION QUEUE */}
            <section className="mt-6 rounded-3xl border border-zinc-800 bg-zinc-950 p-7">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <div className="text-xs uppercase tracking-[0.2em] text-zinc-500">
                    Decision Queue
                  </div>
                  <h2 className="mt-2 text-xl font-medium">
                    Engineering Attention Queue
                  </h2>
                  <p className="mt-2 text-sm text-zinc-500">
                    Items surfaced from the current risk, sensor, and maintenance analysis.
                  </p>
                </div>

                <div className="text-xs text-zinc-600">
                  Human-reviewed decision support
                </div>
              </div>

              <div className="mt-6 grid gap-3 lg:grid-cols-3">
                <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase tracking-[0.16em] text-amber-500">
                      Attention 01
                    </span>
                    <span className="text-[10px] text-amber-400">
                      Elevated
                    </span>
                  </div>
                  <div className="mt-3 text-sm font-medium text-zinc-200">
                    Review C-104 mechanical condition
                  </div>
                  <div className="mt-2 text-xs leading-5 text-zinc-500">
                    Risk score is 78.4 and the available sensor window shows increasing vibration.
                  </div>
                </div>

                <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase tracking-[0.16em] text-zinc-600">
                      Attention 02
                    </span>
                    <span className="text-[10px] text-zinc-500">
                      Signal
                    </span>
                  </div>
                  <div className="mt-3 text-sm font-medium text-zinc-200">
                    Review drive-end bearing condition
                  </div>
                  <div className="mt-2 text-xs leading-5 text-zinc-500">
                    The available maintenance history contains bearing-related findings alongside the current vibration trend.
                  </div>
                </div>

                <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase tracking-[0.16em] text-zinc-600">
                      Attention 03
                    </span>
                    <span className="text-[10px] text-zinc-500">
                      Review
                    </span>
                  </div>
                  <div className="mt-3 text-sm font-medium text-zinc-200">
                    Review shaft alignment and mechanical condition
                  </div>
                  <div className="mt-2 text-xs leading-5 text-zinc-500">
                    Previous maintenance records and the current vibration signal provide a basis for engineering review.
                  </div>
                </div>
              </div>
            </section>
            {/* SENSOR TREND MONITOR */}
            <section className="mt-6 rounded-3xl border border-zinc-800 bg-zinc-950 p-7">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <div className="text-xs uppercase tracking-[0.2em] text-zinc-500">
                    Sensor Intelligence
                  </div>
                  <h2 className="mt-2 text-xl font-medium">
                    Sensor Trend Monitor
                  </h2>
                  <p className="mt-2 text-sm text-zinc-500">
                    Observed movement across the available C-104 sensor window.
                  </p>
                </div>

                <div className="text-xs text-zinc-600">
                  {trendData.length} observations
                </div>
              </div>

              {trendData.length > 0 ? (
                <div className="mt-6 grid gap-4 lg:grid-cols-2">
                  {[
                    {
                      key: "vibration",
                      label: "Vibration",
                      unit: "mm/s",
                      dataKey: "vibration",
                    },
                    {
                      key: "temperature",
                      label: "Temperature",
                      unit: "C",
                      dataKey: "temperature",
                    },
                    {
                      key: "pressure",
                      label: "Pressure",
                      unit: "bar",
                      dataKey: "pressure",
                    },
                    {
                      key: "flow_rate",
                      label: "Flow Rate",
                      unit: "units",
                      dataKey: "flow_rate",
                    },
                  ].map((metric) => (
                    <div
                      key={metric.key}
                      className="rounded-2xl border border-zinc-800 bg-zinc-900/30 p-4"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-[10px] uppercase tracking-[0.16em] text-zinc-600">
                            {metric.label}
                          </div>
                          <div className="mt-1 text-xs text-zinc-500">
                            Current:{" "}
                            {Number(
                              trendData[trendData.length - 1][metric.dataKey as keyof typeof trendData[number]]
                            ).toFixed(1)}{" "}
                            {metric.unit}
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 h-48">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={trendData}>
                            <CartesianGrid
                              strokeDasharray="3 3"
                              stroke="#27272a"
                              vertical={false}
                            />
                            <XAxis
                              dataKey="time"
                              tick={{ fill: "#71717a", fontSize: 10 }}
                              axisLine={{ stroke: "#27272a" }}
                              tickLine={false}
                            />
                            <YAxis
                              tick={{ fill: "#71717a", fontSize: 10 }}
                              axisLine={false}
                              tickLine={false}
                              width={45}
                            />
                            <Tooltip
                              contentStyle={{
                                backgroundColor: "#09090b",
                                border: "1px solid #27272a",
                                borderRadius: "10px",
                                color: "#e4e4e7",
                                fontSize: "12px",
                              }}
                              formatter={(value) => [
                                `${Number(value).toFixed(1)} ${metric.unit}`,
                                metric.label,
                              ]}
                            />
                            <Line
                              type="monotone"
                              dataKey={metric.dataKey}
                              stroke="#f59e0b"
                              strokeWidth={2}
                              dot={{ r: 3, fill: "#f59e0b" }}
                              activeDot={{ r: 5 }}
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="mt-6 rounded-xl border border-zinc-800 bg-zinc-900/40 p-5 text-sm text-zinc-500">
                  No sensor trend data is currently available.
                </div>
              )}

              <div className="mt-5 rounded-xl border border-zinc-800 bg-zinc-900/20 p-4 text-xs leading-5 text-zinc-600">
                Observed sensor trends are displayed as decision-support information. No OEM alarm limits, safety thresholds, or autonomous operating decisions are inferred from this visualization.
              </div>
            </section>
            {/* RISK PROFILE + HIGHEST RISK */}
            <section className="mt-6 grid gap-6 lg:grid-cols-2">
              <div className="rounded-3xl border border-zinc-800 bg-zinc-950 p-7">
                <div className="text-xs uppercase tracking-[0.2em] text-zinc-500">
                  Risk Distribution
                </div>

                <h2 className="mt-2 text-xl font-medium">
                  Portfolio Risk Profile
                </h2>

                <div className="mt-7 space-y-5">
                  {[
                    ["Critical", data.summary.critical_assets, "bg-red-500"],
                    ["Elevated", data.summary.elevated_assets, "bg-amber-500"],
                    ["Watch", data.summary.watch_assets, "bg-yellow-500"],
                    ["Normal", data.summary.normal_assets, "bg-emerald-500"],
                  ].map(([label, value, bar]) => {
                    const count = Number(value);
                    const total = data.summary.total_assets;
                    const width =
                      total > 0 ? (count / total) * 100 : 0;

                    return (
                      <div key={label}>
                        <div className="mb-2 flex justify-between text-sm">
                          <span className="text-zinc-300">{label}</span>
                          <span className="font-semibold text-zinc-200">
                            {count}
                          </span>
                        </div>

                        <div className="h-2 rounded-full bg-zinc-900">
                          <div
                            className={`h-2 rounded-full ${bar}`}
                            style={{
                              width:
                                count > 0
                                  ? `${Math.max(width, 6)}%`
                                  : "0%",
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="rounded-3xl border border-zinc-800 bg-zinc-950 p-7">
                <div className="text-xs uppercase tracking-[0.2em] text-zinc-500">
                  Highest Risk Asset
                </div>

                {highestRiskAsset ? (
                  <div className="mt-5">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="text-2xl font-semibold">
                          {highestRiskAsset.equipment_id}
                        </div>

                        <div className="mt-1 text-sm text-zinc-500">
                          {highestRiskAsset.equipment_name}
                        </div>

                        <div className="mt-1 text-xs text-zinc-600">
                          {highestRiskAsset.facility} |{" "}
                          {highestRiskAsset.equipment_type}
                        </div>
                      </div>

                      <span
                        className={`rounded-full border px-3 py-1 text-[10px] uppercase tracking-wider ${riskBadge(
                          highestRiskAsset.risk_level
                        )}`}
                      >
                        {highestRiskAsset.risk_level}
                      </span>
                    </div>

                    <div className="mt-6 flex items-end gap-2">
                      <span className="text-5xl font-semibold">
                        {highestRiskAsset.risk_score.toFixed(1)}
                      </span>

                      <span className="pb-2 text-sm text-zinc-600">
                        / 100
                      </span>
                    </div>

                    <div className="mt-4 h-2 rounded-full bg-zinc-900">
                      <div
                        className={`h-2 rounded-full ${riskBar(
                          highestRiskAsset.risk_level
                        )}`}
                        style={{
                          width: `${Math.min(
                            highestRiskAsset.risk_score,
                            100
                          )}%`,
                        }}
                      />
                    </div>

                    <div className="mt-5 rounded-xl border border-zinc-800 bg-zinc-900/40 p-4">
                      <div className="text-[10px] uppercase tracking-[0.16em] text-zinc-600">
                        Primary Engineering Concern
                      </div>

                      <div className="mt-2 text-sm font-medium text-zinc-300">
                        {highestRiskAsset.top_failure_mode ||
                          "No primary concern identified"}
                      </div>

                      {highestRiskAsset.top_failure_confidence && (
                        <div className="mt-1 text-xs text-zinc-600">
                          {highestRiskAsset.top_failure_confidence} confidence
                        </div>
                      )}
                    </div>

                    <a
                      href="/assets"
                      className="mt-5 inline-flex rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-2.5 text-xs font-medium text-zinc-200 hover:bg-zinc-800"
                    >
                      Open Asset Intelligence &gt;
                    </a>
                  </div>
                ) : (
                  <div className="mt-6 text-sm text-zinc-500">
                    No assets are currently available.
                  </div>
                )}
              </div>
            </section>

            {/* ASSET RISK */}
            <section className="mt-6 rounded-3xl border border-zinc-800 bg-zinc-950 p-7">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <div className="text-xs uppercase tracking-[0.2em] text-zinc-500">
                    Asset Risk
                  </div>

                  <h2 className="mt-2 text-xl font-medium">
                    Operational Risk Overview
                  </h2>
                </div>

                <div className="text-xs text-zinc-600">
                  Sorted by risk score
                </div>
              </div>

              <div className="mt-6 overflow-x-auto">
                <table className="w-full min-w-[760px]">
                  <thead>
                    <tr className="border-b border-zinc-800 text-left text-[10px] uppercase tracking-[0.16em] text-zinc-600">
                      <th className="pb-3 pr-4">Asset</th>
                      <th className="pb-3 pr-4">Facility</th>
                      <th className="pb-3 pr-4">Type</th>
                      <th className="pb-3 pr-4">Risk</th>
                      <th className="pb-3 pr-4">Status</th>
                      <th className="pb-3">Primary Concern</th>
                    </tr>
                  </thead>

                  <tbody>
                    {data.assets.map((asset) => (
                      <tr
                        key={asset.equipment_id}
                        className="border-b border-zinc-900 hover:bg-zinc-900/40"
                      >
                        <td className="py-4 pr-4">
                          <a href="/assets" className="group">
                            <div className="font-medium text-zinc-200 group-hover:text-white">
                              {asset.equipment_id}
                            </div>

                            <div className="mt-1 text-xs text-zinc-600">
                              {asset.equipment_name}
                            </div>
                          </a>
                        </td>

                        <td className="py-4 pr-4 text-sm text-zinc-400">
                          {asset.facility}
                        </td>

                        <td className="py-4 pr-4 text-sm text-zinc-500">
                          {asset.equipment_type}
                        </td>

                        <td className="py-4 pr-4">
                          <div className="flex items-center gap-3">
                            <div className="w-20">
                              <div className="h-1.5 rounded-full bg-zinc-800">
                                <div
                                  className={`h-1.5 rounded-full ${riskBar(
                                    asset.risk_level
                                  )}`}
                                  style={{
                                    width: `${Math.min(
                                      asset.risk_score,
                                      100
                                    )}%`,
                                  }}
                                />
                              </div>
                            </div>

                            <span className="text-sm font-semibold">
                              {asset.risk_score.toFixed(1)}
                            </span>
                          </div>

                          <span
                            className={`mt-1 inline-flex rounded-full border px-2 py-0.5 text-[9px] uppercase tracking-wider ${riskBadge(
                              asset.risk_level
                            )}`}
                          >
                            {asset.risk_level}
                          </span>
                        </td>

                        <td className="py-4 pr-4 text-sm text-zinc-400">
                          {asset.status}
                        </td>

                        <td className="py-4">
                          <div className="max-w-[240px] text-sm text-zinc-300">
                            {asset.top_failure_mode ||
                              "No primary concern identified"}
                          </div>

                          {asset.top_failure_confidence && (
                            <div className="mt-1 text-[10px] uppercase tracking-wider text-zinc-600">
                              {asset.top_failure_confidence} confidence
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            {/* ENGINEERING CONCERNS */}
            <section className="mt-6 rounded-3xl border border-zinc-800 bg-zinc-950 p-7">
              <div className="text-xs uppercase tracking-[0.2em] text-zinc-500">
                Engineering Intelligence
              </div>

              <h2 className="mt-2 text-xl font-medium">
                Top Engineering Concerns
              </h2>

              <p className="mt-2 text-sm text-zinc-500">
                Highest-ranked failure-mode hypotheses across the available
                asset set.
              </p>

              <div className="mt-6 grid gap-3 md:grid-cols-2">
                {data.engineering_concerns.length > 0 ? (
                  data.engineering_concerns.map((concern, index) => (
                    <div
                      key={concern.name}
                      className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full border border-zinc-800 bg-zinc-950 text-xs text-zinc-500">
                          {String(index + 1).padStart(2, "0")}
                        </div>

                        <div>
                          <div className="text-sm font-medium text-zinc-300">
                            {concern.name}
                          </div>

                          <div className="mt-1 text-xs text-zinc-600">
                            {concern.asset_count}{" "}
                            {concern.asset_count === 1
                              ? "asset"
                              : "assets"}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-5 text-sm text-zinc-500">
                    No engineering concerns are currently identified.
                  </div>
                )}
              </div>
            </section>

            {/* MAINTENANCE ACTIVITY */}
            <section className="mt-6 rounded-3xl border border-zinc-800 bg-zinc-950 p-7">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <div className="text-xs uppercase tracking-[0.2em] text-zinc-500">
                    Maintenance Activity
                  </div>

                  <h2 className="mt-2 text-xl font-medium">
                    Recent Maintenance History
                  </h2>
                </div>

                <div className="text-xs text-zinc-600">
                  {data.summary.maintenance_events} available events
                </div>
              </div>

              {maintenanceEvents.length > 0 ? (
                <div className="mt-6 grid gap-3 md:grid-cols-2">
                  {maintenanceEvents.map((event, index) => (
                    <div
                      key={`${event.event_type || "event"}-${index}`}
                      className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <div className="text-sm font-medium text-zinc-200">
                            {event.event_type || "Maintenance Event"}
                          </div>

                          <div className="mt-1 text-xs text-zinc-600">
                            {maintenanceDate(event)}
                          </div>
                        </div>

                        <span className="rounded-full border border-zinc-800 bg-zinc-950 px-2 py-1 text-[9px] uppercase tracking-wider text-zinc-600">
                          C-104
                        </span>
                      </div>

                      <p className="mt-3 text-xs leading-5 text-zinc-500">
                        {event.description ||
                          "No event description available."}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="mt-6 rounded-xl border border-zinc-800 bg-zinc-900/40 p-5 text-sm text-zinc-500">
                  Maintenance detail is not currently available.
                </div>
              )}
            </section>

            {/* DECISION WORKFLOW + OPERATING MODE */}
            <section className="mt-6 grid gap-6 lg:grid-cols-2">
              <div className="rounded-3xl border border-zinc-800 bg-zinc-950 p-7">
                <div className="text-xs uppercase tracking-[0.2em] text-zinc-500">
                  Decision Workflow
                </div>

                <h2 className="mt-2 text-xl font-medium">
                  From Signal to Action
                </h2>

                <div className="mt-6 grid gap-3 sm:grid-cols-4">
                  {[
                    ["01", "Observe", "Sensor and maintenance signals"],
                    ["02", "Assess", "Quantitative risk scoring"],
                    ["03", "Diagnose", "Failure-mode hypotheses"],
                    ["04", "Review", "Engineering decision support"],
                  ].map(([number, title, description]) => (
                    <div
                      key={number}
                      className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4"
                    >
                      <div className="text-xs text-amber-500">
                        {number}
                      </div>

                      <div className="mt-3 text-sm font-medium text-zinc-200">
                        {title}
                      </div>

                      <div className="mt-1 text-xs leading-5 text-zinc-600">
                        {description}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-3xl border border-zinc-800 bg-zinc-950 p-7">
                <div className="text-xs uppercase tracking-[0.2em] text-zinc-500">
                  Operating Mode
                </div>

                <div className="mt-4 flex items-center gap-3">
                  <div className="rounded-full border border-emerald-900 bg-emerald-950/40 px-3 py-1 text-xs text-emerald-400">
                    Read-only
                  </div>

                  <span className="text-sm text-zinc-500">
                    Human-reviewed decision support
                  </span>
                </div>

                <p className="mt-5 text-sm leading-6 text-zinc-500">
                  {data.method}
                </p>

                <div className="mt-5 rounded-xl border border-zinc-800 bg-zinc-900/40 p-4 text-xs leading-5 text-zinc-600">
                  Risk scores and failure-mode classifications are analytics
                  outputs for decision support. They are not OEM alarm limits,
                  safety thresholds, calibrated probabilities, or autonomous
                  operating commands.
                </div>
              </div>
            </section>

            {/* FOOTER ACTIONS */}
            <section className="mt-6 grid gap-4 sm:grid-cols-2">
              <a
                href="/assets"
                className="rounded-2xl border border-zinc-800 bg-zinc-950 p-6 hover:border-zinc-700 hover:bg-zinc-900/60"
              >
                <div className="text-xs uppercase tracking-[0.18em] text-zinc-600">
                  Asset Intelligence
                </div>

                <div className="mt-2 text-lg font-medium text-zinc-200">
                  Open FieldFlow &gt;
                </div>

                <div className="mt-1 text-sm text-zinc-500">
                  Investigate individual equipment, sensor trends, failure
                  modes and maintenance recommendations.
                </div>
              </a>

              <button
                onClick={() => loadOverview(true)}
                className="rounded-2xl border border-zinc-800 bg-zinc-950 p-6 text-left hover:border-zinc-700 hover:bg-zinc-900/60"
              >
                <div className="text-xs uppercase tracking-[0.18em] text-zinc-600">
                  Live Data
                </div>

                <div className="mt-2 text-lg font-medium text-zinc-200">
                  Refresh Operations Data &gt;
                </div>

                <div className="mt-1 text-sm text-zinc-500">
                  Re-run the read-only operations aggregation.
                </div>
              </button>
            </section>
          </>
        )}
      </div>
    </main>
  );
}

















