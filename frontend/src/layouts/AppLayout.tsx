import { Outlet } from "react-router-dom";
import { NavBar } from "@/components/NavBar";
import { AuthGuard } from "@/components/AuthGuard";
import { ApiClientProvider } from "@/contexts/ApiClientContext";
import { StorageProvider } from "@/contexts/StorageContext";

export function AppLayout() {
  return (
    <AuthGuard>
      <ApiClientProvider>
        <StorageProvider>
          <div className="min-h-screen bg-background">
            <NavBar />
            <main className="mx-auto max-w-6xl px-4 pb-16 pt-8 lg:pt-12">
              <Outlet />
            </main>
          </div>
        </StorageProvider>
      </ApiClientProvider>
    </AuthGuard>
  );
}
