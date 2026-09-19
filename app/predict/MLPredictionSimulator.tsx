"use client";

import { useEffect, useState } from "react";

export type MachineInputs = {
  air_temperature_K: number;
  process_temperature_K: number;
  rotational_speed_rpm: number;
  torque_Nm: number;
  tool_wear_min: number;
};

type PredictionResult = {
  prediction: number;
  failure_probability_percent: number;
  model: string;
  model_dataset: string;
  model_scope: string;
};

type Preset = {
  name: string;
  description: string;
  airTemperature: string;
  processTemperature: string;
  rotationalSpeed: string;
  torque: string;
  toolWear: string;
};

const PRESETS: Preset[] = [
  {
    name: "Benchmark Example",
    description: "Actual non-failure example from AI4I dataset",
    airTemperature: "298.1",
    processTemperature: "308.6",
    rotationalSpeed: "1551",
    torque: "42.8",
    toolWear: "0",
  },
  {
    name: "Observed Failure",
    description: "Actual failure example from AI4I dataset",
    airTemperature: "298.9",
    processTemperature: "309.1",
    rotationalSpeed: "2861",
    torque: "4.6",
    toolWear: "143",
  },
  {
    name: "Failure Example 2",
    description: "Actual failure example from AI4I dataset",
    airTemperature: "298.9",
    processTemperature: "309.0",
    rotationalSpeed: "1410",
    torque: "65.7",
    toolWear: "191",
  },
];

