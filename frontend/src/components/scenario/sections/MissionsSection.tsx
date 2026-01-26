"use client";

import { FormSection } from "../shared";
import type { MissionInput } from "@/schemas/scenario";
import { defaultMission } from "@/schemas/scenario";

type MissionsSectionProps = {
  data: MissionInput[] | undefined;
  onChange: (value: MissionInput[]) => void;
  errors: Record<string, string>;
};

export function MissionsSection({
  data,
  onChange,
  errors,
}: MissionsSectionProps) {
  const missions = data ?? [];

  const handleAdd = () => {
    const newOrder = missions.length + 1;
    onChange([
      ...missions,
      {
        ...defaultMission,
        id: `mission-${newOrder}`,
        order: newOrder,
      },
    ]);
  };

  const handleRemove = (index: number) => {
    const newMissions = missions
      .filter((_, i) => i !== index)
      .map((m, i) => ({ ...m, order: i + 1 }));
    onChange(newMissions);
  };

  const handleChange = (
    index: number,
    field: keyof MissionInput,
    value: unknown
  ) => {
    const newMissions = [...missions];
    newMissions[index] = {
      ...newMissions[index],
      [field]: value,
    };
    onChange(newMissions);
  };

  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    const newMissions = [...missions];
    [newMissions[index - 1], newMissions[index]] = [
      newMissions[index],
      newMissions[index - 1],
    ];
    onChange(newMissions.map((m, i) => ({ ...m, order: i + 1 })));
  };

  const handleMoveDown = (index: number) => {
    if (index === missions.length - 1) return;
    const newMissions = [...missions];
    [newMissions[index], newMissions[index + 1]] = [
      newMissions[index + 1],
      newMissions[index],
    ];
    onChange(newMissions.map((m, i) => ({ ...m, order: i + 1 })));
  };

  return (
    <FormSection
      title="ミッション"
      description="段階的な目標を設定（任意）"
      optional
      defaultOpen={false}
    >
      <div className="space-y-4">
        {missions.length === 0 ? (
          <div className="text-center py-8 text-sm text-slate-500">
            ミッションが設定されていません
          </div>
        ) : (
          <div className="space-y-3">
            {missions.map((mission, index) => (
              <div
                key={mission.id || index}
                className="rounded-xl border border-slate-200/60 bg-white p-4"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center justify-center h-7 w-7 rounded-full bg-gradient-to-br from-teal-400 to-emerald-500 text-xs font-bold text-white">
                      {index + 1}
                    </span>
                    <span className="text-sm font-medium text-slate-600">
                      ミッション {index + 1}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleMoveUp(index)}
                      disabled={index === 0}
                      className="p-1 text-slate-400 hover:text-slate-600 disabled:opacity-30"
                    >
                      <svg
                        className="h-4 w-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 15l7-7 7 7"
                        />
                      </svg>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleMoveDown(index)}
                      disabled={index === missions.length - 1}
                      className="p-1 text-slate-400 hover:text-slate-600 disabled:opacity-30"
                    >
                      <svg
                        className="h-4 w-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 9l-7 7-7-7"
                        />
                      </svg>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRemove(index)}
                      className="p-1 text-slate-400 hover:text-rose-500 ml-2"
                    >
                      <svg
                        className="h-4 w-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-1">
                      <label className="text-sm font-medium text-slate-700">
                        ミッションID <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={mission.id}
                        onChange={(e) =>
                          handleChange(index, "id", e.target.value)
                        }
                        placeholder="例: intro-m1"
                        className="input-base"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-sm font-medium text-slate-700">
                        タイトル <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={mission.title}
                        onChange={(e) =>
                          handleChange(index, "title", e.target.value)
                        }
                        placeholder="例: 自己紹介を行う"
                        className="input-base"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-sm font-medium text-slate-700">
                      説明
                    </label>
                    <textarea
                      value={mission.description ?? ""}
                      onChange={(e) =>
                        handleChange(index, "description", e.target.value)
                      }
                      placeholder="ミッションの詳細..."
                      className="input-base min-h-[60px]"
                      rows={2}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {errors.missions && (
          <p className="text-xs text-rose-600">{errors.missions}</p>
        )}

        {/* Add Button */}
        <button
          type="button"
          onClick={handleAdd}
          className="w-full rounded-xl border-2 border-dashed border-slate-300 py-4 text-sm font-medium text-slate-500 transition hover:border-teal-400 hover:bg-teal-50 hover:text-teal-600"
        >
          <span className="inline-flex items-center gap-2">
            <svg
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            ミッションを追加
          </span>
        </button>
      </div>
    </FormSection>
  );
}
