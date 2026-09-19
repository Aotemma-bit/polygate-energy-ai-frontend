"use client";

import { useEffect, useState } from "react";
import type { MachineInputs } from "./MLPredictionSimulator";

type Contribution = {
  feature: string;
  input_value: number;
  shap_value: number;
  direction: string;
};

type ExplainabilityResponse = {
  prediction: number;
  failure_probability_percent: number;
  model: string;
  explanation_method: string;
  feature_contributions: Contribution[];
  scope: string;
};


export default function ModelExplainability({
  inputs,
  explainTrigger,
}: {
  inputs: MachineInputs;
  explainTrigger?: number;
}) {
  const [data, setData] = useState<ExplainabilityResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function explainPrediction() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/predict/ml/explain`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(inputs),
        }
      );

      if (!response.ok) {
        throw new Error("Unable to load model explanation.");
      }

      const json = await response.json();
      setData(json);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load model explanation."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (explainTrigger && explainTrigger > 0) {
      explainPrediction();
    }
  }, [explainTrigger]);
  const maxContribution = data
    ? Math.max(
        ...data.feature_contributions.map((item) =>
          Math.abs(item.shap_value)
        )
      )
    : 1;

  return (
    <section className="mt-10">
      <div>
        <div className="text-xs font-medium uppercase tracking-wider text-cyan-400">
          Explainable AI
        </div>

        <h2 className="mt-1 text-2xl font-semibold">
          Model Explainability
        </h2>

        <p className="mt-1 text-sm text-slate-500">
          SHAP feature attribution for the benchmark Random Forest model.
        </p>
      </div>

      <div className="mt-5 rounded-2xl border border-slate-800 bg-slate-900 p-6">
        {!data && !loading && (
          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div>
              <h3 className="text-lg font-semibold">
                Explain the current prediction
              </h3>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
                This example uses an actual failure case from the UCI AI4I
                2020 benchmark dataset and shows which model features
                contributed most strongly to the prediction.
              </p>
            </div>

            <button
              onClick={explainPrediction}
              className="shrink-0 rounded-lg bg-cyan-500 px-5 py-3 text-sm font-semibold text-slate-950 hover:bg-cyan-400"
            >
              Explain Prediction
            </button>
          </div>
        )}

        {loading && (
          <div className="py-8 text-center text-sm text-slate-400">
            Calculating SHAP feature contributions...
          </div>
        )}

        {error && (
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">
            {error}
          </div>
        )}

        {data && !loading && (
          <>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-xl border border-slate-800 bg-slate-950 p-5">
                <div className="text-sm text-slate-500">Prediction</div>
                <div className="mt-2 text-3xl font-bold">
                  {data.prediction === 1 ? "Failure" : "No Failure"}
                </div>
              </div>

              <div className="rounded-xl border border-slate-800 bg-slate-950 p-5">
                <div className="text-sm text-slate-500">
                  Failure Probability
                </div>
                <div className="mt-2 text-3xl font-bold">
                  {data.failure_probability_percent.toFixed(2)}%
                </div>
              </div>

              <div className="rounded-xl border border-slate-800 bg-slate-950 p-5">
                <div className="text-sm text-slate-500">Explanation</div>
                <div className="mt-2 text-lg font-semibold">
                  {data.explanation_method}
                </div>
              </div>
            </div>

            <div className="mt-8">
              <h3 className="text-lg font-semibold">
                Feature Contributions
              </h3>

              <p className="mt-1 text-sm text-slate-500">
                Positive values increase the model's failure score; negative
                values decrease it.
              </p>

              <div className="mt-6 space-y-5">
                {data.feature_contributions.map((item) => {
                  const magnitude =
                    Math.abs(item.shap_value) / maxContribution;

                  const increases =
                    item.direction === "increases_failure_score";

                  return (
                    <div key={item.feature}>
                      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <div className="text-sm font-medium text-slate-200">
                            {item.feature}
                          </div>

                          <div className="text-xs text-slate-500">
                            Input: {item.input_value}
                          </div>
                        </div>

                        <div className="text-sm font-semibold">
                          {item.shap_value > 0 ? "+" : ""}
                          {item.shap_value.toFixed(6)}
                        </div>
                      </div>

                      <div className="mt-2 h-3 overflow-hidden rounded-full bg-slate-800">
                        <div
                          className={`h-full rounded-full ${
                            increases
                              ? "bg-cyan-500"
                              : "bg-slate-500"
                          }`}
                          style={{
                            width: `${Math.max(magnitude * 100, 2)}%`,
                          }}
                        />
                      </div>

                      <div className="mt-1 text-xs text-slate-500">
                        {increases
                          ? "Increases failure score"
                          : "Decreases failure score"}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="mt-8 rounded-xl border border-amber-500/20 bg-amber-500/5 p-5">
              <div className="text-sm font-semibold text-amber-300">
                Explainability Scope
              </div>

              <p className="mt-2 text-sm leading-6 text-slate-400">
                {data.scope}
              </p>
            </div>

            <button
              onClick={explainPrediction}
              className="mt-5 rounded-lg border border-slate-700 px-4 py-2 text-sm hover:bg-slate-800"
            >
              Re-run Explanation
            </button>
          </>
        )}
      </div>
    </section>
  );
}






