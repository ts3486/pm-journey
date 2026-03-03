type LoadingIndicatorProps = {
  message?: string;
  size?: "sm" | "md";
};

export function LoadingIndicator({ message, size = "md" }: LoadingIndicatorProps) {
  const iconSize = size === "sm" ? "h-4 w-4" : "h-5 w-5";
  const textSize = size === "sm" ? "text-xs" : "text-sm";

  return (
    <div className="flex items-center justify-center gap-2.5 py-4">
      <svg
        className={`${iconSize} animate-spin text-orange-500`}
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        />
      </svg>
      {message ? <span className={`${textSize} text-slate-500`}>{message}</span> : null}
    </div>
  );
}
