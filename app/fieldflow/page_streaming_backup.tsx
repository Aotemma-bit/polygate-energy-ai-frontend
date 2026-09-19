"use client";

import { useEffect, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
type Source = {
  filename: string;
  page: number;
  similarity: number;
};

type FieldFlowResponse = {
  question: string;
  answer: string;
  sources: Source[];
  error?: string;
};

type Equipment = {
  id: number;
  equipment_id: string;
  equipment_name: string;
  equipment_type: string;
  facility: string;
  manufacturer: string;
  installation_date: string | null;
  status: string;
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

type EquipmentIntelligence = {
  equipment: Equipment;
  maintenance: MaintenanceEvent[];
  sensor_readings: SensorReading[];
};

type EquipmentAnalysisResponse = {
  equipment_id: string;
  question: string;
  answer: string;
  sources: Source[];
};

type RiskSignal = {
  name: string;
  status: string;
  change_percent?: number;
  events?: number;
  direction: string;
};

type RiskComponent = {
  name: string;
  points: number;
  max_points: number;
};

type EquipmentRisk = {
  equipment_id: string;
  equipment_name: string;
  score: number;
  level: string;
  label: string;
  signals: RiskSignal[];
  components: RiskComponent[];
  observations: {
    vibration_change_percent: number;
    temperature_change_percent: number;
    flow_change_percent: number;
    pressure_change_percent: number;
  };
  method: string;
};

type FailureMode = {
  name: string;
  confidence: string;
  evidence: string[];
  observed_signals: string[];
  engineering_note: string;
};

type FailureModeResponse = {
  equipment_id: string;
  equipment_name: string;
  status: string;
  failure_modes: FailureMode[];
  observations: {
    vibration_change_percent: number;
    temperature_change_percent: number;
    flow_change_percent: number;
    pressure_change_percent: number;
  };
  method: string;
};

type MaintenanceRecommendation = {
  priority: number;
  action: string;
  category: string;
  trigger: string[];
  recommended_review: string[];
  reason: string;
  requires_engineer_review: boolean;
};

type MaintenanceRecommendationResponse = {
  equipment_id: string;
  equipment_name: string;
  status: string;
  recommendations: MaintenanceRecommendation[];
  observations: {
    vibration_change_percent: number;
    temperature_change_percent: number;
    flow_change_percent: number;
    pressure_change_percent: number;
  };
  method: string;
};

export default function FieldFlowPage() {
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [response, setResponse] =
    useState<FieldFlowResponse | null>(null);

  const [equipment, setEquipment] =
    useState<EquipmentIntelligence | null>(null);

  const [equipmentLoading, setEquipmentLoading] = useState(true);
  const [equipmentError, setEquipmentError] = useState("");

  const [equipmentAnalysis, setEquipmentAnalysis] =
    useState<EquipmentAnalysisResponse | null>(null);

  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [analysisError, setAnalysisError] = useState("");

  const [risk, setRisk] = useState<EquipmentRisk | null>(null);
  const [riskLoading, setRiskLoading] = useState(true);
  const [riskError, setRiskError] = useState("");

  const [failureModes, setFailureModes] =
    useState<FailureModeResponse | null>(null);
  const [failureModesLoading, setFailureModesLoading] = useState(true);
  const [failureModesError, setFailureModesError] = useState("");

  const [maintenanceRecommendations, setMaintenanceRecommendations] =
    useState<MaintenanceRecommendationResponse | null>(null);
  const [maintenanceRecommendationsLoading, setMaintenanceRecommendationsLoading] =
    useState(true);
  const [maintenanceRecommendationsError, setMaintenanceRecommendationsError] =
    useState("");

  /*
   * Load live equipment intelligence, quantitative risk,
   * failure-mode hypotheses, and maintenance recommendations.
   */
  useEffect(() => {
    let cancelled = false;

    async function loadEquipment() {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/equipment/C-104/intelligence`
        );

        if (!res.ok) {
          throw new Error("Unable to load equipment data.");
        }

        const data = await res.json();

        if (!cancelled) {
          setEquipment(data);
          setEquipmentError("");
        }
      } catch (error) {
        if (!cancelled) {
          setEquipmentError(
            "Unable to load C-104 equipment intelligence."
          );
        }
      } finally {
        if (!cancelled) {
          setEquipmentLoading(false);
        }
      }
    }

    async function loadRisk() {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/equipment/C-104/risk`
        );

        if (!res.ok) {
          throw new Error("Unable to load equipment risk.");
        }

        const data = await res.json();

        if (data.error) {
          throw new Error(data.error);
        }

        if (!cancelled) {
          setRisk(data);
          setRiskError("");
        }
      } catch (error) {
        if (!cancelled) {
          setRiskError("Unable to load the quantitative risk score.");
        }
      } finally {
        if (!cancelled) {
          setRiskLoading(false);
        }
      }
    }

    async function loadFailureModes() {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/equipment/C-104/failure-modes`
        );

        if (!res.ok) {
          throw new Error("Unable to load failure-mode analysis.");
        }

        const data = await res.json();

        if (data.error) {
          throw new Error(data.error);
        }

        if (!cancelled) {
          setFailureModes(data);
          setFailureModesError("");
        }
      } catch (error) {
        if (!cancelled) {
          setFailureModesError(
            "Unable to load the failure-mode analysis."
          );
        }
      } finally {
        if (!cancelled) {
          setFailureModesLoading(false);
        }
      }
    }

    async function loadMaintenanceRecommendations() {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/equipment/C-104/maintenance-recommendations`
        );

        if (!res.ok) {
          throw new Error(
            "Unable to load maintenance recommendations."
          );
        }

        const data = await res.json();

        if (data.error) {
          throw new Error(data.error);
        }

        if (!cancelled) {
          setMaintenanceRecommendations(data);
          setMaintenanceRecommendationsError("");
        }
      } catch (error) {
        if (!cancelled) {
          setMaintenanceRecommendationsError(
            "Unable to load maintenance recommendations."
          );
        }
      } finally {
        if (!cancelled) {
          setMaintenanceRecommendationsLoading(false);
        }
      }
    }

    loadEquipment();
    loadRisk();
    loadFailureModes();
    loadMaintenanceRecommendations();

    return () => {
      cancelled = true;
    };
  }, []);

  /*
   * Ask FieldFlow
   */
  async function askFieldFlow() {
    if (!question.trim()) return;

    setLoading(true);
    setResponse(null);

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/fieldflow/ask`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            question: question,
          }),
        }
      );

      const data = await res.json();
      setResponse(data);
    } catch (error) {
      setResponse({
        question,
        answer: "",
        sources: [],
        error: "Unable to connect to FieldFlow backend.",
      });
    } finally {
      setLoading(false);
    }
  }

  /*
   * Analyze C-104
   */
  async function analyzeEquipment() {
    setAnalysisLoading(true);
    setEquipmentAnalysis(null);
    setAnalysisError("");

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/equipment/analyze`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            equipment_id: "C-104",
            question: "Why is C-104 at risk?",
          }),
        }
      );

      if (!res.ok) {
        throw new Error("Equipment analysis request failed.");
      }

      const data = await res.json();
      setEquipmentAnalysis(data);
    } catch (error) {
      setAnalysisError(
        "Unable to connect to the equipment intelligence backend."
      );
    } finally {
      setAnalysisLoading(false);
    }
  }

  const readings =
    equipment?.sensor_readings
      ? [...equipment.sensor_readings].reverse()
      : [];

  const latest =
    equipment?.sensor_readings?.[0];

  const earliest =
    equipment?.sensor_readings?.[
      equipment.sensor_readings.length - 1
    ];

  return (
    <main className="min-h-screen bg-[#07090c] text-white">
      <div className="mx-auto max-w-7xl px-6 py-10">

        {/* HEADER */}

        <header className="mb-10 flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold tracking-[0.25em] text-zinc-500">
              POLYGATE ENERGY AI
            </div>

            <h1 className="mt-2 text-3xl font-semibold tracking-tight">
              FieldFlow
            </h1>

            <p className="mt-2 text-sm text-zinc-400">
              Oil & gas operations intelligence
            </p>
          </div>

          <div className="rounded-full border border-emerald-900 bg-emerald-950/40 px-4 py-2 text-xs text-emerald-400">
            <span className="mr-2">Ã¢â€”Â</span>
            Knowledge Base Online
          </div>
        </header>

        {/* ASSET INTELLIGENCE */}

        <section className="mb-6 rounded-3xl border border-zinc-800 bg-zinc-950 p-7">

          {equipmentLoading && (
            <div className="py-10 text-center text-sm text-zinc-500">
              Loading asset intelligence...
            </div>
          )}

          {equipmentError && (
            <div className="rounded-xl border border-red-900 bg-red-950/30 p-4 text-sm text-red-300">
              {equipmentError}
            </div>
          )}

          {equipment && latest && earliest && (
            <>
              <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">

                <div>
                  <div className="text-xs uppercase tracking-[0.2em] text-zinc-500">
                    Asset Intelligence
                  </div>

                  <div className="mt-2 flex flex-wrap items-center gap-3">

                    <h2 className="text-2xl font-semibold">
                      {equipment.equipment.equipment_id} Ã¢â‚¬â€{" "}
                      {equipment.equipment.equipment_name}
                    </h2>

                    <span className="rounded-full border border-emerald-900 bg-emerald-950/40 px-3 py-1 text-xs text-emerald-400">
                      {equipment.equipment.status}
                    </span>

                    {risk && (
                      <span className="rounded-full border border-amber-900 bg-amber-950/40 px-3 py-1 text-xs text-amber-400">
                        {risk.label}
                      </span>
                    )}

                  </div>

                  <p className="mt-2 text-sm text-zinc-500">
                    {equipment.equipment.facility} Ã‚Â·{" "}
                    {equipment.equipment.equipment_type} Ã‚Â·{" "}
                    {equipment.equipment.manufacturer}
                  </p>
                </div>

                <button
                  onClick={analyzeEquipment}
                  disabled={analysisLoading}
                  className="rounded-xl bg-white px-5 py-3 text-sm font-medium text-black transition hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {analysisLoading
                    ? "Analyzing..."
                    : "Analyze Asset"}
                </button>

              </div>

              {/* SENSOR METRICS */}

              <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">

                <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5">
                  <div className="text-xs uppercase tracking-wider text-zinc-500">
                    Vibration
                  </div>

                  <div className="mt-3 text-2xl font-semibold">
                    {latest.vibration}
                  </div>

                  <div className="mt-1 text-xs text-zinc-500">
                    {earliest.vibration} Ã¢â€ â€™ {latest.vibration}{" "}
                    <span className="text-amber-400">Ã¢â€ â€˜</span>
                  </div>
                </div>

                <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5">
                  <div className="text-xs uppercase tracking-wider text-zinc-500">
                    Temperature
                  </div>

                  <div className="mt-3 text-2xl font-semibold">
                    {latest.temperature}
                  </div>

                  <div className="mt-1 text-xs text-zinc-500">
                    {earliest.temperature} Ã¢â€ â€™{" "}
                    {latest.temperature}{" "}
                    <span className="text-amber-400">Ã¢â€ â€˜</span>
                  </div>
                </div>

                <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5">
                  <div className="text-xs uppercase tracking-wider text-zinc-500">
                    Flow Rate
                  </div>

                  <div className="mt-3 text-2xl font-semibold">
                    {latest.flow_rate}
                  </div>

                  <div className="mt-1 text-xs text-zinc-500">
                    {earliest.flow_rate} Ã¢â€ â€™{" "}
                    {latest.flow_rate}{" "}
                    <span className="text-zinc-400">Ã¢â€ â€œ</span>
                  </div>
                </div>

                <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5">
                  <div className="text-xs uppercase tracking-wider text-zinc-500">
                    Pressure
                  </div>

                  <div className="mt-3 text-2xl font-semibold">
                    {latest.pressure}
                  </div>

                  <div className="mt-1 text-xs text-zinc-500">
                    Current reading
                  </div>
                </div>

                <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5">
                  <div className="text-xs uppercase tracking-wider text-zinc-500">
                    RPM
                  </div>

                  <div className="mt-3 text-2xl font-semibold">
                    {latest.rpm.toLocaleString()}
                  </div>

                  <div className="mt-1 text-xs text-zinc-500">
                    {earliest.rpm.toLocaleString()} Ã¢â€ â€™{" "}
                    {latest.rpm.toLocaleString()}
                  </div>
                </div>

              </div>

              {/* SENSOR TRENDS */}

              <div className="mt-8">
                <div className="text-xs uppercase tracking-[0.2em] text-zinc-500">
                  Sensor Trends
                </div>

                <div className="mt-4 grid gap-4 lg:grid-cols-2">
                  {[
                    {
                      key: "vibration" as const,
                      label: "Vibration",
                      from: earliest.vibration,
                      to: latest.vibration,
                    },
                    {
                      key: "temperature" as const,
                      label: "Temperature",
                      from: earliest.temperature,
                      to: latest.temperature,
                    },
                    {
                      key: "flow_rate" as const,
                      label: "Flow Rate",
                      from: earliest.flow_rate,
                      to: latest.flow_rate,
                    },
                    {
                      key: "pressure" as const,
                      label: "Pressure",
                      from: earliest.pressure,
                      to: latest.pressure,
                    },
                  ].map((metric) => (
                    <div
                      key={metric.key}
                      className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-sm font-medium text-zinc-200">
                            {metric.label}
                          </div>

                          <div className="mt-1 text-xs text-zinc-500">
                            {metric.from} Ã¢â€ â€™ {metric.to}
                          </div>
                        </div>

                        <div className="text-lg font-semibold text-zinc-100">
                          {metric.to}
                        </div>
                      </div>

                      <div className="mt-5 h-[220px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={readings}>
                            <CartesianGrid
                              strokeDasharray="3 3"
                              stroke="#27272a"
                            />

                            <XAxis
                              dataKey="timestamp"
                              tickFormatter={(value) =>
                                new Date(value).toLocaleTimeString([], {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })
                              }
                              tick={{ fill: "#71717a", fontSize: 11 }}
                              axisLine={false}
                              tickLine={false}
                            />

                            <YAxis
                              tick={{ fill: "#71717a", fontSize: 11 }}
                              axisLine={false}
                              tickLine={false}
                              width={42}
                            />

                            <Tooltip
                              labelFormatter={(value) =>
                                new Date(String(value)).toLocaleString()
                              }
                              contentStyle={{
                                backgroundColor: "#09090b",
                                border: "1px solid #27272a",
                                borderRadius: "12px",
                                color: "#fff",
                              }}
                            />

                            <Line
                              type="monotone"
                              dataKey={metric.key}
                              strokeWidth={2}
                              dot={{ r: 3 }}
                              activeDot={{ r: 5 }}
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* MAINTENANCE + AI */}

              <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_1.5fr]">

                <div>
                  <div className="text-xs uppercase tracking-[0.2em] text-zinc-500">
                    Maintenance History
                  </div>

                  <div className="mt-4 space-y-3">

                    {equipment.maintenance.map((event) => (
                      <div
                        key={event.id}
                        className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4"
                      >
                        <div className="flex items-center justify-between gap-4">

                          <span className="text-sm text-zinc-300">
                            {new Date(
                              event.event_date
                            ).toLocaleDateString(
                              undefined,
                              {
                                month: "short",
                                day: "2-digit",
                              }
                            )}
                          </span>

                          <span className="text-sm text-zinc-500">
                            {event.event_type}
                          </span>

                        </div>

                        <p className="mt-2 text-xs leading-5 text-zinc-600">
                          {event.description}
                        </p>

                      </div>
                    ))}

                  </div>
                </div>

                {/* AI ASSESSMENT */}

                <div className="rounded-2xl border border-zinc-800 bg-[#0b0d11] p-6">

                  <div className="text-xs uppercase tracking-[0.2em] text-zinc-500">
                    AI Assessment
                  </div>

                  <h3 className="mt-3 text-lg font-medium">
                    Why is {equipment.equipment.equipment_id} at risk?
                  </h3>

                  {!equipmentAnalysis &&
                    !analysisLoading &&
                    !analysisError && (
                      <p className="mt-3 text-sm leading-6 text-zinc-500">
                        Run an asset analysis to evaluate current
                        condition trends, maintenance history and
                        relevant technical context.
                      </p>
                    )}

                  {analysisLoading && (
                    <div className="mt-5 rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
                      <div className="text-sm text-zinc-400">
                        Analyzing equipment condition...
                      </div>

                      <div className="mt-3 h-1 overflow-hidden rounded-full bg-zinc-800">
                        <div className="h-full w-1/2 animate-pulse rounded-full bg-zinc-500" />
                      </div>
                    </div>
                  )}

                  {analysisError && (
                    <div className="mt-5 rounded-xl border border-red-900 bg-red-950/30 p-4 text-sm text-red-300">
                      {analysisError}
                    </div>
                  )}

                  <div className="mt-5 space-y-4">

                      {/* LIVE RISK ENGINE */}

                      <div className="rounded-2xl border border-amber-900/60 bg-amber-950/20 p-5">
                        <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
                          <div>
                            <div className="text-xs uppercase tracking-[0.18em] text-amber-500">
                              Quantitative Risk Engine
                            </div>

                            {riskLoading ? (
                              <div className="mt-3 text-sm text-zinc-500">
                                Calculating live risk score...
                              </div>
                            ) : riskError ? (
                              <div className="mt-3 text-sm text-red-300">
                                {riskError}
                              </div>
                            ) : risk ? (
                              <>
                                <div className="mt-2 flex items-end gap-3">
                                  <div className="text-4xl font-semibold tracking-tight text-white">
                                    {risk.score.toFixed(1)}
                                  </div>
                                  <div className="pb-1 text-sm text-zinc-500">
                                    / 100
                                  </div>
                                </div>
                                <div className="mt-1 text-lg font-medium text-amber-400">
                                  {risk.label}
                                </div>
                              </>
                            ) : null}
                          </div>

                          <div className="rounded-full border border-amber-900 bg-amber-950/40 px-3 py-1 text-xs text-amber-400">
                            Decision Support
                          </div>
                        </div>

                        {risk && (
                          <>
                            <div className="mt-5 h-2 overflow-hidden rounded-full bg-zinc-800">
                              <div
                                className="h-full rounded-full bg-amber-500 transition-all"
                                style={{ width: `${Math.min(risk.score, 100)}%` }}
                              />
                            </div>

                            <p className="mt-3 text-xs leading-5 text-zinc-500">
                              Transparent rule-based demo analytics using recent sensor trends and maintenance history. Not an OEM limit, safety threshold, or failure prediction.
                            </p>
                          </>
                        )}
                      </div>

                      {/* RISK COMPONENTS */}

                      {risk && (
                        <div>
                          <div className="mb-3 text-xs uppercase tracking-[0.18em] text-zinc-500">
                            Risk Score Breakdown
                          </div>

                          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                            {risk.components.map((component) => (
                              <div
                                key={component.name}
                                className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4"
                              >
                                <div className="flex items-start justify-between gap-3">
                                  <div className="text-xs leading-5 text-zinc-500">
                                    {component.name}
                                  </div>
                                  <div className="text-sm font-semibold text-zinc-200">
                                    {component.points.toFixed(1)} / {component.max_points}
                                  </div>
                                </div>
                                <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-zinc-800">
                                  <div
                                    className="h-full rounded-full bg-zinc-400"
                                    style={{
                                      width: `${Math.min(100, (component.points / component.max_points) * 100)}%`,
                                    }}
                                  />
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* FAILURE MODE DETECTION */}

                      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/30 p-5">
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                          <div>
                            <div className="text-xs uppercase tracking-[0.18em] text-zinc-500">
                              Failure Mode Detection
                            </div>
                            <h4 className="mt-2 text-lg font-medium text-zinc-100">
                              Potential Failure Modes
                            </h4>
                          </div>

                          <div className="text-xs text-zinc-500">
                            Engineering hypotheses
                          </div>
                        </div>

                        {failureModesLoading && (
                          <div className="mt-4 rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 text-sm text-zinc-500">
                            Evaluating sensor and maintenance signals...
                          </div>
                        )}

                        {failureModesError && (
                          <div className="mt-4 rounded-xl border border-red-900 bg-red-950/30 p-4 text-sm text-red-300">
                            {failureModesError}
                          </div>
                        )}

                        {failureModes && !failureModesLoading && (
                          <div className="mt-4 space-y-3">
                            {failureModes.failure_modes.map((mode) => {
                              const confidenceClass =
                                mode.confidence === "High"
                                  ? "border-amber-900/70 bg-amber-950/10 text-amber-400"
                                  : mode.confidence === "Moderate"
                                    ? "border-zinc-700 bg-zinc-900/50 text-zinc-300"
                                    : "border-zinc-800 bg-zinc-900/30 text-zinc-400";

                              return (
                                <details
                                  key={mode.name}
                                  className="group rounded-xl border border-zinc-800 bg-zinc-950/60"
                                >
                                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 p-4">
                                    <div className="min-w-0">
                                      <div className="text-sm font-medium text-zinc-200">
                                        {mode.name}
                                      </div>
                                      <div className="mt-1 text-xs text-zinc-500">
                                        {mode.observed_signals.join(" Ã‚Â· ")}
                                      </div>
                                    </div>

                                    <span
                                      className={`shrink-0 rounded-full border px-2.5 py-1 text-[10px] uppercase tracking-wider ${confidenceClass}`}
                                    >
                                      {mode.confidence} confidence
                                    </span>
                                  </summary>

                                  <div className="border-t border-zinc-800 px-4 pb-4 pt-4">
                                    <div className="text-[11px] uppercase tracking-[0.16em] text-zinc-600">
                                      Evidence
                                    </div>

                                    <ul className="mt-2 space-y-1.5">
                                      {mode.evidence.map((item) => (
                                        <li
                                          key={item}
                                          className="text-xs leading-5 text-zinc-400"
                                        >
                                          Ã¢â‚¬Â¢ {item}
                                        </li>
                                      ))}
                                    </ul>

                                    <div className="mt-4 rounded-lg border border-zinc-800 bg-zinc-900/50 p-3">
                                      <div className="text-[11px] uppercase tracking-[0.16em] text-zinc-600">
                                        Engineering Note
                                      </div>
                                      <p className="mt-2 text-xs leading-5 text-zinc-400">
                                        {mode.engineering_note}
                                      </p>
                                    </div>
                                  </div>
                                </details>
                              );
                            })}

                            <p className="pt-1 text-[11px] leading-5 text-zinc-600">
                              Potential failure modes are hypotheses, not confirmed failures. Confidence is a heuristic classification, not a calibrated probability.
                            </p>
                          </div>
                        )}
                      </div>

                      {/* MAINTENANCE RECOMMENDATIONS */}

                      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/30 p-5">
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                          <div>
                            <div className="text-xs uppercase tracking-[0.18em] text-zinc-500">
                              Maintenance Decision Support
                            </div>
                            <h4 className="mt-2 text-lg font-medium text-zinc-100">
                              Maintenance Recommendations
                            </h4>
                          </div>

                          <div className="text-xs text-zinc-500">
                            Engineer-reviewed actions
                          </div>
                        </div>

                        {maintenanceRecommendationsLoading && (
                          <div className="mt-4 rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 text-sm text-zinc-500">
                            Generating maintenance recommendations...
                          </div>
                        )}

                        {maintenanceRecommendationsError && (
                          <div className="mt-4 rounded-xl border border-red-900 bg-red-950/30 p-4 text-sm text-red-300">
                            {maintenanceRecommendationsError}
                          </div>
                        )}

                        {maintenanceRecommendations &&
                          !maintenanceRecommendationsLoading && (
                            <div className="mt-4 space-y-3">
                              {maintenanceRecommendations.recommendations.map(
                                (recommendation) => (
                                  <details
                                    key={`${recommendation.priority}-${recommendation.action}`}
                                    className="group rounded-xl border border-zinc-800 bg-zinc-950/60"
                                  >
                                    <summary className="flex cursor-pointer list-none items-center justify-between gap-4 p-4">
                                      <div className="flex min-w-0 items-start gap-3">
                                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-amber-900/70 bg-amber-950/20 text-xs font-semibold text-amber-400">
                                          {String(
                                            recommendation.priority
                                          ).padStart(2, "0")}
                                        </div>

                                        <div className="min-w-0">
                                          <div className="text-sm font-medium text-zinc-200">
                                            {recommendation.action}
                                          </div>
                                          <div className="mt-1 text-xs text-zinc-500">
                                            {recommendation.category}
                                          </div>
                                        </div>
                                      </div>

                                      <span className="shrink-0 rounded-full border border-amber-900/60 bg-amber-950/20 px-2.5 py-1 text-[10px] uppercase tracking-wider text-amber-400">
                                        Priority {recommendation.priority}
                                      </span>
                                    </summary>

                                    <div className="border-t border-zinc-800 px-4 pb-4 pt-4">
                                      <div className="text-[11px] uppercase tracking-[0.16em] text-zinc-600">
                                        Trigger
                                      </div>

                                      <ul className="mt-2 space-y-1.5">
                                        {recommendation.trigger.map(
                                          (item) => (
                                            <li
                                              key={item}
                                              className="text-xs leading-5 text-zinc-400"
                                            >
                                              Ã¢â‚¬Â¢ {item}
                                            </li>
                                          )
                                        )}
                                      </ul>

                                      <div className="mt-4">
                                        <div className="text-[11px] uppercase tracking-[0.16em] text-zinc-600">
                                          Recommended Review
                                        </div>

                                        <ul className="mt-2 space-y-1.5">
                                          {recommendation.recommended_review.map(
                                            (item) => (
                                              <li
                                                key={item}
                                                className="text-xs leading-5 text-zinc-400"
                                              >
                                                Ã¢â‚¬Â¢ {item}
                                              </li>
                                            )
                                          )}
                                        </ul>
                                      </div>

                                      <div className="mt-4 rounded-lg border border-zinc-800 bg-zinc-900/50 p-3">
                                        <div className="text-[11px] uppercase tracking-[0.16em] text-zinc-600">
                                          Rationale
                                        </div>

                                        <p className="mt-2 text-xs leading-5 text-zinc-400">
                                          {recommendation.reason}
                                        </p>
                                      </div>

                                      <div className="mt-3 text-[11px] text-zinc-600">
                                        {recommendation.requires_engineer_review
                                          ? "Qualified engineering review required before action."
                                          : "Decision-support recommendation."}
                                      </div>
                                    </div>
                                  </details>
                                )
                              )}

                              <p className="pt-1 text-[11px] leading-5 text-zinc-600">
                                Recommendations are decision-support outputs based on
                                observed sensor and maintenance signals. They do not
                                constitute autonomous maintenance commands.
                              </p>
                            </div>
                          )}
                      </div>

                      {/* KEY SIGNALS */}

                      <div>
                        <div className="mb-3 text-xs uppercase tracking-[0.18em] text-zinc-500">
                          Key Signals
                        </div>

                        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                          {risk?.signals.map((signal) => (
                            <div
                              key={signal.name}
                              className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4"
                            >
                              <div className="text-xs text-zinc-500">
                                {signal.name.toUpperCase()}
                              </div>

                              <div className="mt-2 text-lg font-semibold">
                                {signal.change_percent !== undefined
                                  ? `${signal.direction === "declining" ? "-" : signal.change_percent > 0 ? "+" : ""}${signal.change_percent.toFixed(1)}%`
                                  : signal.events !== undefined
                                    ? `${signal.events} events`
                                    : "Ã¢â‚¬â€"}
                              </div>

                              <div
                                className={`mt-1 text-xs ${
                                  signal.status === "High"
                                    ? "text-amber-400"
                                    : "text-zinc-400"
                                }`}
                              >
                                {signal.direction}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* AI ANALYSIS */}

                      {equipmentAnalysis?.answer && (
                        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5">
                        <div className="mb-4 text-xs uppercase tracking-[0.18em] text-zinc-500">
                          Engineering Analysis
                        </div>

                        <div className="max-h-[420px] overflow-y-auto pr-2">
                          <div className="whitespace-pre-wrap text-sm leading-7 text-zinc-300">
                            {equipmentAnalysis.answer}
                          </div>
                        </div>

                      {/* TECHNICAL SOURCES */}

                      {equipmentAnalysis.sources?.length > 0 && (
                        <div>
                          <div className="mb-3 text-xs uppercase tracking-[0.18em] text-zinc-500">
                            Technical Sources
                          </div>

                          <div className="grid gap-3 sm:grid-cols-2">
                            {equipmentAnalysis.sources.map((source, index) => (
                              <div
                                key={`${source.filename}-${source.page}-${index}`}
                                className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4"
                              >
                                <div className="break-words text-sm font-medium text-zinc-300">
                                  {source.filename}
                                </div>

                                <div className="mt-2 flex items-center justify-between text-xs text-zinc-500">
                                  <span>Page {source.page}</span>

                                  <span>
                                    {(source.similarity * 100).toFixed(1)}% match
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                        </div>
                      )}

                  </div>

                </div>

              </div>
            </>
          )}

        </section>

        {/* FIELD FLOW COPILOT */}

        <section className="grid gap-6 lg:grid-cols-[1fr_340px]">

          <div className="rounded-3xl border border-zinc-800 bg-zinc-950 p-7">

            <div className="mb-6">

              <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">
                Operations Copilot
              </p>

              <h2 className="mt-2 text-xl font-medium">
                Ask FieldFlow
              </h2>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-400">
                Search operating guidelines, production-facility
                requirements, flare-gas documentation and engineering
                references.
              </p>

            </div>

            <div className="flex gap-3">

              <textarea
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="Example: What are the requirements for flare gas measurement?"
                className="min-h-[110px] flex-1 resize-none rounded-2xl border border-zinc-800 bg-zinc-900 p-4 text-sm outline-none placeholder:text-zinc-600 focus:border-zinc-600"
              />

              <button
                onClick={askFieldFlow}
                disabled={loading}
                className="self-end rounded-xl bg-white px-6 py-3 text-sm font-medium text-black transition hover:bg-zinc-200 disabled:opacity-50"
              >
                {loading ? "Analyzing..." : "Ask"}
              </button>

            </div>

            {response?.error && (
              <div className="mt-6 rounded-2xl border border-red-900 bg-red-950/30 p-4 text-sm text-red-300">
                {response.error}
              </div>
            )}

            {response?.answer && (
              <div className="mt-8">

                <div className="mb-3 text-xs uppercase tracking-[0.2em] text-zinc-500">
                  FieldFlow Analysis
                </div>

                <div className="whitespace-pre-wrap rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6 text-sm leading-7 text-zinc-200">
                  {response.answer}
                </div>

              </div>
            )}

          </div>

          {/* SOURCES */}

          <aside className="rounded-3xl border border-zinc-800 bg-zinc-950 p-6">

            <div className="text-xs uppercase tracking-[0.2em] text-zinc-500">
              Sources
            </div>

            {!response?.sources?.length ? (
              <p className="mt-5 text-sm leading-6 text-zinc-500">
                Supporting documents will appear here after an
                analysis.
              </p>
            ) : (
              <div className="mt-5 space-y-3">

                {response.sources.map((source, index) => (
                  <div
                    key={`${source.filename}-${source.page}-${index}`}
                    className="rounded-2xl border border-zinc-800 bg-zinc-900 p-4"
                  >

                    <div className="break-words text-sm font-medium text-zinc-200">
                      {source.filename}
                    </div>

                    <div className="mt-3 flex items-center justify-between text-xs text-zinc-500">
                      <span>
                        Page {source.page}
                      </span>

                      <span>
                        {(source.similarity * 100).toFixed(1)}%
                        match
                      </span>
                    </div>

                  </div>
                ))}

              </div>
            )}

          </aside>

        </section>

        {/* PLATFORM STATS */}

        <section className="mt-6 grid gap-4 md:grid-cols-3">

          <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-5">

            <div className="text-xs text-zinc-500">
              KNOWLEDGE BASE
            </div>

            <div className="mt-2 text-2xl font-semibold">
              496
            </div>

            <div className="mt-1 text-sm text-zinc-500">
              indexed document chunks
            </div>

          </div>

          <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-5">

            <div className="text-xs text-zinc-500">
              SOURCE TYPE
            </div>

            <div className="mt-2 text-2xl font-semibold">
              NUPRC
            </div>

            <div className="mt-1 text-sm text-zinc-500">
              public regulatory guidance
            </div>

          </div>

          <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-5">

            <div className="text-xs text-zinc-500">
              OPERATING MODE
            </div>

            <div className="mt-2 text-2xl font-semibold">
              Read-only
            </div>

            <div className="mt-1 text-sm text-zinc-500">
              human-reviewed decision support
            </div>

          </div>

        </section>

      </div>
    </main>
  );
}
