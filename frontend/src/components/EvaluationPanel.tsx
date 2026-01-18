import type { Evaluation } from "@/types/session";

type EvaluationPanelProps = {
  evaluation?: Evaluation;
  loading?: boolean;
};

export function EvaluationPanel({ evaluation, loading }: EvaluationPanelProps) {
  if (loading) {
    return <div className="rounded-lg border border-gray-200 bg-white p-4 text-sm">Evaluating...</div>;
  }
  if (!evaluation) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-4 text-sm text-gray-500">
        評価はまだ実行されていません。
      </div>
    );
  }
  return (
    <div className="space-y-3 rounded-lg border border-gray-200 bg-white p-4 text-sm">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-xs text-gray-500">Overall</div>
          <div className="text-xl font-semibold text-gray-900">{evaluation.overallScore ?? "-"} / 100</div>
        </div>
        <div
          className={`rounded-full px-3 py-1 text-xs font-semibold ${
            evaluation.passing ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"
          }`}
        >
          {evaluation.passing ? "Passing" : "Needs improvement"}
        </div>
      </div>
      <div>
        <div className="text-xs font-semibold text-gray-600">Categories</div>
        <ul className="mt-2 space-y-1">
          {evaluation.categories.map((c) => (
            <li key={c.name} className="flex items-center justify-between rounded-md bg-gray-50 px-3 py-2">
              <span className="text-sm font-medium text-gray-800">{c.name}</span>
              <span className="text-sm text-gray-700">
                {c.score ?? "-"} ({c.weight}%)
              </span>
            </li>
          ))}
        </ul>
      </div>
      {evaluation.summary && (
        <div>
          <div className="text-xs font-semibold text-gray-600">Summary</div>
          <p className="text-sm text-gray-800">{evaluation.summary}</p>
        </div>
      )}
      {evaluation.improvementAdvice && (
        <div>
          <div className="text-xs font-semibold text-gray-600">Advice</div>
          <p className="text-sm text-gray-800">{evaluation.improvementAdvice}</p>
        </div>
      )}
    </div>
  );
}
