import { createContext, useContext, useEffect, useMemo } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import { createSessionPointerStorage, type SessionPointerStorage } from "@/storage/sessionPointer";
import { env } from "@/config/env";
import { setSessionPointerStorage } from "@/services/storage";
import { invalidateProductPromptCache } from "@/services/sessions";

const StorageContext = createContext<SessionPointerStorage | null>(null);

type StorageProviderProps = {
  children: React.ReactNode;
};

export function StorageProvider({ children }: StorageProviderProps) {
  const { user } = useAuth0();

  const storage = useMemo(() => {
    return createSessionPointerStorage({
      keyPrefix: env.storageKeyPrefix,
      userId: user?.sub,
    });
  }, [user?.sub]);

  useEffect(() => {
    setSessionPointerStorage(storage);
    invalidateProductPromptCache();
  }, [storage]);

  return <StorageContext.Provider value={storage}>{children}</StorageContext.Provider>;
}

export function useStorage(): SessionPointerStorage {
  const context = useContext(StorageContext);
  if (!context) {
    throw new Error("useStorage must be used within StorageProvider");
  }
  return context;
}
