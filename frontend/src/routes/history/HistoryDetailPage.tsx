import { useQuery } from "@tanstack/react-query";
import { getHistoryItem } from "@/services/history";
import { useParams, Link } from "react-router-dom";

export function HistoryDetailPage() {
  const { sessionId } = useParams();
  const { data, isLoading } = useQuery({
    queryKey: ["history", sessionId],
    queryFn: () => getHistoryItem(sessionId ?? ""),
    enabled: Boolean(sessionId),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-orange-300 border-t-orange-600" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="space-y-4">
        <p className="text-slate-600">セッション情報が見つかりませんでした。</p>
        <Link to="/history" className="text-sm font-medium text-orange-600 underline">
          履歴一覧に戻る
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Link to="/history" className="text-sm font-medium text-orange-600 underline">
        履歴一覧に戻る
      </Link>
      <div className="rounded-2xl border border-slate-200 bg-white/80 p-6">
        <h1 className="font-display text-2xl text-slate-900">Session {data.sessionId}</h1>
        <p className="text-sm text-slate-600">詳細表示は今後のステップで移植予定です。</p>
      </div>
    </div>
  );
}