export default function MLPredictionSimulator({
  onInputsChange,
  onExplain,
}: {
  onInputsChange?: (inputs: MachineInputs) => void;
  onExplain?: () => void;
}) {
  const [airTemperature, setAirTemperature] =
    useState("298.1");

  const [processTemperature, setProcessTemperature] =
    useState("308.6");

  const [rotationalSpeed, setRotationalSpeed] =
    useState("1551");

  const [torque, setTorque] =
    useState("42.8");

  const [toolWear, setToolWear] =
    useState("0");

  const [result, setResult] =
    useState<PredictionResult | null>(null);

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  useEffect(() => {
    onInputsChange?.({
      air_temperature_K: Number(airTemperature),
      process_temperature_K: Number(processTemperature),
      rotational_speed_rpm: Number(rotationalSpeed),
      torque_Nm: Number(torque),
      tool_wear_min: Number(toolWear),
    });
  }, [
    airTemperature,
    processTemperature,
    rotationalSpeed,
    torque,
    toolWear,
    onInputsChange,
  ]);
  function applyPreset(preset: Preset) {
    setAirTemperature(preset.airTemperature);
    setProcessTemperature(preset.processTemperature);
    setRotationalSpeed(preset.rotationalSpeed);
    setTorque(preset.torque);
    setToolWear(preset.toolWear);

    setResult(null);
    setError("");
  }

  async function runPrediction() {
    try {
      setLoading(true);
      setError("");
      setResult(null);

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/predict/ml`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            air_temperature_K: Number(airTemperature),
            process_temperature_K: Number(
              processTemperature
            ),
            rotational_speed_rpm: Number(
              rotationalSpeed
            ),
            torque_Nm: Number(torque),
            tool_wear_min: Number(toolWear),
          }),
        }
      );

      const data = await response.json();

      if (!response.ok || data.error) {
        throw new Error(
          data.error ||
            "Prediction request failed."
        );
      }

      setResult(data);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Prediction request failed."
      );
    } finally {
      setLoading(false);
    }
  }

  function resetInputs() {
    setAirTemperature("298.1");
    setProcessTemperature("308.6");
    setRotationalSpeed("1551");
    setTorque("42.8");
    setToolWear("0");

    setResult(null);
    setError("");
  }

  return (
    <section className="mt-10">

      {/* HEADER */}

      <div>

        <div className="text-xs font-medium uppercase tracking-wider text-cyan-400">
          Interactive Machine Learning
        </div>

        <h2 className="mt-1 text-2xl font-semibold">
          ML Prediction Simulator
        </h2>

        <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-500">
          Enter machine operating conditions and run
          the trained Random Forest benchmark model.
        </p>

      </div>


      {/* PRESETS */}

      <div className="mt-5">

        <div className="mb-3 text-sm font-medium text-slate-300">
          Dataset Examples
        </div>

        <div className="grid gap-3 md:grid-cols-3">

          {PRESETS.map((preset) => (
            <button
              key={preset.name}
              onClick={() =>
                applyPreset(preset)
              }
              className="rounded-xl border border-slate-800 bg-slate-900 p-4 text-left transition hover:border-cyan-500/50 hover:bg-slate-800"
            >

              <div className="text-sm font-semibold text-white">
                {preset.name}
              </div>

              <div className="mt-1 text-xs leading-5 text-slate-500">
                {preset.description}
              </div>

            </button>
          ))}

        </div>

      </div>


      {/* MAIN GRID */}

      <div className="mt-5 grid gap-5 lg:grid-cols-2">

        {/* INPUTS */}

        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">

          <h3 className="text-lg font-semibold">
            Machine Conditions
          </h3>

          <div className="mt-5 grid gap-4">

            <InputField
              label="Air Temperature"
              unit="K"
              value={airTemperature}
              onChange={setAirTemperature}
            />

            <InputField
              label="Process Temperature"
              unit="K"
              value={processTemperature}
              onChange={setProcessTemperature}
            />

            <InputField
              label="Rotational Speed"
              unit="rpm"
              value={rotationalSpeed}
              onChange={setRotationalSpeed}
            />

            <InputField
              label="Torque"
              unit="Nm"
              value={torque}
              onChange={setTorque}
            />

            <InputField
              label="Tool Wear"
              unit="min"
              value={toolWear}
              onChange={setToolWear}
            />

          </div>


          {/* BUTTONS */}

          <div className="mt-6 flex gap-3">

            <button
              type="button"
              onClick={runPrediction}
              disabled={loading}
              className="rounded-lg bg-cyan-500 px-5 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading
                ? "Running Model..."
                : "Run ML Prediction"}
            </button>
          <button
              type="button"
              onClick={() => onExplain?.()}
              disabled={loading}
              className="rounded-lg bg-cyan-500 px-5 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading
                ? "Running Model..."
                : "Explain This Prediction"}
            </button>

            <button
              onClick={resetInputs}
              className="rounded-lg border border-slate-700 px-5 py-2.5 text-sm font-medium hover:bg-slate-800"
            >
              Reset
            </button>

          </div>


          {/* ERROR */}

          {error && (
            <div className="mt-5 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">
              {error}
            </div>
          )}

        </div>


        {/* OUTPUT */}

        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">

          <h3 className="text-lg font-semibold">
            Model Output
          </h3>


          {!result && !loading && (
            <div className="mt-8 rounded-xl border border-dashed border-slate-700 p-8 text-center">

              <div className="text-sm text-slate-500">
                No prediction yet
              </div>

              <p className="mt-2 text-xs text-slate-600">
                Select a dataset example or enter
                machine conditions and run the model.
              </p>

            </div>
          )}


          {loading && (
            <div className="mt-8 rounded-xl border border-slate-800 bg-slate-950 p-8 text-center">

              <div className="text-sm text-cyan-400">
                Running Random Forest inference...
              </div>

            </div>
          )}


          {result && (
            <div className="mt-5">

              {/* PROBABILITY */}

              <div className="rounded-xl border border-slate-800 bg-slate-950 p-6">

                <div className="text-sm text-slate-500">
                  Benchmark Failure Probability
                </div>

                <div className="mt-2 text-5xl font-bold">
                  {result.failure_probability_percent.toFixed(
                    2
                  )}
                  %
                </div>


                {/* PROBABILITY BAR */}

                <div className="mt-5">

                  <div className="h-3 overflow-hidden rounded-full bg-slate-800">

                    <div
                      className="h-full rounded-full bg-cyan-500 transition-all duration-500"
                      style={{
                        width: `${Math.min(
                          result.failure_probability_percent,
                          100
                        )}%`,
                      }}
                    />

                  </div>

                </div>


                {/* CLASSIFICATION */}

                <div className="mt-5">

                  {result.prediction === 1 ? (
                    <span className="inline-flex rounded-full border border-red-500/30 bg-red-500/10 px-3 py-1 text-sm font-medium text-red-300">
                      Model classification: Failure
                    </span>
                  ) : (
                    <span className="inline-flex rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-sm font-medium text-emerald-300">
                      Model classification: No Failure
                    </span>
                  )}

                </div>

              </div>


              {/* MODEL INFO */}

              <div className="mt-5 space-y-3">

                <InfoRow
                  label="Model"
                  value={result.model}
                />

                <InfoRow
                  label="Training Dataset"
                  value={result.model_dataset}
                />

              </div>


              {/* SCOPE */}

              <div className="mt-5 rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">

                <div className="text-xs font-semibold uppercase tracking-wider text-amber-300">
                  Important
                </div>

                <p className="mt-2 text-xs leading-5 text-slate-400">
                  {result.model_scope}
                </p>

              </div>

            </div>
          )}

        </div>

      </div>

    </section>
  );
}


function InputField({
  label,
  unit,
  value,
  onChange,
}: {
  label: string;
  unit: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">

      <div className="mb-2 flex items-center justify-between">

        <span className="text-sm text-slate-300">
          {label}
        </span>

        <span className="text-xs text-slate-600">
          {unit}
        </span>

      </div>

      <input
        type="number"
        step="any"
        value={value}
        onChange={(event) =>
          onChange(event.target.value)
        }
        className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-500"
      />

    </label>
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






