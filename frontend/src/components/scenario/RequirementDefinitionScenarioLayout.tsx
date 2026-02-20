import type { Mission, Scenario } from "@/types";
import { ChatComposer } from "@/components/chat/ChatComposer";
import { ChatStream } from "@/components/chat/ChatStream";
import {
  FileUploadMockup,
  FormMockup,
  LoginMockup,
  NotificationSettingsMockup,
  PasswordResetMockup,
  ProfileEditMockup,
  SearchFilterMockup,
} from "@/components/mockups";
import { ProjectOverviewSection } from "@/components/scenario/ProjectOverviewSection";
import type { SessionState } from "@/services/sessions";

type RequirementDefinitionScenarioLayoutProps = {
  scenario: Scenario;
  state: SessionState | null;
  awaitingReply: boolean;
  onSend: (content: string) => void;
  onComplete: () => void;
  onReset: () => void;
  onOpenGuide?: () => void;
  missions: Mission[];
  missionStatusMap: Map<string, boolean>;
  onMissionToggle: (missionId: string, done: boolean) => void;
  canCompleteScenario: boolean;
  allMissionsComplete: boolean;
  requiresMissionCompletion: boolean;
};

const quickPrompts = [
  "要件の曖昧な部分を整理したい",
  "受入条件を具体化したい",
  "エッジケースの洗い出しを手伝って",
];

export function RequirementDefinitionScenarioLayout({
  scenario,
  state,
  awaitingReply,
  onSend,
  onComplete,
  onReset,
  onOpenGuide,
  missions,
  missionStatusMap,
  onMissionToggle,
  canCompleteScenario,
  allMissionsComplete,
  requiresMissionCompletion,
}: RequirementDefinitionScenarioLayoutProps) {
  const hasActive = Boolean(state?.session);
  const mockupComponent = scenario.featureMockup?.component;

  const renderMockup = () => {
    const description = scenario.featureMockup?.description;
    switch (mockupComponent) {
      case "login":
        return <LoginMockup description={description} />;
      case "form":
        return <FormMockup description={description} />;
      case "file-upload":
        return <FileUploadMockup description={description} />;
      case "password-reset":
        return <PasswordResetMockup description={description} />;
      case "search-filter":
        return <SearchFilterMockup description={description} />;
      case "notification-settings":
        return <NotificationSettingsMockup description={description} />;
      case "profile-edit":
        return <ProfileEditMockup description={description} />;
      default:
        return (
          <div className="rounded-lg bg-gray-100 p-8 text-center text-gray-500">
            デザインが設定されていません
          </div>
        );
    }
  };

  return (
    <div className="space-y-6">
      <section className="card p-6 reveal">
        <div className="space-y-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">REQUIREMENT DEFINITION Scenario</p>
              <h1 className="font-display text-2xl text-slate-900">{scenario.title}</h1>
              <p className="max-w-2xl text-sm text-slate-600">{scenario.description}</p>
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

      <div className="card p-4">
        <h3 className="mb-4 text-sm font-semibold text-slate-900">機能デザイン</h3>
        <div className="p-4">{renderMockup()}</div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        {/* Left column: chat */}
        <div className="space-y-4">
          <ChatStream messages={state?.messages ?? []} maxHeight="60vh" isTyping={awaitingReply} />
          <ChatComposer
            onSend={onSend}
            disabled={!hasActive || awaitingReply}
            quickPrompts={quickPrompts}
          />
        </div>

        {/* Right column: missions + actions */}
        <div className="space-y-4">
          <div className="card p-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-slate-900">ミッション</p>
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
              <p className="text-sm font-semibold text-slate-900">
                {allMissionsComplete ? "ミッション達成" : "評価を実行"}
              </p>
              <button
                type="button"
                className="btn-primary disabled:cursor-not-allowed disabled:opacity-50"
                onClick={onComplete}
                disabled={!canCompleteScenario}
              >
                シナリオを完了する
              </button>
            </div>
            {requiresMissionCompletion && !allMissionsComplete ? (
              <p className="mt-2 text-xs text-slate-500">
                エージェントがミッション達成を判定すると自動でチェックされます。必要であれば手動でチェックして完了できます。
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
