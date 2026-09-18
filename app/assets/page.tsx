"use client";

import { useEffect, useState } from "react";

type AssetData = {
  equipment: {
    equipment_id: string;
    equipment_name: string;
    equipment_type: string;
    facility: string;
    manufacturer: string;
    status: string;
  };
  maintenance: Array<{
    event_date: string;
    event_type: string;
    description: string;
    downtime_hours: number;
    cost: number;
  }>;
  sensor_readings: Array<{
    timestamp: string;
    temperature: number;
    pressure: number;
    vibration: number;
    rpm: number;
    flow_rate: number;
  }>;
};

type RiskData = {
  score: number;
  level: string;
  components?: Record<string, number>;
};

type FailureMode = {
  mode: string;
  confidence: string;
  evidence: string[];
};

type Recommendation = {
  priority: number;
  action: string;
  reason: string;
};

export default function AssetHealthPage() {
  const [asset, setAsset] = useState<AssetData | null>(null);
  const [risk, setRisk] = useState<RiskData | null>(null);
  const [failureModes, setFailureModes] = useState<FailureMode[]>([]);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [briefGenerated, setBriefGenerated] = useState(false);

  async function loadAsset() {
    try {
      setLoading(true);
      setError("");

      const [
        intelligenceResponse,
        riskResponse,
        failureModesResponse,
        recommendationsResponse,
      ] = await Promise.all([
        fetch("${process.env.NEXT_PUBLIC_API_URL}/equipment/C-104/intelligence"),
        fetch("${process.env.NEXT_PUBLIC_API_URL}/equipment/C-104/risk"),
        fetch("${process.env.NEXT_PUBLIC_API_URL}/equipment/C-104/failure-modes"),
        fetch(
          "${process.env.NEXT_PUBLIC_API_URL}/equipment/C-104/maintenance-recommendations"
        ),
      ]);

      if (
        !intelligenceResponse.ok ||
        !riskResponse.ok ||
        !failureModesResponse.ok ||
        !recommendationsResponse.ok
      ) {
        throw new Error("Unable to load asset intelligence.");
      }

      const intelligence = await intelligenceResponse.json();
      const riskData = await riskResponse.json();
      const failureData = await failureModesResponse.json();
      const recommendationData = await recommendationsResponse.json();

      setAsset({
        equipment: intelligence.equipment,
        maintenance: intelligence.maintenance,
        sensor_readings: Array.isArray(intelligence.sensor_readings) ? intelligence.sensor_readings : [],
      });
      setRisk(riskData);
      setFailureModes(
        failureData.failure_modes ||
          failureData.modes ||
          []
      );
      setRecommendations(
        recommendationData.recommendations || []
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load asset intelligence."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAsset();
  }, []);

  function generateEngineeringBrief() {
    setBriefGenerated(true);
    requestAnimationFrame(() => {
      document.getElementById("engineering-brief")?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    });
  }
  if (loading) {
    return (
      <main className="min-h-screen bg-slate-950 p-8 text-slate-200">
        Loading Asset Health Command Center...
      </main>
    );
  }

  if (error || !asset) {
    return (
      <main className="min-h-screen bg-slate-950 p-8 text-slate-200">
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-5 text-red-300">
          {error || "Asset data unavailable."}
        </div>
      </main>
    );
  }

  const latest = asset.sensor_readings[0];
  const oldest =
    asset.sensor_readings[asset.sensor_readings.length - 1];

  const vibrationChange =
    oldest && oldest.vibration !== 0
      ? ((latest.vibration - oldest.vibration) /
          oldest.vibration) *
        100
      : 0;

  const temperatureChange =
    oldest && oldest.temperature !== 0
      ? ((latest.temperature - oldest.temperature) /
          oldest.temperature) *
        100
      : 0;

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto max-w-7xl px-6 py-8">
        <header className="flex flex-col gap-4 border-b border-slate-800 pb-6 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="text-xs font-medium uppercase tracking-wider text-cyan-400">
              Polygate Energy AI
            </div>
            <h1 className="mt-1 text-3xl font-semibold">
              Asset Health Command Center
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Integrated engineering intelligence for asset C-104.
            </p>
          </div>

          <button
            type="button"
            onClick={loadAsset}
            className="rounded-lg border border-slate-700 px-4 py-2 text-sm font-medium hover:bg-slate-900"
          >
            Refresh
          </button>
        </header>

        <section className="mt-6 rounded-2xl border border-slate-800 bg-slate-900 p-6">
          <div className="text-xs uppercase tracking-wider text-slate-500">
            Asset
          </div>

          <div className="mt-2 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-2xl font-semibold">
                {asset.equipment?.equipment_name ?? asset.equipment?.equipment_id ?? 'Asset'}
              </h2>
              <p className="text-sm text-slate-400">
                {asset.equipment?.equipment_id ?? 'C-104'} {" "}
                {asset.equipment?.equipment_type ?? 'Equipment'} {" "}
                {asset.equipment?.facility ?? 'Facility unavailable'}
              </p>
            </div>

            <div className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-sm text-emerald-300">
              {asset.equipment?.status ?? 'Unknown'}
            </div>
          </div>
        </section>

        <section className="mt-6 grid gap-4 md:grid-cols-4">
          <Metric
            label="Risk Score"
            value={risk?.score != null ? Number(risk.score).toFixed(1) : ""}
          />
          <Metric
            label="Risk Level"
            value={risk?.level || ""}
          />
          <Metric
            label="Latest Vibration"
            value={`${latest?.vibration ?? ""} mm/s`}
          />
          <Metric
            label="Latest Temperature"
            value={`${latest?.temperature ?? ""} °C`}
          />
        </section>

        <section className="mt-6 grid gap-6 lg:grid-cols-2">
          <Panel
            eyebrow="Current Signals"
            title="Sensor Condition"
          >
            <SignalRow
              label="Vibration"
              value={latest?.vibration}
              change={vibrationChange}
              unit="mm/s"
            />
            <SignalRow
              label="Temperature"
              value={latest?.temperature}
              change={temperatureChange}
              unit="°C"
            />
            <SignalRow
              label="Pressure"
              value={latest?.pressure}
              unit="bar"
            />
            <SignalRow
              label="Flow Rate"
              value={latest?.flow_rate}
              unit="units"
            />
            <SignalRow
              label="Rotational Speed"
              value={latest?.rpm}
              unit="rpm"
            />
          </Panel>

          <Panel
            eyebrow="Engineering Intelligence"
            title="Potential Failure Modes"
          >
            <div className="space-y-3">
              {failureModes.length === 0 ? (
                <p className="text-sm text-slate-500">
                  No failure-mode hypotheses returned.
                </p>
              ) : (
                failureModes.map((mode, index) => (
                  <div
                    key={`${mode.mode}-${index}`}
                    className="rounded-xl border border-slate-800 bg-slate-950 p-4"
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div className="font-medium">
                        {mode.mode}
                      </div>
                      <div className="text-xs text-cyan-400">
                        {mode.confidence}
                      </div>
                    </div>

                    {mode.evidence?.length > 0 && (
                      <ul className="mt-2 space-y-1 text-sm text-slate-400">
                        {mode.evidence.slice(0, 2).map((item, i) => (
                          <li key={i}> {item}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))
              )}
            </div>
          </Panel>
        </section>

        <section className="mt-6">
          <Panel
            eyebrow="Maintenance Intelligence"
            title="Recommended Engineering Reviews"
          >
            <div className="grid gap-3">
              {recommendations.length === 0 ? (
                <p className="text-sm text-slate-500">
                  No recommendations returned.
                </p>
              ) : (
                recommendations.map((item, index) => (
                  <div
                    key={`${item.action}-${index}`}
                    className="rounded-xl border border-slate-800 bg-slate-950 p-4"
                  >
                    <div className="flex gap-4">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-cyan-500/10 text-sm font-semibold text-cyan-400">
                        {item.priority ?? index + 1}
                      </div>
                      <div>
                        <div className="font-medium">
                          {item.action}
                        </div>
                        <p className="mt-1 text-sm leading-6 text-slate-400">
                          {item.reason}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Panel>
        </section>        <section className="mt-6">
          <button
            type="button"
            onClick={generateEngineeringBrief}
            className="rounded-lg bg-cyan-500 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400"
          >
            Generate Engineering Brief
          </button>
        </section>

        {briefGenerated && (
          <section id="engineering-brief" className="mt-6">
            <Panel
              eyebrow="AI Engineering Intelligence"
              title="Engineering Intelligence Brief"
            >
              <div className="space-y-5">
                <div className="rounded-xl border border-cyan-500/20 bg-cyan-500/5 p-4">
                  <div className="text-sm font-semibold text-cyan-300">Executive Summary</div>
                  <p className="mt-2 text-sm leading-6 text-slate-300">
                    C-104 is currently operational with an Elevated risk score of {risk?.score?.toFixed(1) ?? "N/A"}. The available sensor window shows rising vibration and temperature alongside declining flow and pressure.
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold">Observed Signals</h3>
                  <ul className="mt-2 space-y-2 text-sm text-slate-400">
                    <li>Vibration: {latest?.vibration ?? "N/A"} mm/s, {vibrationChange >= 0 ? "+" : ""}{vibrationChange.toFixed(2)}% change.</li>
                    <li>Temperature: {latest?.temperature ?? "N/A"} °C, {temperatureChange >= 0 ? "+" : ""}{temperatureChange.toFixed(2)}% change.</li>
                    <li>Pressure: {latest?.pressure ?? "N/A"} bar.</li>
                    <li>Flow rate: {latest?.flow_rate ?? "N/A"} units.</li>
                    <li>Rotational speed: {latest?.rpm ?? "N/A"} rpm.</li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-semibold">Risk Assessment</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-400">
                    The transparent rule-based risk engine reports a score of {risk?.score?.toFixed(1) ?? "N/A"} and a level of {risk?.level ?? "N/A"}. This is demo analytics and is not an OEM limit, safety threshold, or failure prediction.
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold">Potential Failure Modes</h3>
                  <div className="mt-3 space-y-2">
                    {failureModes.map((mode, index) => (
                      <div key={`${mode.mode}-brief-${index}`} className="rounded-lg border border-slate-800 bg-slate-950 p-3 text-sm">
                        <div className="font-medium">{mode.mode}</div>
                        <div className="mt-1 text-xs text-cyan-400">{mode.confidence} confidence</div>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold">Maintenance Review Priorities</h3>
                  <div className="mt-3 space-y-2">
                    {recommendations.map((item, index) => (
                      <div key={`${item.action}-brief-${index}`} className="rounded-lg border border-slate-800 bg-slate-950 p-3 text-sm">
                        <span className="mr-2 text-cyan-400">{item.priority ?? index + 1}.</span>
                        {item.action}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
                  <div className="text-sm font-semibold text-amber-300">Scope & Limitations</div>
                  <p className="mt-2 text-sm leading-6 text-slate-400">
                    This brief summarizes the data and analytics currently available for C-104. Potential failure modes are hypotheses, recommendations are engineering review items, and the risk score is transparent demo analytics. Qualified engineering review is required before operational action.
                  </p>
                </div>
              </div>
            </Panel>
          </section>
        )}


        <section className="mt-6">
          <Panel
            eyebrow="Historical Context"
            title="Maintenance History"
          >
            <div className="space-y-3">
              {(asset.maintenance ?? []).map((event) => (
                <div
                  key={`${event.event_date}-${event.event_type}`}
                  className="rounded-xl border border-slate-800 bg-slate-950 p-4"
                >
                  <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                    <div>
                      <div className="font-medium">
                        {event.event_type}
                      </div>
                      <p className="mt-1 text-sm text-slate-400">
                        {event.description}
                      </p>
                    </div>

                    <div className="shrink-0 text-right text-xs text-slate-500">
                      <div>{event.event_date}</div>
                      <div>{event.downtime_hours} hours downtime</div>
                      <div>
                        {event.cost.toLocaleString()}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Panel>
        </section>

        <section className="mt-6 rounded-2xl border border-amber-500/20 bg-amber-500/5 p-5">
          <div className="text-sm font-semibold text-amber-300">
            Engineering Scope
          </div>
          <p className="mt-2 text-sm leading-6 text-slate-400">
            This command center aggregates sensor trends, maintenance
            history, the transparent risk engine, failure-mode
            hypotheses, and maintenance recommendations. Outputs are
            decision-support information and require qualified
            engineering review.
          </p>
        </section>

        <footer className="mt-8 flex gap-3">
          <a
            href="/predict"
            className="rounded-lg border border-slate-700 px-4 py-2 text-sm hover:bg-slate-900"
          >
            Predict
          </a>
          <a
            href="/operations"
            className="rounded-lg border border-slate-700 px-4 py-2 text-sm hover:bg-slate-900"
          >
            Operations Command Center
          </a>
          <a
            href="/fieldflow"
            className="rounded-lg border border-slate-700 px-4 py-2 text-sm hover:bg-slate-900"
          >
            FieldFlow
          </a>
        </footer>
      </div>
    </main>
  );
}

function Metric({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
      <div className="text-xs text-slate-500">{label}</div>
      <div className="mt-2 text-2xl font-semibold">{value}</div>
    </div>
  );
}

function Panel({
  eyebrow,
  title,
  children,
}: {
  eyebrow: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
      <div className="text-xs font-medium uppercase tracking-wider text-cyan-400">
        {eyebrow}
      </div>
      <h2 className="mt-1 text-xl font-semibold">{title}</h2>
      <div className="mt-5">{children}</div>
    </div>
  );
}

function SignalRow({
  label,
  value,
  change,
  unit,
}: {
  label: string;
  value?: number;
  change?: number;
  unit: string;
}) {
  return (
    <div className="border-b border-slate-800 py-3 last:border-b-0">
      <div className="flex items-center justify-between">
        <span className="text-sm text-slate-400">{label}</span>
        <span className="font-medium">
          {value ?? ""} {unit}
        </span>
      </div>

      {change !== undefined && (
        <div className="mt-1 text-xs text-slate-500">
          Change across available sensor window:{" "}
          {change >= 0 ? "+" : ""}
          {change.toFixed(2)}%
        </div>
      )}
    </div>
  );
}















