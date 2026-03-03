import { useRef, useCallback } from "react";
import type { CertificateStatus } from "@/lib/certificate";

type CertificateCardProps = {
  certificateStatus: CertificateStatus;
  userName?: string;
};

/** Map category IDs to their milestone color palette */
const categoryColors: Record<string, { bg: string; text: string; ring: string }> = {
  "soft-skills":          { bg: "bg-orange-100",  text: "text-orange-700",  ring: "ring-orange-300" },
  "test-cases":           { bg: "bg-sky-100",     text: "text-sky-700",     ring: "ring-sky-300" },
  "requirement-definition": { bg: "bg-rose-100",  text: "text-rose-700",    ring: "ring-rose-300" },
  "incident-response":    { bg: "bg-emerald-100", text: "text-emerald-700", ring: "ring-emerald-300" },
  "business-execution":   { bg: "bg-indigo-100",  text: "text-indigo-700",  ring: "ring-indigo-300" },
};

const defaultColor = { bg: "bg-slate-100", text: "text-slate-700", ring: "ring-slate-300" };

/** Five conic-gradient stops matching the milestone palette */
const sealGradient =
  "conic-gradient(from 0deg, #f97316, #0ea5e9, #f43f5e, #10b981, #6366f1, #f97316)";

export function CertificateCard({ certificateStatus, userName }: CertificateCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);

  const earnedDate = certificateStatus.earnedAt
    ? new Date(certificateStatus.earnedAt).toLocaleDateString("ja-JP", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : undefined;

  const handleDownloadPng = useCallback(async () => {
    if (!cardRef.current) return;
    const { toPng } = await import("html-to-image");
    const dataUrl = await toPng(cardRef.current, { pixelRatio: 2 });
    const link = document.createElement("a");
    link.download = "pm-journey-certificate.png";
    link.href = dataUrl;
    link.click();
  }, []);

  const handleDownloadPdf = useCallback(async () => {
    if (!cardRef.current) return;
    const { toPng } = await import("html-to-image");
    const { jsPDF } = await import("jspdf");
    const dataUrl = await toPng(cardRef.current, { pixelRatio: 2 });
    const img = new Image();
    img.src = dataUrl;
    await new Promise<void>((resolve) => {
      img.onload = () => resolve();
    });
    const pdf = new jsPDF({
      orientation: "landscape",
      unit: "px",
      format: [img.width / 2, img.height / 2],
    });
    pdf.addImage(dataUrl, "PNG", 0, 0, img.width / 2, img.height / 2);
    pdf.save("pm-journey-certificate.pdf");
  }, []);

  return (
    <div className="space-y-4">
      {/* ---------- Outer gold border frame ---------- */}
      <div
        ref={cardRef}
        className="relative rounded-2xl p-[3px] shadow-[0_16px_48px_rgba(180,120,40,0.18)]"
        style={{
          background: "linear-gradient(135deg, #d4a24e 0%, #f5d98a 35%, #c8922d 65%, #f5d98a 100%)",
        }}
      >
        {/* Inner dashed border */}
        <div className="rounded-[13px] border-[1.5px] border-dashed border-amber-600/40 bg-[#fffcf5] p-1">
          {/* Certificate body */}
          <div
            className="relative overflow-hidden rounded-xl px-8 py-10 sm:px-12 sm:py-14"
            style={{
              background: "radial-gradient(ellipse at 30% 20%, rgba(255,243,220,0.7) 0%, transparent 60%), radial-gradient(ellipse at 80% 80%, rgba(255,237,200,0.5) 0%, transparent 50%), #fffdf8",
            }}
          >
            {/* Corner ornaments */}
            <Ornament position="top-3 left-3" />
            <Ornament position="top-3 right-3" rotate={90} />
            <Ornament position="bottom-3 left-3" rotate={270} />
            <Ornament position="bottom-3 right-3" rotate={180} />

            {/* Content */}
            <div className="relative space-y-6 text-center">
              {/* Header label */}
              <p
                className="text-[11px] font-bold uppercase tracking-[0.4em]"
                style={{ color: "#b8860b" }}
              >
                Certificate of Completion
              </p>

              {/* Gold divider */}
              <div className="mx-auto flex w-48 items-center gap-2">
                <div className="h-px flex-1 bg-gradient-to-r from-transparent via-amber-400 to-transparent" />
                <span style={{ color: "#b8860b" }} className="text-sm">&#10047;</span>
                <div className="h-px flex-1 bg-gradient-to-r from-transparent via-amber-400 to-transparent" />
              </div>

              {/* Title */}
              <h2
                className="font-display text-3xl tracking-tight sm:text-4xl"
                style={{ color: "#3a2a14" }}
              >
                PM Journey 修了証
              </h2>

              {/* Divider line */}
              <div className="mx-auto h-px w-64 bg-gradient-to-r from-transparent via-amber-300/80 to-transparent" />

              {/* Recipient name */}
              {userName ? (
                <p
                  className="text-xl font-semibold tracking-wide sm:text-2xl"
                  style={{ color: "#4a3520" }}
                >
                  {userName}
                </p>
              ) : null}

              {/* Description */}
              <p className="mx-auto max-w-md text-sm leading-relaxed text-amber-900/70">
                全 {certificateStatus.totalRequired} シナリオの評価に合格し、
                <br className="hidden sm:inline" />
                PM Journey の全課程を修了したことを証します。
              </p>

              {/* Category badges — each in its milestone color */}
              <div className="flex flex-wrap justify-center gap-2">
                {certificateStatus.categories.map((cat) => {
                  const palette = categoryColors[cat.categoryId] ?? defaultColor;
                  return (
                    <span
                      key={cat.categoryId}
                      className={`rounded-full px-3.5 py-1 text-xs font-semibold ring-1 ${palette.bg} ${palette.text} ${palette.ring}`}
                    >
                      {cat.categoryTitle}
                    </span>
                  );
                })}
              </div>

              {/* Rosette seal */}
              <div className="flex justify-center pt-2">
                <div className="relative flex h-20 w-20 items-center justify-center">
                  {/* Outer glow */}
                  <div
                    className="absolute inset-0 rounded-full opacity-30 blur-md"
                    style={{ background: sealGradient }}
                    aria-hidden="true"
                  />
                  {/* Seal ring */}
                  <div
                    className="absolute inset-0 rounded-full p-[3px]"
                    style={{ background: sealGradient }}
                  >
                    <div className="flex h-full w-full items-center justify-center rounded-full bg-[#fffdf8]">
                      <div
                        className="flex h-[calc(100%-6px)] w-[calc(100%-6px)] items-center justify-center rounded-full border border-amber-300/60"
                        style={{
                          background: "radial-gradient(circle, #fff9ed 0%, #fff3d6 100%)",
                        }}
                      >
                        <span className="text-[10px] font-bold uppercase leading-tight tracking-widest text-amber-700">
                          PM
                          <br />
                          Journey
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Date */}
              {earnedDate ? (
                <p className="text-xs tracking-wide text-amber-800/50">
                  取得日: {earnedDate}
                </p>
              ) : null}

              {/* Bottom divider */}
              <div className="mx-auto flex w-48 items-center gap-2">
                <div className="h-px flex-1 bg-gradient-to-r from-transparent via-amber-400 to-transparent" />
                <span style={{ color: "#b8860b" }} className="text-sm">&#10047;</span>
                <div className="h-px flex-1 bg-gradient-to-r from-transparent via-amber-400 to-transparent" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Download buttons */}
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          className="btn-secondary"
          onClick={() => void handleDownloadPng()}
        >
          PNGでダウンロード
        </button>
        <button
          type="button"
          className="btn-secondary"
          onClick={() => void handleDownloadPdf()}
        >
          PDFでダウンロード
        </button>
      </div>
    </div>
  );
}

/** Decorative corner ornament using CSS borders */
function Ornament({ position, rotate = 0 }: { position: string; rotate?: number }) {
  return (
    <div
      className={`pointer-events-none absolute ${position}`}
      style={{ transform: `rotate(${rotate}deg)` }}
      aria-hidden="true"
    >
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
        <path
          d="M2 2 C2 2, 2 14, 2 14 C2 14, 2 2, 14 2"
          stroke="#c8922d"
          strokeWidth="1.5"
          strokeLinecap="round"
          opacity="0.5"
        />
        <path
          d="M6 2 C6 2, 6 10, 6 10 C6 10, 6 2, 14 2"
          stroke="#c8922d"
          strokeWidth="1"
          strokeLinecap="round"
          opacity="0.3"
        />
      </svg>
    </div>
  );
}
