import { createSessionPointerStorage } from "@/storage";
import { env } from "@/config/env";

export const storage = createSessionPointerStorage({
  keyPrefix: env.storageKeyPrefix,
});
