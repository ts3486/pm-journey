import { useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { TopHeader } from "./TopHeader";

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
        <TopHeader onMenuClick={() => setMobileSidebarOpen(true)} />
        <main className="main-content flex-1 overflow-y-auto px-6 pb-16 pt-6 lg:px-10">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
