import { useMemo, useState } from "react";

type SearchFilterMockupProps = {
  description?: string;
};

type Item = {
  id: string;
  name: string;
  category: "タスク" | "ドキュメント" | "ナレッジ";
  updatedAt: string;
};

const mockItems: Item[] = [
  { id: "1", name: "Sprint Planning Checklist", category: "ドキュメント", updatedAt: "2026-02-01" },
  { id: "2", name: "障害対応 Runbook", category: "ナレッジ", updatedAt: "2026-02-03" },
  { id: "3", name: "Release Task - iOS", category: "タスク", updatedAt: "2026-01-28" },
  { id: "4", name: "QA Regression Plan", category: "ドキュメント", updatedAt: "2026-02-05" },
];

export function SearchFilterMockup({ description }: SearchFilterMockupProps) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<"all" | Item["category"]>("all");
  const [sortBy, setSortBy] = useState<"updated_desc" | "updated_asc" | "name_asc">("updated_desc");

  const filtered = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    let rows = mockItems.filter((item) => {
      const hitQuery = normalizedQuery.length === 0 || item.name.toLowerCase().includes(normalizedQuery);
      const hitCategory = category === "all" || item.category === category;
      return hitQuery && hitCategory;
    });

    rows = [...rows].sort((a, b) => {
      if (sortBy === "name_asc") return a.name.localeCompare(b.name);
      if (sortBy === "updated_asc") return a.updatedAt.localeCompare(b.updatedAt);
      return b.updatedAt.localeCompare(a.updatedAt);
    });
    return rows;
  }, [category, query, sortBy]);

  return (
    <div className="mx-auto max-w-xl rounded-lg border border-gray-200 bg-white p-6">
      <h2 className="text-xl font-semibold text-gray-900">検索・絞り込み</h2>
      {description ? <p className="mt-2 text-sm text-gray-500">{description}</p> : null}

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <input
          type="text"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="キーワード検索"
          className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 sm:col-span-3"
        />
        <select
          value={category}
          onChange={(event) => setCategory(event.target.value as "all" | Item["category"])}
          className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">すべてのカテゴリ</option>
          <option value="タスク">タスク</option>
          <option value="ドキュメント">ドキュメント</option>
          <option value="ナレッジ">ナレッジ</option>
        </select>
        <select
          value={sortBy}
          onChange={(event) => setSortBy(event.target.value as "updated_desc" | "updated_asc" | "name_asc")}
          className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 sm:col-span-2"
        >
          <option value="updated_desc">更新日: 新しい順</option>
          <option value="updated_asc">更新日: 古い順</option>
          <option value="name_asc">名前: 昇順</option>
        </select>
      </div>

      <div className="mt-4 rounded-md border border-gray-200">
        {filtered.length === 0 ? (
          <p className="p-4 text-sm text-gray-500">検索条件に一致するデータはありません。</p>
        ) : (
          <ul className="divide-y divide-gray-200">
            {filtered.map((item) => (
              <li key={item.id} className="flex items-center justify-between gap-3 p-3">
                <div>
                  <p className="text-sm font-medium text-gray-900">{item.name}</p>
                  <p className="text-xs text-gray-500">{item.category}</p>
                </div>
                <p className="text-xs text-gray-500">{item.updatedAt}</p>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="mt-4 rounded-md bg-gray-50 p-3 text-xs text-gray-500">
        <p className="mb-1 font-medium">仕様情報:</p>
        <ul className="list-inside list-disc space-y-0.5">
          <li>キーワード検索は部分一致（2文字以上で実行）</li>
          <li>カテゴリ絞り込みと並び替えの組み合わせが可能</li>
          <li>0件時は空状態メッセージを表示</li>
          <li>検索条件は画面遷移後も保持</li>
        </ul>
      </div>
    </div>
  );
}
