import { AuthGuard } from "@/components/AuthGuard";
import { SidebarLayout } from "@/components/SidebarLayout";
import { ApiClientProvider } from "@/contexts/ApiClientContext";
import { StorageProvider } from "@/contexts/StorageContext";

export function AppLayout() {
  return (
    <AuthGuard>
      <ApiClientProvider>
        <StorageProvider>
          <SidebarLayout />
        </StorageProvider>
      </ApiClientProvider>
    </AuthGuard>
  );
}
