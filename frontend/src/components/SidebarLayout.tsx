import { useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { Sidebar } from "./Sidebar";

export function SidebarLayout() {
  const location = useLocation();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Collapse sidebar to icon-only on /scenario route to maximize chat space
  const isCollapsed = location.pathname.startsWith("/scenario");

  return (
    <div className="flex h-screen">
      <Sidebar
        isCollapsed={isCollapsed}
        isOpen={mobileSidebarOpen}
        onClose={() => setMobileSidebarOpen(false)}
      />
      <div className="flex flex-1 flex-col overflow-hidden">
        <button
          type="button"
          onClick={() => setMobileSidebarOpen(true)}
          className="lg:hidden absolute top-3 left-3 z-10 text-slate-700 hover:bg-orange-100/70 rounded-lg p-2"
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
        <main className="main-content flex-1 overflow-y-auto px-6 pb-16 pt-6 lg:px-10">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
