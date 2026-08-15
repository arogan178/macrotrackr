import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";

import { getFullUrl } from "@/api/core";
import { getToken } from "@/utils/tokenStorage";

export type SyncTopic =
  | "macros"
  | "goals"
  | "habits"
  | "saved-meals"
  | "user"
  | "all";

export interface SyncMessage {
  type: "data_changed";
  topic: SyncTopic;
  timestamp: number;
  clientInstanceId?: string;
}

const BROADCAST_CHANNEL_NAME = "macrotrackr_query_sync";
const CLIENT_INSTANCE_ID = crypto.randomUUID();

/**
 * Broadcasts a local data change to other open browser tabs instantly
 */
export function broadcastLocalDataChange(topic: SyncTopic): void {
  try {
    const channel = new BroadcastChannel(BROADCAST_CHANNEL_NAME);
    channel.postMessage({
      type: "data_changed",
      topic,
      timestamp: Date.now(),
      clientInstanceId: CLIENT_INSTANCE_ID,
    });
    channel.close();
  } catch {
    // Ignore broadcast errors
  }
}

function invalidateQueriesForTopic(
  queryClient: ReturnType<typeof useQueryClient>,
  topic: SyncTopic,
) {
  switch (topic) {
    case "macros":
      queryClient.invalidateQueries({ queryKey: ["macros"] });
      queryClient.invalidateQueries({ queryKey: ["goals"] });
      break;
    case "goals":
      queryClient.invalidateQueries({ queryKey: ["goals"] });
      queryClient.invalidateQueries({ queryKey: ["settings"] });
      queryClient.invalidateQueries({ queryKey: ["auth"] });
      queryClient.invalidateQueries({ queryKey: ["macros"] });
      break;
    case "habits":
      queryClient.invalidateQueries({ queryKey: ["habits"] });
      break;
    case "saved-meals":
      queryClient.invalidateQueries({ queryKey: ["saved-meals"] });
      break;
    case "user":
      queryClient.invalidateQueries({ queryKey: ["settings"] });
      queryClient.invalidateQueries({ queryKey: ["auth"] });
      queryClient.invalidateQueries({ queryKey: ["goals"] });
      queryClient.invalidateQueries({ queryKey: ["macros"] });
      break;
    case "all":
    default:
      queryClient.invalidateQueries();
      break;
  }
}

export function useRealtimeSync(isAuthenticated: boolean) {
  const queryClient = useQueryClient();

  // 1. Inter-tab synchronization via BroadcastChannel
  useEffect(() => {
    if (typeof window === "undefined" || !("BroadcastChannel" in window)) return;

    let channel: BroadcastChannel | null = null;
    try {
      channel = new BroadcastChannel(BROADCAST_CHANNEL_NAME);
      channel.onmessage = (event: MessageEvent<SyncMessage>) => {
        const message = event.data;
        if (
          message?.type === "data_changed" &&
          message.clientInstanceId !== CLIENT_INSTANCE_ID
        ) {
          invalidateQueriesForTopic(queryClient, message.topic);
        }
      };
    } catch {
      // BroadcastChannel unavailable
    }

    return () => {
      if (channel) {
        channel.close();
      }
    };
  }, [queryClient]);

  // 2. Cross-device real-time synchronization via Server-Sent Events (SSE)
  useEffect(() => {
    if (
      !isAuthenticated ||
      typeof window === "undefined" ||
      typeof EventSource === "undefined"
    ) {
      return;
    }

    let eventSource: EventSource | null = null;
    let isCancelled = false;
    let reconnectTimeout: ReturnType<typeof setTimeout> | null = null;
    let retryCount = 0;

    function cleanupSSE() {
      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
        reconnectTimeout = null;
      }
      if (eventSource) {
        eventSource.close();
        eventSource = null;
      }
    }

    function connectSSE() {
      if (isCancelled || (typeof navigator !== "undefined" && !navigator.onLine)) {
        return;
      }
      if (typeof document !== "undefined" && document.hidden) {
        return;
      }

      cleanupSSE();

      const baseUrl = getFullUrl("/api/sync/events");
      const token = getToken();
      const sseUrl = token
        ? `${baseUrl}?token=${encodeURIComponent(token)}`
        : baseUrl;

      eventSource = new EventSource(sseUrl, { withCredentials: true });

      eventSource.onopen = () => {
        retryCount = 0;
      };

      eventSource.onmessage = (event) => {
        retryCount = 0;
        try {
          const data = JSON.parse(event.data) as SyncMessage;
          if (data?.type === "data_changed") {
            invalidateQueriesForTopic(queryClient, data.topic);
          }
        } catch {
          // Ignore parse errors on heartbeats/pings
        }
      };

      eventSource.onerror = () => {
        cleanupSSE();

        if (!isCancelled && (typeof navigator === "undefined" || navigator.onLine)) {
          const backoffDelay = Math.min(
            1000 * 2 ** retryCount + Math.random() * 1000,
            30000,
          );
          retryCount++;
          reconnectTimeout = setTimeout(connectSSE, backoffDelay);
        }
      };
    }

    function handleOnline() {
      retryCount = 0;
      connectSSE();
    }

    function handleVisibilityChange() {
      if (document.hidden) {
        cleanupSSE();
      } else {
        retryCount = 0;
        connectSSE();
      }
    }

    window.addEventListener("online", handleOnline);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    connectSSE();

    return () => {
      isCancelled = true;
      window.removeEventListener("online", handleOnline);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      cleanupSSE();
    };
  }, [isAuthenticated, queryClient]);
}
