import { EventEmitter } from "node:events";

export type UserSyncTopic =
  | "macros"
  | "goals"
  | "habits"
  | "saved-meals"
  | "user"
  | "session_revoked"
  | "all";

export interface UserSyncEvent {
  type: "data_changed";
  topic: UserSyncTopic;
  timestamp: number;
  clientInstanceId?: string;
}

const syncBus = new EventEmitter();
syncBus.setMaxListeners(100);

function getUserChannel(userId: number | string): string {
  return `user:${userId}`;
}

export function publishUserSyncEvent(
  userId: number | string | null | undefined,
  topic: UserSyncTopic,
  clientInstanceId?: string,
): void {
  if (!userId) return;
  const event: UserSyncEvent = {
    type: "data_changed",
    topic,
    timestamp: Date.now(),
    clientInstanceId,
  };
  syncBus.emit(getUserChannel(userId), event);
}

export function subscribeUserSync(
  userId: number | string | null | undefined,
  listener: (event: UserSyncEvent) => void,
): () => void {
  if (!userId) return () => {};
  const channel = getUserChannel(userId);
  syncBus.on(channel, listener);
  return () => {
    syncBus.off(channel, listener);
  };
}
