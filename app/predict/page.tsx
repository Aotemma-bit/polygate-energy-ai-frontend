"use client";

import MLPredictionSimulator from "./MLPredictionSimulator";
import SensorSignalTimeline from "./SensorSignalTimeline";
import ModelExplainability from "./ModelExplainability";

import { useCallback, useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import type { MachineInputs } from "./MLPredictionSimulator";

type PredictData = {
  equipment_id: string;
  equipment_name: string;
  anomaly_index: number;
  status: string;
  prediction_horizon: string;
  observations: {
    vibration_change_percent: number;
    temperature_change_percent: number;
    flow_change_percent: number;
    pressure_change_percent: number;
  };
  predictive_features: {
    features: {
      vibration_mean: number;
      vibration_std: number;
      vibration_min: number;
      vibration_max: number;
      vibration_trend: number;
      vibration_change_percent: number;
      temperature_mean: number;
      temperature_std: number;
      temperature_min: number;
      temperature_max: number;
      temperature_trend: number;
      temperature_change_percent: number;
      flow_mean: number;
      flow_std: number;
      flow_min: number;
      flow_max: number;
      flow_trend: number;
      flow_change_percent: number;
      pressure_mean: number;
      pressure_std: number;
      pressure_min: number;
      pressure_max: number;
      pressure_trend: number;
      pressure_change_percent: number;
    };
  };
  prediction_mode: string;
  method: string;
  action_plan: {
    priority: string;
    trigger: string;
    recommended_review: string;
    evidence: string;
  }[];
};

type ModelInfo = {
  model: string;
  dataset: string;
  dataset_rows: number;
  failure_cases: number;
  non_failure_cases: number;
  features: string[];
  target: string;
  metrics: {
    precision: number;
    recall: number;
    f1: number;
    roc_auc: number;
  };
  confusion_matrix: number[][];
  feature_importance: Record<string, number>;
  model_scope: string;
};


type ValidationInfo = {
  model: string;
  dataset: string;
  dataset_rows: number;
  failure_cases: number;
  non_failure_cases: number;
  cross_validation: {
    method: string;
    shuffle: boolean;
    random_state: number;
    folds: {
      fold: number;
      roc_auc: number;
      precision: number;
      recall: number;
      f1: number;
    }[];
    summary: {
      roc_auc: {
        mean: number;
        std: number;
      };
      precision: {
        mean: number;
        std: number;
      };
      recall: {
        mean: number;
        std: number;
      };
      f1: {
        mean: number;
        std: number;
      };
    };
  };
  scope: string;
};
export default function PredictPage() {
  const [predictData, setPredictData] =
    useState<PredictData | null>(null);

  const [modelInfo, setModelInfo] =
    useState<ModelInfo | null>(null);

  const [validationInfo, setValidationInfo] = useState<ValidationInfo | null>(null);

  const [explainTrigger, setExplainTrigger] = useState(0);

  const [machineInputs, setMachineInputs] = useState<MachineInputs>({
    air_temperature_K: 298.1,
    process_temperature_K: 308.6,
    rotational_speed_rpm: 1551,
    torque_Nm: 42.8,
    tool_wear_min: 0,
  });

  const handleMachineInputsChange = useCallback((inputs: MachineInputs) => {
    setMachineInputs(inputs);
  }, []);

  const handleExplainPrediction = useCallback(() => {
    setExplainTrigger((value) => value + 1);
  }, []);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [realtimeStatus, setRealtimeStatus] = useState("CONNECTING");
  const [lastRealtimeEvent, setLastRealtimeEvent] = useState<string | null>(null);

  async function loadData() {
    try {
      setLoading(true);
      setError("");

      const [predictResponse, modelResponse, validationResponse] =
        await Promise.all([
          fetch(
            "${process.env.NEXT_PUBLIC_API_URL}/equipment/C-104/predict"
          ),
          fetch(
            "${process.env.NEXT_PUBLIC_API_URL}/predict/ml/info"
          ),
          fetch(
            "${process.env.NEXT_PUBLIC_API_URL}/predict/ml/validation"
          ),
        ]);

      if (
        !predictResponse.ok ||
        !modelResponse.ok ||
        !validationResponse.ok
      ) {
        throw new Error(
          "Unable to load Predict data."
        );
      }

      const predictJson = await predictResponse.json();
            const modelJson = await modelResponse.json();
      const validationJson = await validationResponse.json();

      setPredictData(predictJson);
      setModelInfo(modelJson);
      setValidationInfo(validationJson);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load Predict data."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();

    const channel = supabase
      .channel("predict-sensor-readings")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "sensor_readings",
        },
        () => {
          setLastRealtimeEvent(new Date().toISOString());
          loadData();
        }
      )
      .subscribe((status) => {
        setRealtimeStatus(status);
      });

    const interval = window.setInterval(() => {
      loadData();
    }, 60000);

    return () => {
      window.clearInterval(interval);
      supabase.removeChannel(channel);
    };
  }, []);

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-950 text-white p-8">
        <div className="max-w-7xl mx-auto">
          <p className="text-slate-400">
            Loading Polygate Predict...
          </p>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen bg-slate-950 text-white p-8">
        <div className="max-w-7xl mx-auto">
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-6">
            <h1 className="text-xl font-semibold">
              Polygate Predict
            </h1>

            <p className="mt-2 text-red-300">
              {error}
            </p>

            <button
              onClick={loadData}
              className="mt-4 rounded-lg bg-white px-4 py-2 text-sm font-medium text-slate-900"
            >
              Retry
            </button>
          </div>
        </div>
      </main>
    );
  }

  const features =
    predictData?.predictive_features?.features;

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto max-w-7xl px-6 py-8">

        {/* HEADER */}

        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

          <div>
            <div className="text-sm font-medium text-cyan-400">
              POLYGATE ENERGY AI
            </div>

            <h1 className="mt-1 text-3xl font-bold tracking-tight">
              Polygate Predict
            </h1>

            <p className="mt-2 text-slate-400">
              Predictive maintenance and machine-learning intelligence
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className={`rounded-full border px-4 py-2 text-xs font-semibold ${
              realtimeStatus === "SUBSCRIBED"
                ? "border-emerald-900 bg-emerald-950/40 text-emerald-400"
                : realtimeStatus === "CHANNEL_ERROR" || realtimeStatus === "TIMED_OUT"
                  ? "border-red-900 bg-red-950/40 text-red-400"
                  : "border-yellow-900 bg-yellow-950/40 text-yellow-400"
            }`}>
              {realtimeStatus === "SUBSCRIBED"
                ? " LIVE  REALTIME CONNECTED"
                : realtimeStatus === "CHANNEL_ERROR" || realtimeStatus === "TIMED_OUT"
                  ? " OFFLINE  POLLING FALLBACK"
                  : " CONNECTING  REALTIME"}
            </div>
            <button
              onClick={loadData}
              className="rounded-lg border border-slate-700 px-4 py-2 text-sm font-medium hover:bg-slate-900"
            >
              Refresh
            </button>
          </div>

        </div>


        {/* ASSET */}

        <section className="mt-8 rounded-2xl border border-slate-800 bg-slate-900/60 p-6">

          <div className="text-xs uppercase tracking-wider text-slate-500">
            Asset
          </div>

          <div className="mt-2 flex flex-col gap-1 md:flex-row md:items-end md:gap-3">

            <h2 className="text-2xl font-semibold">
              {predictData?.equipment_name}
            </h2>

            <span className="text-slate-500">
              {predictData?.equipment_id}
            </span>

          </div>

        </section>


        {/* TOP METRICS */}

        <section className="mt-6 grid gap-4 md:grid-cols-4">

          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">

            <div className="text-sm text-slate-500">
              Anomaly Index
            </div>

            <div className="mt-2 text-3xl font-bold">
              {predictData?.anomaly_index}
            </div>

          </div>


          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">

            <div className="text-sm text-slate-500">
              Signal State
            </div>

            <div className="mt-2 text-xl font-semibold text-amber-300">
              {predictData?.status}
            </div>

          </div>


          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">

            <div className="text-sm text-slate-500">
              Prediction Horizon
            </div>

            <div className="mt-2 text-xl font-semibold">
              {predictData?.prediction_horizon}
            </div>

          </div>


          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">

            <div className="text-sm text-slate-500">
              Analysis Mode
            </div>

            <div className="mt-2 text-xl font-semibold">
              {predictData?.prediction_mode}
            </div>

          </div>

        </section>


        {/* SENSOR SIGNAL TIMELINE */}

        <SensorSignalTimeline />

        {/* TREND INTELLIGENCE */}

        <section className="mt-8">

          <h2 className="text-xl font-semibold">
            C-104 Trend Intelligence
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Derived from the available C-104 sensor history.
          </p>

          <div className="mt-4 grid gap-4 md:grid-cols-4">

            <TrendCard
              label="Vibration"
              value={features?.vibration_change_percent}
              unit="%"
            />

            <TrendCard
              label="Temperature"
              value={features?.temperature_change_percent}
              unit="%"
            />

            <TrendCard
              label="Flow"
              value={features?.flow_change_percent}
              unit="%"
            />

            <TrendCard
              label="Pressure"
              value={features?.pressure_change_percent}
              unit="%"
            />

          </div>

        </section>


        {/* ENGINEERING ACTION PLAN */}

        <section className="mt-10">
          <div>
            <div className="text-xs font-medium uppercase tracking-wider text-cyan-400">
              Engineering Intelligence
            </div>
            <h2 className="mt-1 text-2xl font-semibold">
              Engineering Action Plan
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Decision-support actions generated from observed sensor trends and maintenance history.
            </p>
          </div>

          <div className="mt-5 space-y-3">
            {predictData?.action_plan?.map((action, index) => (
              <div
                key={`${action.trigger}-${index}`}
                className="rounded-2xl border border-slate-800 bg-slate-900 p-5"
              >
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div>
                    <div className="text-xs uppercase tracking-wider text-slate-500">
                      Trigger
                    </div>
                    <div className="mt-1 text-lg font-semibold">
                      {action.trigger}
                    </div>
                  </div>
                  <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${
                    action.priority === "High"
                      ? "border-red-900 bg-red-950/40 text-red-400"
                      : action.priority === "Medium"
                        ? "border-yellow-900 bg-yellow-950/40 text-yellow-400"
                        : "border-slate-700 bg-slate-950 text-slate-400"
                  }`}>
                    {action.priority} Priority
                  </span>
                </div>

                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  <div>
                    <div className="text-xs uppercase tracking-wider text-slate-500">
                      Recommended Review
                    </div>
                    <div className="mt-1 text-sm text-slate-200">
                      {action.recommended_review}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs uppercase tracking-wider text-slate-500">
                      Evidence
                    </div>
                    <div className="mt-1 text-sm text-slate-400">
                      {action.evidence}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 rounded-xl border border-slate-800 bg-slate-950/60 p-4 text-xs text-slate-500">
            Decision support only. Recommendations are generated from the available sensor trends and maintenance history; they are not a diagnosis or calibrated failure prediction.
          </div>
        </section>

                {/* ML BENCHMARK MODEL */}

        {modelInfo && (
          <section className="mt-10">

            <div>

              <div className="text-xs font-medium uppercase tracking-wider text-cyan-400">
                Machine Learning
              </div>

              <h2 className="mt-1 text-2xl font-semibold">
                ML Benchmark Model
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Supervised machine-failure classification benchmark.
              </p>

            </div>


            {/* MODEL METRICS */}

            <div className="mt-5 grid gap-4 md:grid-cols-4">

              <MetricCard
                label="ROC-AUC"
                value={modelInfo.metrics.roc_auc.toFixed(4)}
              />

              <MetricCard
                label="Precision"
                value={`${(
                  modelInfo.metrics.precision * 100
                ).toFixed(2)}%`}
              />

              <MetricCard
                label="Recall"
                value={`${(
                  modelInfo.metrics.recall * 100
                ).toFixed(2)}%`}
              />

              <MetricCard
                label="F1 Score"
                value={modelInfo.metrics.f1.toFixed(4)}
              />

            </div>


            {/* MODEL DETAILS */}

            <div className="mt-5 grid gap-5 lg:grid-cols-2">

              <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">

                <h3 className="text-lg font-semibold">
                  Model & Dataset
                </h3>

                <div className="mt-5 space-y-4">

                  <InfoRow
                    label="Model"
                    value={modelInfo.model}
                  />

                  <InfoRow
                    label="Dataset"
                    value={modelInfo.dataset}
                  />

                  <InfoRow
                    label="Dataset Rows"
                    value={modelInfo.dataset_rows.toLocaleString()}
                  />

                  <InfoRow
                    label="Failure Cases"
                    value={modelInfo.failure_cases.toLocaleString()}
                  />

                  <InfoRow
                    label="Target"
                    value={modelInfo.target}
                  />

                </div>

              </div>


              <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">

                <h3 className="text-lg font-semibold">
                  Feature Importance
                </h3>

                <div className="mt-5 space-y-4">

                  {Object.entries(
                    modelInfo.feature_importance
                  )
                    .sort(
                      ([, a], [, b]) => b - a
                    )
                    .map(
                      ([feature, importance]) => (
                        <div key={feature}>

                          <div className="flex justify-between gap-4 text-sm">

                            <span className="text-slate-300">
                              {feature}
                            </span>

                            <span className="text-slate-500">
                              {(importance * 100).toFixed(2)}%
                            </span>

                          </div>

                          <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-800">

                            <div
                              className="h-full rounded-full bg-cyan-500"
                              style={{
                                width: `${importance * 100}%`,
                              }}
                            />

                          </div>

                        </div>
                      )
                    )}

                </div>

              </div>

            </div>


            {/* MODEL SCOPE */}

            <div className="mt-5 rounded-2xl border border-amber-500/20 bg-amber-500/5 p-6">

              <div className="text-sm font-semibold text-amber-300">
                Model Scope
              </div>

              <p className="mt-2 text-sm leading-6 text-slate-400">
                {modelInfo.model_scope}
              </p>

            </div>

          </section>
        )}


        {/* CROSS-VALIDATION */}

        {validationInfo && (
          <section className="mt-10">

            <div>
              <div className="text-xs font-medium uppercase tracking-wider text-cyan-400">
                Model Validation
              </div>

              <h2 className="mt-1 text-2xl font-semibold">
                5-Fold Cross-Validation
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Stratified evaluation across five benchmark folds.
              </p>
            </div>

            {/* SUMMARY METRICS */}

            <div className="mt-5 grid gap-4 md:grid-cols-4">

              <ValidationMetricCard
                label="ROC-AUC"
                value={validationInfo.cross_validation.summary.roc_auc.mean}
                std={validationInfo.cross_validation.summary.roc_auc.std}
              />

              <ValidationMetricCard
                label="Precision"
                value={validationInfo.cross_validation.summary.precision.mean}
                std={validationInfo.cross_validation.summary.precision.std}
              />

              <ValidationMetricCard
                label="Recall"
                value={validationInfo.cross_validation.summary.recall.mean}
                std={validationInfo.cross_validation.summary.recall.std}
              />

              <ValidationMetricCard
                label="F1 Score"
                value={validationInfo.cross_validation.summary.f1.mean}
                std={validationInfo.cross_validation.summary.f1.std}
              />

            </div>

            {/* FOLD RESULTS */}

            <div className="mt-5 rounded-2xl border border-slate-800 bg-slate-900 p-6">

              <h3 className="text-lg font-semibold">
                Fold Results
              </h3>

              <div className="mt-5 overflow-x-auto">

                <table className="w-full text-left text-sm">

                  <thead>
                    <tr className="border-b border-slate-800 text-slate-500">
                      <th className="pb-3 pr-4 font-medium">Fold</th>
                      <th className="pb-3 pr-4 font-medium">ROC-AUC</th>
                      <th className="pb-3 pr-4 font-medium">Precision</th>
                      <th className="pb-3 pr-4 font-medium">Recall</th>
                      <th className="pb-3 font-medium">F1</th>
                    </tr>
                  </thead>

                  <tbody>

                    {validationInfo.cross_validation.folds.map(
                      (fold) => (
                        <tr
                          key={fold.fold}
                          className="border-b border-slate-800/70 last:border-0"
                        >

                          <td className="py-4 pr-4 font-medium text-slate-300">
                            Fold {fold.fold}
                          </td>

                          <td className="py-4 pr-4 text-slate-400">
                            {fold.roc_auc.toFixed(4)}
                          </td>

                          <td className="py-4 pr-4 text-slate-400">
                            {fold.precision.toFixed(4)}
                          </td>

                          <td className="py-4 pr-4 text-slate-400">
                            {fold.recall.toFixed(4)}
                          </td>

                          <td className="py-4 text-slate-400">
                            {fold.f1.toFixed(4)}
                          </td>

                        </tr>
                      )
                    )}

                  </tbody>

                </table>

              </div>

            </div>

            {/* VALIDATION DETAILS */}

            <div className="mt-5 grid gap-5 lg:grid-cols-2">

              <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">

                <h3 className="text-lg font-semibold">
                  Validation Method
                </h3>

                <div className="mt-5 space-y-4">

                  <InfoRow
                    label="Method"
                    value={validationInfo.cross_validation.method}
                  />

                  <InfoRow
                    label="Shuffle"
                    value={
                      validationInfo.cross_validation.shuffle
                        ? "Enabled"
                        : "Disabled"
                    }
                  />

                  <InfoRow
                    label="Random State"
                    value={String(
                      validationInfo.cross_validation.random_state
                    )}
                  />

                  <InfoRow
                    label="Dataset Rows"
                    value={validationInfo.dataset_rows.toLocaleString()}
                  />

                </div>

              </div>

              <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-6">

                <div className="text-sm font-semibold text-amber-300">
                  Validation Scope
                </div>

                <p className="mt-2 text-sm leading-6 text-slate-400">
                  {validationInfo.scope}
                </p>

              </div>

            </div>

          </section>
        )}

        {/* MODEL EXPLAINABILITY */}
        <div id="model-explainability">
          <div id="model-explainability">
          <ModelExplainability inputs={machineInputs} explainTrigger={explainTrigger} />
        </div>
        </div>

        {/* INTERACTIVE ML PREDICTION */}

        <MLPredictionSimulator onInputsChange={handleMachineInputsChange} onExplain={handleExplainPrediction} />


        {/* METHOD */}

        <section className="mt-10 rounded-2xl border border-slate-800 bg-slate-900 p-6">

          <h2 className="text-lg font-semibold">
            Method
          </h2>

          <p className="mt-3 text-sm leading-6 text-slate-400">
            {predictData?.method}
          </p>

          <div className="mt-5 flex flex-wrap gap-3">

            <a
              href="/operations"
              className="rounded-lg border border-slate-700 px-4 py-2 text-sm hover:bg-slate-800"
            >
              Operations Command Center
            </a>

            <a
              href="/fieldflow"
              className="rounded-lg border border-slate-700 px-4 py-2 text-sm hover:bg-slate-800"
            >
              FieldFlow
            </a>

          </div>

        </section>

      </div>
    </main>
  );
}


function TrendCard({
  label,
  value,
  unit,
}: {
  label: string;
  value?: number;
  unit: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">

      <div className="text-sm text-slate-500">
        {label}
      </div>

      <div className="mt-2 text-2xl font-bold">
        {value !== undefined
          ? `${value > 0 ? "+" : ""}${value}${unit}`
          : "â€”"}
      </div>

    </div>
  );
}


function ValidationMetricCard({
  label,
  value,
  std,
}: {
  label: string;
  value: number;
  std: number;
}) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">

      <div className="text-sm text-slate-500">
        {label}
      </div>

      <div className="mt-2 text-2xl font-bold">
        {(value * 100).toFixed(2)}%
      </div>

      <div className="mt-1 text-xs text-slate-500">
         {(std * 100).toFixed(2)}%
      </div>

    </div>
  );
}

function MetricCard({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">

      <div className="text-sm text-slate-500">
        {label}
      </div>

      <div className="mt-2 text-2xl font-bold">
        {value}
      </div>

    </div>
  );
}


function InfoRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-slate-800 pb-3">

      <span className="text-sm text-slate-500">
        {label}
      </span>

      <span className="max-w-[65%] text-right text-sm text-slate-200">
        {value}
      </span>

    </div>
  );
}

























