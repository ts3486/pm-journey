import { useState } from "react";
import type { Scenario, Mission } from "@/types";
import { MeetingLogViewer } from "@/components/scenario/MeetingLogViewer";
import { ProjectOverviewSection } from "@/components/scenario/ProjectOverviewSection";
import { addOutput } from "@/services/outputs";
import type { SessionState } from "@/services/sessions";

type SingleSubmitScenarioLayoutProps = {
  scenario: Scenario;
  state: SessionState | null;
  sessionId?: string;
  missions: Mission[];
  missionStatusMap: Map<string, boolean>;
  allMissionsComplete: boolean;
  requiresMissionCompletion: boolean;
  canCompleteScenario: boolean;
  onComplete: () => void;
  onReset: () => void;
  onOpenGuide?: () => void;
  onMissionToggle: (missionId: string, completed: boolean) => void;
};

export function SingleSubmitScenarioLayout({
  scenario,
  state,
  sessionId,
  missions,
  missionStatusMap,
  allMissionsComplete,
  requiresMissionCompletion,
  canCompleteScenario,
  onComplete,
  onReset,
  onOpenGuide,
  onMissionToggle,
}: SingleSubmitScenarioLayoutProps) {
  const hasActive = Boolean(state?.session);
  const [formValue, setFormValue] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isMeetingMinutes = scenario.id === "basic-meeting-minutes";

  const handleComplete = async () => {
    if (!sessionId || isSubmitting) return;
    const trimmed = formValue.trim();
    if (trimmed) {
      setIsSubmitting(true);
      try {
        await addOutput(sessionId, "text", trimmed, "single-submit");
      } finally {
        setIsSubmitting(false);
      }
    }
    onComplete();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <section className="card p-6 reveal">
        <div className="space-y-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
                SOFT SKILLS Scenario
              </p>
              <h1 className="font-display text-2xl text-slate-900">
                {scenario.title}
              </h1>
              <p className="max-w-2xl text-sm text-slate-600">
                {scenario.description}
              </p>
            </div>
            {onOpenGuide ? (
              <button
                type="button"
                className="rounded-lg border border-orange-300 bg-white px-3 py-1.5 text-xs font-semibold text-orange-700 transition hover:border-orange-400 hover:bg-orange-50 hover:text-orange-800"
                onClick={onOpenGuide}
              >
                シナリオガイドを見る
              </button>
            ) : null}
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        {/* Left column: instructions, meeting log, form */}
        <div className="space-y-4">
          {/* Instructions */}
          <div className="card border-orange-200/60 p-4">
            <h3 className="mb-2 text-sm font-semibold text-orange-700">
              ミッション
            </h3>
            <p className="text-sm leading-relaxed text-slate-700">
              {scenario.kickoffPrompt}
            </p>
          </div>

          {/* Meeting log (議事録 only) */}
          {isMeetingMinutes ? (
            <MeetingLogViewer
              src="/assets/ミーティングログ.txt"
              title="ミーティングログ"
            />
          ) : null}

          {/* Form */}
          <div className="card p-4">
            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-slate-900">
                {isMeetingMinutes ? "議事録" : "自己紹介"}
              </span>
              <textarea
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-orange-400 focus:ring-1 focus:ring-orange-400 focus:outline-none"
                rows={12}
                placeholder={
                  isMeetingMinutes
                    ? "ミーティングログを読み、議事録を作成してください。フォーマットは自由です。"
                    : "回答を入力してください"
                }
                value={formValue}
                onChange={(e) => setFormValue(e.target.value)}
                disabled={isSubmitting}
              />
            </label>
          </div>
        </div>

        {/* Right column: missions + completion */}
        <div className="space-y-4">
          <div className="card p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-900">ミッション</p>
              </div>
            </div>
            <ul className="mt-3 space-y-2">
              {missions.length === 0 ? (
                <li className="text-xs text-slate-500">設定されたミッションはありません。</li>
              ) : (
                missions
                  .slice()
                  .sort((a, b) => a.order - b.order)
                  .map((mission) => {
                    const done = missionStatusMap.get(mission.id) ?? false;
                    return (
                      <li key={mission.id}>
                        <label className="flex cursor-pointer items-start gap-2 rounded-xl border border-slate-200/70 px-3 py-2">
                          <input
                            type="checkbox"
                            className="mt-1 h-4 w-4 rounded border-slate-300 text-orange-600 focus:ring-orange-500"
                            checked={done}
                            name={`mission-${mission.id}`}
                            onChange={(event) => onMissionToggle(mission.id, event.target.checked)}
                          />
                          <div>
                            <p className="text-sm font-medium text-slate-900">{mission.title}</p>
                            {mission.description ? (
                              <p className="text-xs text-slate-600">{mission.description}</p>
                            ) : null}
                          </div>
                        </label>
                      </li>
                    );
                  })
              )}
            </ul>
          </div>

          <div className="card-muted px-4 py-4 text-sm text-slate-700">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-slate-900">
                  {allMissionsComplete ? "ミッション達成" : "評価を実行"}
                </p>
              </div>
              <button
                type="button"
                className="btn-primary disabled:cursor-not-allowed disabled:opacity-50"
                onClick={() => void handleComplete()}
                disabled={!canCompleteScenario || isSubmitting}
              >
                {isSubmitting ? "提出中..." : "シナリオを完了する"}
              </button>
            </div>
            {requiresMissionCompletion && !allMissionsComplete ? (
              <p className="mt-2 text-xs text-slate-500">
                すべてのミッションを達成してからシナリオを完了できます。必要であれば手動でチェックして完了できます。
              </p>
            ) : null}
          </div>

          <ProjectOverviewSection scenario={scenario} />

          {hasActive ? (
            <div className="flex justify-end">
              <button
                type="button"
                className="text-xs text-slate-400 transition hover:text-slate-600"
                onClick={onReset}
                aria-label="セッションをリセット"
                title="セッションをリセット"
              >
                セッションをリセット
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
