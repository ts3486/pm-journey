import { createApiClient } from "@/lib/apiClient";
import { env } from "@/config/env";

export const api = createApiClient(env.apiBase);
