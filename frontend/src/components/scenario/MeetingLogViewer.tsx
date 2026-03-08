import { useEffect, useMemo, useState } from "react";

type MeetingLine = {
  speaker: string;
  text: string;
};

type MeetingHeader = {
  title: string;
};

type MeetingEntry = MeetingLine | MeetingHeader;

function isMeetingLine(entry: MeetingEntry): entry is MeetingLine {
  return "speaker" in entry;
}

function parseMeetingLog(raw: string): { entries: MeetingEntry[]; speakers: string[] } {
  const entries: MeetingEntry[] = [];
  const speakerSet = new Set<string>();
  let currentSpeaker = "";
  let currentText = "";

  for (const line of raw.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed) {
      if (currentSpeaker && currentText) {
        entries.push({ speaker: currentSpeaker, text: currentText.trim() });
        currentText = "";
      }
      continue;
    }

    // Match header lines like 【...】
    const headerMatch = trimmed.match(/^【(.+)】$/);
    if (headerMatch) {
      if (currentSpeaker && currentText) {
        entries.push({ speaker: currentSpeaker, text: currentText.trim() });
        currentText = "";
        currentSpeaker = "";
      }
      entries.push({ title: headerMatch[1] });
      continue;
    }

    // Match stage directions like （少し間）
    const stageMatch = trimmed.match(/^（.+）$/);
    if (stageMatch) {
      if (currentSpeaker && currentText) {
        entries.push({ speaker: currentSpeaker, text: currentText.trim() });
        currentText = "";
      }
      continue;
    }

    // Match speaker lines like "佐藤（PM）:" or "佐藤:"
    const speakerMatch = trimmed.match(/^(.+?)[：:]$/);
    if (speakerMatch) {
      if (currentSpeaker && currentText) {
        entries.push({ speaker: currentSpeaker, text: currentText.trim() });
        currentText = "";
      }
      currentSpeaker = speakerMatch[1];
      speakerSet.add(currentSpeaker);
    } else if (currentSpeaker) {
      currentText += (currentText ? "\n" : "") + trimmed;
    }
  }

  if (currentSpeaker && currentText) {
    entries.push({ speaker: currentSpeaker, text: currentText.trim() });
  }

  return { entries, speakers: [...speakerSet] };
}

const colorPalette = [
  { badge: "bg-blue-100 text-blue-700", bubble: "bg-blue-50 border-blue-100", initial: "bg-blue-500" },
  { badge: "bg-emerald-100 text-emerald-700", bubble: "bg-emerald-50 border-emerald-100", initial: "bg-emerald-500" },
  { badge: "bg-violet-100 text-violet-700", bubble: "bg-violet-50 border-violet-100", initial: "bg-violet-500" },
  { badge: "bg-amber-100 text-amber-700", bubble: "bg-amber-50 border-amber-100", initial: "bg-amber-500" },
  { badge: "bg-rose-100 text-rose-700", bubble: "bg-rose-50 border-rose-100", initial: "bg-rose-500" },
  { badge: "bg-cyan-100 text-cyan-700", bubble: "bg-cyan-50 border-cyan-100", initial: "bg-cyan-500" },
];

function extractDisplayName(speaker: string): { name: string; role?: string } {
  const match = speaker.match(/^(.+?)（(.+?)）$/);
  if (match) return { name: match[1], role: match[2] };
  return { name: speaker };
}

type MeetingLogViewerProps = {
  src: string;
  title?: string;
};

export function MeetingLogViewer({ src, title }: MeetingLogViewerProps) {
  const [data, setData] = useState<{ entries: MeetingEntry[]; speakers: string[] }>({ entries: [], speakers: [] });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setIsLoading(true);
    setError(null);
    fetch(src)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load meeting log");
        return res.text();
      })
      .then((text) => {
        setData(parseMeetingLog(text));
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "読み込みに失敗しました");
      })
      .finally(() => setIsLoading(false));
  }, [src]);

  const speakerColorMap = useMemo(() => {
    const map = new Map<string, (typeof colorPalette)[0]>();
    data.speakers.forEach((speaker, i) => {
      map.set(speaker, colorPalette[i % colorPalette.length]);
    });
    return map;
  }, [data.speakers]);

  if (isLoading) {
    return (
      <div className="card p-4">
        <p className="text-sm text-slate-500">ミーティングログを読み込んでいます...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card p-4">
        <p className="text-sm text-red-600">{error}</p>
      </div>
    );
  }

  let prevSpeaker = "";

  return (
    <div className="card p-4">
      {title ? (
        <h3 className="mb-3 text-sm font-semibold text-slate-900">{title}</h3>
      ) : null}
      <div className="max-h-[480px] space-y-1 overflow-y-auto rounded-lg border border-slate-100 bg-white p-4">
        {data.entries.map((entry, i) => {
          if (!isMeetingLine(entry)) {
            prevSpeaker = "";
            return (
              <div key={i} className="py-2 text-center">
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-500">
                  {entry.title}
                </span>
              </div>
            );
          }

          const colors = speakerColorMap.get(entry.speaker) ?? colorPalette[0];
          const { name, role } = extractDisplayName(entry.speaker);
          const showSpeaker = entry.speaker !== prevSpeaker;
          prevSpeaker = entry.speaker;

          return (
            <div key={i} className={`flex items-start gap-2.5 ${showSpeaker ? "mt-3" : "mt-0.5"}`}>
              {/* Avatar / spacer */}
              <div className="w-7 shrink-0">
                {showSpeaker ? (
                  <div
                    className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold text-white ${colors.initial}`}
                  >
                    {name[0]}
                  </div>
                ) : null}
              </div>

              <div className="min-w-0 flex-1">
                {showSpeaker ? (
                  <div className="mb-1 flex items-baseline gap-1.5">
                    <span className="text-xs font-semibold text-slate-800">{name}</span>
                    {role ? (
                      <span className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${colors.badge}`}>
                        {role}
                      </span>
                    ) : null}
                  </div>
                ) : null}
                <div className={`rounded-lg border px-3 py-2 ${colors.bubble}`}>
                  <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-700">
                    {entry.text}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
