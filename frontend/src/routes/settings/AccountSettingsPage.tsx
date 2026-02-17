import { useState } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import { useStorage } from "@/contexts/StorageContext";
import { useMyAccount } from "@/queries/account";
import { useCurrentOrganization } from "@/queries/organizations";
import { api } from "@/services/api";

const deleteConfirmPhrase = "アカウントを削除";

const formatDateTime = (value?: string) => {
  if (!value) return "未設定";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return new Intl.DateTimeFormat("ja-JP", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(parsed);
};

export function AccountSettingsPage() {
  const { user, logout } = useAuth0();
  const storage = useStorage();
  const { data, isLoading, isError, error } = useMyAccount();
  const { data: currentOrganization } = useCurrentOrganization();
  const [confirmText, setConfirmText] = useState("");
  const [isDeletePending, setIsDeletePending] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const canDelete = confirmText.trim() === deleteConfirmPhrase && !isDeletePending;

  const handleDeleteAccount = async () => {
    if (!canDelete) {
      setDeleteError(`確認のため「${deleteConfirmPhrase}」と入力してください。`);
      return;
    }

    setDeleteError(null);
    setIsDeletePending(true);

    try {
      await api.deleteMyAccount();
      const lastScenarioId = await storage.loadLastScenarioId();
      if (lastScenarioId) {
        await storage.clearLastSessionPointer(lastScenarioId);
      }
      logout({
        logoutParams: {
          returnTo: window.location.origin,
        },
      });
    } catch (requestError) {
      setDeleteError(requestError instanceof Error ? requestError.message : "アカウント削除に失敗しました。");
      setIsDeletePending(false);
      return;
    }

    setIsDeletePending(false);
  };

  const accountId = data?.id ?? user?.sub ?? "未設定";
  const accountName = data?.name ?? user?.name ?? "未設定";
  const accountEmail = data?.email ?? user?.email ?? "未設定";
  const accountPicture = data?.picture ?? user?.picture;
  const createdAtText = formatDateTime(data?.createdAt);
  const updatedAtText = formatDateTime(data?.updatedAt);
  const currentUserSummary = accountEmail !== "未設定" ? `${accountName} (${accountEmail})` : accountName;
  const currentRole = currentOrganization?.membership.role ?? "未所属";
  const currentOrganizationName = currentOrganization?.organization.name ?? "未所属";
  const currentOrganizationId = currentOrganization?.organization.id ?? null;

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">アカウント情報</p>
        <h1 className="font-display text-2xl text-slate-900">Account</h1>
        <p className="text-sm text-slate-600">ログイン中アカウントの基本情報と退会操作を確認できます。</p>
      </header>

      {isLoading ? (
        <section className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-600">
          アカウント情報を読み込み中...
        </section>
      ) : isError ? (
        <section className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-sm text-rose-700">
          {error instanceof Error ? error.message : "アカウント情報の取得に失敗しました。"}
        </section>
      ) : (
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-center gap-4">
            {accountPicture ? (
              <img src={accountPicture} alt={accountName} className="h-14 w-14 rounded-full border border-orange-200/80" />
            ) : (
              <div className="flex h-14 w-14 items-center justify-center rounded-full border border-slate-200 bg-slate-100 text-xs font-semibold text-slate-600">
                No Image
              </div>
            )}
            <div>
              <p className="text-base font-semibold text-slate-900">{accountName}</p>
              <p className="text-sm text-slate-600">{accountEmail}</p>
            </div>
          </div>

          <dl className="mt-5 grid gap-3 rounded-xl border border-slate-200/80 bg-slate-50/70 p-4 text-sm text-slate-700 sm:grid-cols-2">
            <div className="space-y-1">
              <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">現在のユーザー</dt>
              <dd className="break-all text-slate-800">{currentUserSummary}</dd>
            </div>
            <div className="space-y-1">
              <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">アカウントID</dt>
              <dd className="break-all font-mono text-xs text-slate-800">{accountId}</dd>
            </div>
            <div className="space-y-1">
              <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">現在のロール</dt>
              <dd className="font-semibold text-slate-900">{currentRole}</dd>
            </div>
            <div className="space-y-1">
              <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">作成日時</dt>
              <dd>{createdAtText}</dd>
            </div>
            <div className="space-y-1">
              <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">所属チーム</dt>
              <dd className="text-slate-800">
                {currentOrganizationName}
              </dd>
            </div>
            <div className="space-y-1 sm:col-span-2">
              <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">最終更新日時</dt>
              <dd>{updatedAtText}</dd>
            </div>
          </dl>
        </section>
      )}

      <section className="rounded-2xl border border-rose-200 bg-rose-50/70 p-6 shadow-sm">
        <h2 className="text-base font-semibold text-rose-900">アカウント削除</h2>
        <p className="mt-2 text-sm text-rose-700">
          この操作は取り消せません。セッション履歴、設定、組織参加情報などのアプリ内データを削除します。
        </p>
        <p className="mt-1 text-xs text-rose-600">
          他のアクティブメンバーがいる組織のオーナーの場合は、先にオーナー引き継ぎが必要です。
        </p>

        <div className="mt-4 space-y-3">
          <label htmlFor="delete-account-confirmation" className="block text-sm font-medium text-rose-800">
            確認のため「{deleteConfirmPhrase}」と入力してください
          </label>
          <input
            id="delete-account-confirmation"
            type="text"
            value={confirmText}
            onChange={(event) => {
              setConfirmText(event.target.value);
              setDeleteError(null);
            }}
            className="input-base"
            placeholder={deleteConfirmPhrase}
            disabled={isDeletePending}
          />

          {deleteError ? (
            <p className="rounded-lg border border-rose-300 bg-white px-3 py-2 text-sm text-rose-700">{deleteError}</p>
          ) : null}

          <button
            type="button"
            className="inline-flex items-center justify-center rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:bg-rose-300"
            onClick={() => void handleDeleteAccount()}
            disabled={!canDelete}
          >
            {isDeletePending ? "アカウントを削除中..." : "アカウントを削除"}
          </button>
        </div>
      </section>
    </div>
  );
}
