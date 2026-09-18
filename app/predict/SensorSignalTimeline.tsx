"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type SensorReading = {
  id: number;
  equipment_id: string;
  timestamp: string;
  temperature: number;
  pressure: number;
  vibration: number;
  rpm: number;
  flow_rate: number;
};

type MaintenanceEvent = {
  id: number;
  equipment_id: string;
  event_date: string;
  event_type: string;
  description: string;
  downtime_hours: number;
  cost: number;
};

type MetricKey =
  | "vibration"
  | "temperature"
  | "pressure"
  | "flow_rate"
  | "rpm";

const METRICS: {
  key: MetricKey;
  label: string;
  unit: string;
}[] = [
  {
    key: "vibration",
    label: "Vibration",
    unit: "mm/s",
  },
  {
    key: "temperature",
    label: "Temperature",
    unit: "C",
  },
  {
    key: "pressure",
    label: "Pressure",
    unit: "bar",
  },
  {
    key: "flow_rate",
    label: "Flow",
    unit: "units",
  },
  {
    key: "rpm",
    label: "RPM",
    unit: "rpm",
  },
];

export default function SensorSignalTimeline() {
  const [readings, setReadings] = useState<SensorReading[]>([]);
  const [maintenance, setMaintenance] = useState<
    MaintenanceEvent[]
  >([]);
  const [metric, setMetric] =
    useState<MetricKey>("vibration");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadEquipmentData() {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(
          "${process.env.NEXT_PUBLIC_API_URL}/equipment/C-104/intelligence"
        );

        if (!response.ok) {
          throw new Error(
            "Unable to load C-104 equipment history."
          );
        }

        const data = await response.json();

        setReadings(data.sensor_readings ?? []);
        setMaintenance(data.maintenance ?? []);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Unable to load equipment history."
        );
      } finally {
        setLoading(false);
      }
    }

    loadEquipmentData();
  }, []);

  const chartData = useMemo(() => {
    return [...readings]
      .sort(
        (a, b) =>
          new Date(a.timestamp).getTime() -
          new Date(b.timestamp).getTime()
      )
      .map((reading) => ({
        ...reading,
        time: new Date(
          reading.timestamp
        ).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      }));
  }, [readings]);

  const sortedMaintenance = useMemo(() => {
    return [...maintenance].sort(
      (a, b) =>
        new Date(a.event_date).getTime() -
        new Date(b.event_date).getTime()
    );
  }, [maintenance]);

  const selectedMetric = METRICS.find(
    (item) => item.key === metric
  );

  const latestReading =
    chartData.length > 0
      ? chartData[chartData.length - 1]
      : null;

  const firstReading =
    chartData.length > 0
      ? chartData[0]
      : null;

  const change =
    firstReading && latestReading
      ? Number(
          (
            ((latestReading[metric] -
              firstReading[metric]) /
              Math.abs(firstReading[metric])) *
            100
          ).toFixed(2)
        )
      : null;

  if (loading) {
    return (
      <section className="mt-10">
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
          <p className="text-sm text-slate-500">
            Loading C-104 sensor history...
          </p>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="mt-10">
        <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-6">
          <h2 className="text-lg font-semibold">
            Sensor Signal Timeline
          </h2>

          <p className="mt-2 text-sm text-red-300">
            {error}
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="mt-10">

      <div>
        <div className="text-xs font-medium uppercase tracking-wider text-cyan-400">
          Time-Series Intelligence
        </div>

        <h2 className="mt-1 text-2xl font-semibold">
          C-104 Sensor Signal Timeline
        </h2>

        <p className="mt-1 text-sm text-slate-500">
          Observed sensor readings from the available C-104
          operating history.
        </p>
      </div>

      {/* METRIC SELECTOR */}

      <div className="mt-5 flex flex-wrap gap-2">

        {METRICS.map((item) => (
          <button
            key={item.key}
            onClick={() => setMetric(item.key)}
            className={`rounded-lg border px-4 py-2 text-sm font-medium transition ${
              metric === item.key
                ? "border-cyan-500/50 bg-cyan-500/10 text-cyan-300"
                : "border-slate-700 text-slate-400 hover:bg-slate-900"
            }`}
          >
            {item.label}
          </button>
        ))}

      </div>

      {/* CURRENT SIGNAL */}

      <div className="mt-5 grid gap-4 md:grid-cols-3">

        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
          <div className="text-sm text-slate-500">
            Selected Signal
          </div>

          <div className="mt-2 text-xl font-semibold">
            {selectedMetric?.label}
          </div>

          <div className="mt-1 text-xs text-slate-500">
            {selectedMetric?.unit}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
          <div className="text-sm text-slate-500">
            Latest Reading
          </div>

          <div className="mt-2 text-2xl font-bold">
            {latestReading
              ? latestReading[metric]
              : ""}
          </div>

          <div className="mt-1 text-xs text-slate-500">
            {selectedMetric?.unit}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
          <div className="text-sm text-slate-500">
            First  Latest
          </div>

          <div className="mt-2 text-2xl font-bold">
            {change !== null
              ? `${change > 0 ? "+" : ""}${change}%`
              : ""}
          </div>

          <div className="mt-1 text-xs text-slate-500">
            Change across available readings
          </div>
        </div>

      </div>

      {/* SENSOR CHART */}

      <div className="mt-5 rounded-2xl border border-slate-800 bg-slate-900 p-6">

        <div className="flex flex-col gap-1 md:flex-row md:items-end md:justify-between">

          <div>
            <h3 className="text-lg font-semibold">
              {selectedMetric?.label} Trend
            </h3>

            <p className="text-xs text-slate-500">
              {chartData.length} observed readings
            </p>
          </div>

          <div className="text-xs text-slate-500">
            C-104  Main Gas Compressor
          </div>

        </div>

        <div className="mt-6 h-[360px] w-full">

          <ResponsiveContainer
            width="100%"
            height="100%"
          >
            <LineChart
              data={chartData}
              margin={{
                top: 10,
                right: 20,
                left: 0,
                bottom: 5,
              }}
            >

              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#1e293b"
              />

              <XAxis
                dataKey="time"
                tick={{
                  fill: "#64748b",
                  fontSize: 11,
                }}
                axisLine={{
                  stroke: "#334155",
                }}
                tickLine={false}
              />

              <YAxis
                tick={{
                  fill: "#64748b",
                  fontSize: 11,
                }}
                axisLine={false}
                tickLine={false}
              />

              <Tooltip
                contentStyle={{
                  backgroundColor: "#0f172a",
                  border: "1px solid #334155",
                  borderRadius: "10px",
                  color: "#e2e8f0",
                }}
                labelStyle={{
                  color: "#94a3b8",
                }}
                formatter={(value) => [
                  `${value} ${selectedMetric?.unit ?? ""}`,
                  selectedMetric?.label ?? "Signal",
                ]}
              />

              <Legend />

              <Line
                type="monotone"
                dataKey={metric}
                name={selectedMetric?.label}
                stroke="#22d3ee"
                strokeWidth={3}
                dot={{
                  r: 4,
                  fill: "#22d3ee",
                  strokeWidth: 0,
                }}
                activeDot={{
                  r: 6,
                }}
              />

            </LineChart>
          </ResponsiveContainer>

        </div>

      </div>

      {/* MAINTENANCE CONTEXT */}

      <div className="mt-5 rounded-2xl border border-slate-800 bg-slate-900 p-6">

        <div className="flex flex-col gap-1 md:flex-row md:items-end md:justify-between">

          <div>
            <div className="text-xs font-medium uppercase tracking-wider text-slate-500">
              Historical Context
            </div>

            <h3 className="mt-1 text-lg font-semibold">
              Maintenance Activity
            </h3>
          </div>

          <div className="text-xs text-slate-500">
            {maintenance.length} recorded events
          </div>

        </div>

        <div className="mt-4 rounded-xl border border-slate-800 bg-slate-950/60 p-4">

          <p className="text-xs leading-5 text-slate-500">
            Maintenance history is shown separately because
            the recorded maintenance dates precede the currently
            available sensor window. No maintenance event falls
            within the five-hour sensor period displayed above.
          </p>

        </div>

        <div className="mt-5 space-y-3">

          {sortedMaintenance.map((event) => (
            <div
              key={event.id}
              className="rounded-xl border border-slate-800 bg-slate-950/50 p-4"
            >

              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">

                <div className="min-w-0">

                  <div className="flex flex-wrap items-center gap-3">

                    <span className="text-sm font-semibold text-slate-200">
                      {event.event_type}
                    </span>

                    <span className="text-xs text-slate-500">
                      {event.event_date}
                    </span>

                  </div>

                  <p className="mt-2 text-sm leading-6 text-slate-400">
                    {event.description}
                  </p>

                </div>

                <div className="shrink-0 text-left md:text-right">

                  <div className="text-xs text-slate-500">
                    Downtime
                  </div>

                  <div className="mt-1 text-sm font-medium text-slate-300">
                    {event.downtime_hours} hours
                  </div>

                  <div className="mt-2 text-xs text-slate-500">
                    Recorded cost
                  </div>

                  <div className="mt-1 text-sm font-medium text-slate-300">
                    {event.cost.toLocaleString()}
                  </div>

                </div>

              </div>

            </div>
          ))}

        </div>

      </div>

      {/* DATA NOTE */}

      <div className="mt-4 rounded-xl border border-slate-800 bg-slate-950/60 p-4">

        <p className="text-xs leading-5 text-slate-500">
          Sensor visualization displays observed C-104 readings
          available through the equipment intelligence API.
          Maintenance entries are historical records and are not
          treated as sensor-window events. This descriptive view
          does not by itself establish an alarm threshold, failure
          event, or remaining useful life.
        </p>

      </div>

    </section>
  );
}




