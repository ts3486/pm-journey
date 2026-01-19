"use client";

type SessionControlsProps = {
  hasActive: boolean;
  canResume: boolean;
  onStart: () => Promise<void> | void;
  onResume: () => Promise<void> | void;
  onReset: () => Promise<void> | void;
  onEvaluate: () => Promise<void> | void;
  evaluationReady: boolean;
  scenarioTitle?: string;
  offline?: boolean;
};

export function SessionControls({
  hasActive,
  canResume,
  onStart,
  onResume,
  onReset,
  onEvaluate,
  evaluationReady,
  scenarioTitle,
  offline = false,
}: SessionControlsProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {scenarioTitle ? <span className="rounded-md bg-gray-100 px-3 py-2 text-sm text-gray-700">{scenarioTitle}</span> : null}
      <button
        type="button"
        className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
        onClick={() => void onStart()}
      >
        Start new session
      </button>
      <button
        type="button"
        className="rounded-md border border-gray-300 px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-100 disabled:opacity-60"
        onClick={() => void onResume()}
        disabled={!canResume}
      >
        Resume last session
      </button>
      <button
        type="button"
        className="rounded-md border border-red-200 px-3 py-2 text-sm font-semibold text-red-700 hover:bg-red-50 disabled:opacity-60"
        onClick={() => void onReset()}
        disabled={!hasActive}
      >
        Reset session
      </button>
      <button
        type="button"
        className="rounded-md bg-emerald-600 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
        onClick={() => void onEvaluate()}
        disabled={!evaluationReady || offline}
      >
        {offline ? "オンライン復帰後に評価" : "Mark ready for evaluation"}
      </button>
    </div>
  );
}
