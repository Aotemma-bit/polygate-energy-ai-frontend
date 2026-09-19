"use client";

import { useEffect, useMemo, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

type Signal = {
  name: string;
  change_percent: number | null;
  direction: string;
  severity: string;
  interpretation: string;
};

type TimelinePoint = {
  timestamp: string;
  vibration: number;
  temperature: number;
  flow_rate: number;
  pressure: number;
};

type PredictionResponse = {
  status: string;
  prediction_mode: string;
  confidence: string;
  prediction_horizon: string;
  anomaly_index: number;
  signals: Signal[];
  timeline: TimelinePoint[];
  observations: {
    vibration_change_percent: number;
    temperature_change_percent: number;
    flow_change_percent: number;
    pressure_change_percent: number;
  };
  method: string;
};

export default function PredictPage() {
  const [data, setData] = useState<PredictionResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadPrediction() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/equipment/C-104/predict`,
        { cache: "no-store" }
      );

      if (!response.ok) {
        throw new Error("Prediction endpoint failed.");
      }

      const result = await response.json();

      if (result.error) {
        throw new Error(result.error);
      }

      setData(result);
    } catch {
      setError(
        "Unable to load Polygate Predict. Confirm that the backend is running and the /predict endpoint has been added."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadPrediction();
  }, []);

  const chartData = useMemo(() => {
    if (!data) return [];

    return data.timeline.map((point) => ({
      time: new Date(point.timestamp).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
      vibration: point.vibration,
      temperature: point.temperature,
      flow: point.flow_rate,
      pressure: point.pressure,
    }));
  }, [data]);

  return (
    <main className="min-h-screen bg-[#07090c] text-white">
      <div className="mx-auto max-w-7xl px-6 py-10">
        <header className="mb-10 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="text-xs font-semibold tracking-[0.25em] text-zinc-500">
              POLYGATE ENERGY AI
            </div>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight">
              Polygate Predict
            </h1>
            <p className="mt-2 text-sm text-zinc-400">
              Predictive maintenance intelligence
            </p>
          </div>

          <div className="flex gap-3">
            <a
              href="/operations"
              className="rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-2.5 text-xs text-zinc-300 hover:bg-zinc-900"
            >
              Operations
            </a>
            <a
              href="/fieldflow"
              className="rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-2.5 text-xs text-zinc-300 hover:bg-zinc-900"
            >
              FieldFlow
            </a>
          </div>
        </header>

        {loading && (
          <div className="rounded-3xl border border-zinc-800 bg-zinc-950 p-10 text-center text-sm text-zinc-500">
            Running predictive trend analysis...
          </div>
        )}

        {error && (
          <div className="rounded-3xl border border-red-900 bg-red-950/30 p-6 text-sm text-red-300">
            {error}
            <button
              onClick={loadPrediction}
              className="ml-4 rounded-lg border border-red-900 px-3 py-1.5 text-xs"
            >
              Retry
            </button>
          </div>
        )}

        {data && !loading && !error && (
          <>
            <section className="grid gap-4 md:grid-cols-4">
              <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-5">
                <div className="text-xs uppercase tracking-[0.16em] text-zinc-500">
                  Asset
                </div>
                <div className="mt-3 text-2xl font-semibold">C-104</div>
                <div className="mt-1 text-xs text-zinc-600">
                  Main Gas Compressor
                </div>
              </div>

              <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-5">
                <div className="text-xs uppercase tracking-[0.16em] text-zinc-500">
                  Trend Signal
                </div>
                <div className="mt-3 text-2xl font-semibold text-amber-400">
                  {data.anomaly_index.toFixed(1)}
                </div>
                <div className="mt-1 text-xs text-zinc-600">
                  transparent anomaly index
                </div>
              </div>

              <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-5">
                <div className="text-xs uppercase tracking-[0.16em] text-zinc-500">
                  Signal State
                </div>
                <div className="mt-3 text-xl font-semibold">
                  {data.status}
                </div>
                <div className="mt-1 text-xs text-zinc-600">
                  {data.confidence}
                </div>
              </div>

              <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-5">
                <div className="text-xs uppercase tracking-[0.16em] text-zinc-500">
                  Horizon
                </div>
                <div className="mt-3 text-xl font-semibold">
                  {data.prediction_horizon}
                </div>
                <div className="mt-1 text-xs text-zinc-600">
                  not a failure date
                </div>
              </div>
            </section>

            <section className="mt-6 rounded-3xl border border-zinc-800 bg-zinc-950 p-7">
              <div className="text-xs uppercase tracking-[0.2em] text-zinc-500">
                Predictive Signal
              </div>
              <h2 className="mt-2 text-xl font-medium">
                C-104 Condition Trajectory
              </h2>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-zinc-500">
                This prototype identifies changing sensor behavior that may
                deserve predictive-maintenance review. It does not claim a
                calibrated probability of failure.
              </p>

              <div className="mt-7 grid gap-6 lg:grid-cols-2">
                <div className="rounded-2xl border border-zinc-800 bg-zinc-900/30 p-5">
                  <div className="mb-4 text-sm font-medium">Vibration</div>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={chartData}>
                        <CartesianGrid stroke="#27272a" strokeDasharray="3 3" />
                        <XAxis dataKey="time" stroke="#71717a" />
                        <YAxis stroke="#71717a" />
                        <Tooltip />
                        <Line
                          type="monotone"
                          dataKey="vibration"
                          stroke="#f59e0b"
                          strokeWidth={2}
                          dot={{ r: 3 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="rounded-2xl border border-zinc-800 bg-zinc-900/30 p-5">
                  <div className="mb-4 text-sm font-medium">Temperature</div>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={chartData}>
                        <CartesianGrid stroke="#27272a" strokeDasharray="3 3" />
                        <XAxis dataKey="time" stroke="#71717a" />
                        <YAxis stroke="#71717a" />
                        <Tooltip />
                        <Line
                          type="monotone"
                          dataKey="temperature"
                          stroke="#f59e0b"
                          strokeWidth={2}
                          dot={{ r: 3 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </section>

            <section className="mt-6 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
              <div className="rounded-3xl border border-zinc-800 bg-zinc-950 p-7">
                <div className="text-xs uppercase tracking-[0.2em] text-zinc-500">
                  Predictive Signals
                </div>
                <h2 className="mt-2 text-xl font-medium">
                  What the model sees
                </h2>

                <div className="mt-6 space-y-3">
                  {data.signals.map((signal) => (
                    <div
                      key={signal.name}
                      className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4"
                    >
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <div className="text-sm font-medium text-zinc-200">
                            {signal.name}
                          </div>
                          <div className="mt-1 text-xs text-zinc-600">
                            {signal.direction}
                            {signal.change_percent !== null
                              ? ` Ã‚Â· ${signal.change_percent}%`
                              : ""}
                          </div>
                        </div>

                        <span className="rounded-full border border-amber-900 bg-amber-950/30 px-2 py-1 text-[9px] uppercase tracking-wider text-amber-400">
                          {signal.severity}
                        </span>
                      </div>

                      <p className="mt-3 text-xs leading-5 text-zinc-500">
                        {signal.interpretation}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-3xl border border-zinc-800 bg-zinc-950 p-7">
                <div className="text-xs uppercase tracking-[0.2em] text-zinc-500">
                  Model Readout
                </div>

                <div className="mt-5 space-y-4">
                  {[
                    ["Vibration", data.observations.vibration_change_percent, "rising"],
                    ["Temperature", data.observations.temperature_change_percent, "rising"],
                    ["Flow", Math.abs(data.observations.flow_change_percent), "declining"],
                    ["Pressure", Math.abs(data.observations.pressure_change_percent), "declining"],
                  ].map(([name, value, direction]) => (
                    <div
                      key={name}
                      className="flex items-center justify-between border-b border-zinc-900 pb-3"
                    >
                      <span className="text-sm text-zinc-400">{name}</span>
                      <span className="text-sm font-semibold text-zinc-200">
                        {Number(value).toFixed(1)}% {direction}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="mt-6 rounded-xl border border-zinc-800 bg-zinc-900/40 p-4 text-xs leading-5 text-zinc-600">
                  {data.method}
                </div>
              </div>
            </section>

            <section className="mt-6 rounded-3xl border border-zinc-800 bg-zinc-950 p-7">
              <div className="text-xs uppercase tracking-[0.2em] text-zinc-500">
                Next Model Stage
              </div>

              <h2 className="mt-2 text-xl font-medium">
                From Trend Detection to Validated Prediction
              </h2>

              <div className="mt-6 grid gap-3 md:grid-cols-4">
                {[
                  ["01", "Collect", "Build larger time-series history"],
                  ["02", "Train", "Train against labeled maintenance outcomes"],
                  ["03", "Validate", "Measure precision, recall and calibration"],
                  ["04", "Predict", "Deploy validated failure-risk estimates"],
                ].map(([number, title, description]) => (
                  <div
                    key={number}
                    className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4"
                  >
                    <div className="text-xs text-amber-500">{number}</div>
                    <div className="mt-3 text-sm font-medium text-zinc-200">
                      {title}
                    </div>
                    <div className="mt-1 text-xs leading-5 text-zinc-600">
                      {description}
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <div className="mt-6 flex justify-end">
              <button
                onClick={loadPrediction}
                className="rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-2.5 text-xs text-zinc-300 hover:bg-zinc-900"
              >
                Refresh Prediction Data Ã¢â€ Â»
              </button>
            </div>
          </>
        )}
      </div>
    </main>
  );
}

