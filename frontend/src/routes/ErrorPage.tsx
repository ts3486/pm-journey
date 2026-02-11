import { Link, isRouteErrorResponse, useRouteError } from "react-router-dom";

export function ErrorPage() {
  const error = useRouteError();

  const title = "予期しないエラーが発生しました";
  const message = isRouteErrorResponse(error)
    ? error.statusText
    : error instanceof Error
      ? error.message
      : "アプリで問題が発生しました。";

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-6 py-12">
      <div className="w-full max-w-xl rounded-3xl border border-slate-200/70 bg-white p-8 shadow-xl">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-rose-400">Error</p>
        <h1 className="mt-3 text-2xl font-bold text-slate-900">{title}</h1>
        <p className="mt-3 text-sm text-slate-600">{message}</p>
        {error instanceof Error && error.stack ? (
          <pre className="mt-4 max-h-48 overflow-auto rounded-xl bg-slate-100 p-3 text-[11px] text-slate-500">
            {error.stack}
          </pre>
        ) : null}
        <div className="mt-6 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="rounded-full bg-orange-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-orange-700"
          >
            再読み込み
          </button>
          <Link
            to="/"
            className="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 transition hover:border-slate-300 hover:text-slate-900"
          >
            ホームへ戻る
          </Link>
        </div>
      </div>
    </div>
  );
}
