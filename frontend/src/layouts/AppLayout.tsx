import { Outlet } from "react-router-dom";
import { NavBar } from "@/components/NavBar";

export function AppLayout() {
  return (
    <div className="min-h-screen bg-[var(--background)]">
      <NavBar />
      <main className="mx-auto max-w-6xl px-4 pb-16 pt-8 lg:pt-12">
        <Outlet />
      </main>
    </div>
  );
}
