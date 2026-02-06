import { env } from "@/config/env";
import { createSessionPointerStorage } from "@pm-journey/storage";

export const storage = createSessionPointerStorage({
  keyPrefix: env.storageKeyPrefix,
});
