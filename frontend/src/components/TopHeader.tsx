type TopHeaderProps = {
  onMenuClick: () => void;
};

export function TopHeader({ onMenuClick }: TopHeaderProps) {
  return (
    <header className="h-14 flex items-center justify-between border-b border-[rgba(138,96,61,0.15)] px-6">
      <button
        type="button"
        onClick={onMenuClick}
        className="lg:hidden text-slate-700 hover:bg-orange-100/70 rounded-lg p-2"
        aria-label="メニューを開く"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <line x1="3" y1="6" x2="21" y2="6" />
          <line x1="3" y1="12" x2="21" y2="12" />
          <line x1="3" y1="18" x2="21" y2="18" />
        </svg>
      </button>
    </header>
  );
}
