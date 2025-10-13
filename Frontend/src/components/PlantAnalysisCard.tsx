import React from "react";

export type Confidence = "low" | "medium" | "high";
export type Urgency = "low" | "medium" | "high";

export interface PlantAnalysis {
  likelyDiseases: { name: string; confidence: Confidence; why: string }[];
  urgency: Urgency;
  careSteps: string[];
  prevention: string[];
}

type Props = {
  data?: PlantAnalysis;                 // analysis from the API
  imageUrl?: string;                    // preview of uploaded photo (optional)
  description?: string;                 // user text description (optional)
  loading?: boolean;                    // show skeleton
  error?: string | null;                // error message
  rateLimitedUntil?: Date | null;       // if you want to show next-try time
  onRetry?: () => void;                 // retry handler
};

const urgencyStyles: Record<Urgency, string> = {
  low: "bg-green-100 text-green-800 border-green-200",
  medium: "bg-amber-100 text-amber-800 border-amber-200",
  high: "bg-red-100 text-red-800 border-red-200",
};

const confidenceToPct = (c: Confidence) =>
  c === "high" ? 100 : c === "medium" ? 65 : 35;

export default function PlantAnalysisCard({
  data,
  imageUrl,
  description,
  loading,
  error,
  rateLimitedUntil,
  onRetry,
}: Props) {
  // Skeleton state
  if (loading) {
    return (
      <div className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm">
        <div className="mb-4 h-6 w-56 animate-pulse rounded bg-neutral-200" />
        <div className="mb-3 h-4 w-80 animate-pulse rounded bg-neutral-200" />
        <div className="grid gap-4 md:grid-cols-2">
          <div className="h-48 animate-pulse rounded-lg bg-neutral-200" />
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-4 w-full animate-pulse rounded bg-neutral-200" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Error / rate limit
  if (error || rateLimitedUntil) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-4 shadow-sm">
        <div className="mb-2 text-red-800 font-semibold">Analysis Error</div>
        <p className="text-sm text-red-700">
          {rateLimitedUntil
            ? `Our plant AI is getting a lot of love right now. Please try again around ${rateLimitedUntil.toLocaleTimeString()}.`
            : error}
        </p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="mt-3 inline-flex items-center gap-2 rounded-lg border border-red-300 bg-white px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-100"
          >
            ↻ Retry
          </button>
        )}
      </div>
    );
  }

  if (!data) {
    return (
      <div className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm">
        <p className="text-neutral-600 text-sm">No analysis yet. Upload a photo or describe the issue to get started.</p>
      </div>
    );
  }

  const { likelyDiseases, urgency, careSteps, prevention } = data;

  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
      {/* Header */}
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h3 className="text-xl font-bold text-neutral-900">AI Analysis Results</h3>
          <p className="text-sm text-neutral-600">Detailed diagnosis and care recommendations</p>
        </div>
        <span
          className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${urgencyStyles[urgency]}`}
          title={`Urgency: ${urgency}`}
        >
          🌡️ Urgency: {capitalize(urgency)}
        </span>
      </div>

      {/* Meta: image + description */}
      {(imageUrl || description) && (
        <div className="mb-5 grid gap-4 md:grid-cols-2">
          {imageUrl ? (
            <div className="overflow-hidden rounded-xl border border-neutral-200">
              <img
                src={imageUrl}
                alt="Uploaded plant"
                className="h-48 w-full object-cover"
              />
            </div>
          ) : (
            <div className="hidden md:block" />
          )}
          {description && (
            <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-3">
              <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-neutral-500">
                Description
              </div>
              <p className="text-sm text-neutral-800">{description}</p>
            </div>
          )}
        </div>
      )}

      {/* Likely diseases */}
      <section className="mb-6">
        <h4 className="mb-3 text-sm font-semibold text-neutral-700">Likely Diseases</h4>
        <div className="grid gap-3">
          {likelyDiseases.map((d, idx) => (
            <div key={idx} className="rounded-xl border border-neutral-200 p-3">
              <div className="mb-1 flex items-center justify-between">
                <div className="font-medium text-neutral-900">{d.name}</div>
                <ConfidenceBadge confidence={d.confidence} />
              </div>
              <div className="mb-2 h-2 w-full overflow-hidden rounded bg-neutral-100">
                <div
                  className="h-2 rounded bg-emerald-500"
                  style={{ width: `${confidenceToPct(d.confidence)}%` }}
                />
              </div>
              <p className="text-sm text-neutral-700">{d.why}</p>
            </div>
          ))}
          {likelyDiseases.length === 0 && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
              No confident diagnosis. Try a clearer photo or add more detail.
            </div>
          )}
        </div>
      </section>

      {/* Care steps */}
      <section className="mb-6">
        <h4 className="mb-3 text-sm font-semibold text-neutral-700">Care Steps</h4>
        <ol className="list-decimal space-y-2 pl-5 text-sm text-neutral-800">
          {careSteps.map((s, i) => (
            <li key={i}>{s}</li>
          ))}
        </ol>
      </section>

      {/* Prevention */}
      <section>
        <h4 className="mb-3 text-sm font-semibold text-neutral-700">Prevention</h4>
        <ul className="list-disc space-y-2 pl-5 text-sm text-neutral-800">
          {prevention.map((p, i) => (
            <li key={i}>{p}</li>
          ))}
        </ul>
      </section>

      <p className="mt-5 text-xs text-neutral-500">
        ⚠️ AI guidance only — always verify with a local agronomist or plant pathologist for critical cases.
      </p>
    </div>
  );
}

/* Helpers */

function ConfidenceBadge({ confidence }: { confidence: Confidence }) {
  const map: Record<Confidence, string> = {
    low: "bg-neutral-100 text-neutral-700 border-neutral-200",
    medium: "bg-amber-100 text-amber-800 border-amber-200",
    high: "bg-emerald-100 text-emerald-800 border-emerald-200",
  };
  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-semibold ${map[confidence]}`}>
      {capitalize(confidence)} confidence
    </span>
  );
}

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}