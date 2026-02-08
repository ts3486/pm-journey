import { useState } from "react";

type NotificationSettingsMockupProps = {
  description?: string;
};

type NotificationState = {
  email: boolean;
  push: boolean;
  slack: boolean;
  weeklyDigest: boolean;
  incidentAlert: boolean;
  quietHours: boolean;
};

const initialState: NotificationState = {
  email: true,
  push: true,
  slack: false,
  weeklyDigest: true,
  incidentAlert: true,
  quietHours: false,
};

export function NotificationSettingsMockup({ description }: NotificationSettingsMockupProps) {
  const [state, setState] = useState<NotificationState>(initialState);
  const [saved, setSaved] = useState(false);

  const toggle =
    (key: keyof NotificationState) =>
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setSaved(false);
      setState((prev) => ({ ...prev, [key]: event.target.checked }));
    };

  return (
    <div className="mx-auto max-w-md rounded-lg border border-gray-200 bg-white p-6">
      <h2 className="text-xl font-semibold text-gray-900">通知設定</h2>
      {description ? <p className="mt-2 text-sm text-gray-500">{description}</p> : null}

      <div className="mt-5 space-y-4">
        <div>
          <p className="text-sm font-medium text-gray-800">通知チャネル</p>
          <div className="mt-2 space-y-2">
            <label className="flex items-center justify-between rounded-md border border-gray-200 px-3 py-2 text-sm">
              メール通知
              <input type="checkbox" checked={state.email} onChange={toggle("email")} />
            </label>
            <label className="flex items-center justify-between rounded-md border border-gray-200 px-3 py-2 text-sm">
              プッシュ通知
              <input type="checkbox" checked={state.push} onChange={toggle("push")} />
            </label>
            <label className="flex items-center justify-between rounded-md border border-gray-200 px-3 py-2 text-sm">
              Slack通知
              <input type="checkbox" checked={state.slack} onChange={toggle("slack")} />
            </label>
          </div>
        </div>

        <div>
          <p className="text-sm font-medium text-gray-800">通知イベント</p>
          <div className="mt-2 space-y-2">
            <label className="flex items-center justify-between rounded-md border border-gray-200 px-3 py-2 text-sm">
              週次サマリー
              <input type="checkbox" checked={state.weeklyDigest} onChange={toggle("weeklyDigest")} />
            </label>
            <label className="flex items-center justify-between rounded-md border border-gray-200 px-3 py-2 text-sm">
              障害アラート
              <input type="checkbox" checked={state.incidentAlert} onChange={toggle("incidentAlert")} />
            </label>
            <label className="flex items-center justify-between rounded-md border border-gray-200 px-3 py-2 text-sm">
              おやすみ時間 (22:00-07:00)
              <input type="checkbox" checked={state.quietHours} onChange={toggle("quietHours")} />
            </label>
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={() => setSaved(true)}
        className="mt-5 w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
      >
        設定を保存
      </button>
      {saved ? <p className="mt-2 text-xs text-green-600">通知設定を保存しました。</p> : null}

      <div className="mt-4 rounded-md bg-gray-50 p-3 text-xs text-gray-500">
        <p className="mb-1 font-medium">仕様情報:</p>
        <ul className="list-inside list-disc space-y-0.5">
          <li>チャネル別に通知ON/OFFを設定可能</li>
          <li>通知イベントごとに受信可否を設定可能</li>
          <li>おやすみ時間中はプッシュ通知を抑止</li>
          <li>保存後に再ログインしても設定を保持</li>
        </ul>
      </div>
    </div>
  );
}
