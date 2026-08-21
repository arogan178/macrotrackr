import { Elysia } from "elysia";
import { readSessionTokenFromRequest } from "../../lib/auth/session";
import { issueSyncTicket } from "../../lib/auth/sync-ticket";
import { subscribeUserSync, type UserSyncEvent } from "../../lib/sync/eventBus";

type SyncRouteContext = {
  authenticatedUser?: {
    userId: number;
  };
};

export const syncRoutes = (app: Elysia) =>
  app.group("/api/sync", (group) =>
    group
      // Mint the one-time credential the EventSource connection carries in its
      // query string. This request is a normal authenticated call, so the
      // session token stays in a header or cookie where it belongs.
      .post("/ticket", (context) => {
        const authUser = (context as unknown as SyncRouteContext)
          .authenticatedUser;
        if (!authUser?.userId) {
          context.set.status = 401;
          return { code: "UNAUTHORIZED", message: "Unauthorized" };
        }

        const sessionToken = readSessionTokenFromRequest(context.request);
        if (!sessionToken) {
          // Clerk mode authenticates the stream with cookies and never asks
          // for a ticket, so there is nothing to mint here.
          context.set.status = 409;
          return {
            code: "NO_LOCAL_SESSION",
            message: "Sync tickets require a local session",
          };
        }

        const { ticket, expiresInMs } = issueSyncTicket(sessionToken);
        return { ticket, expiresInMs };
      })
      .get("/events", (context) => {
        const authUser = (context as unknown as SyncRouteContext)
          .authenticatedUser;
        if (!authUser?.userId) {
          context.set.status = 401;
          return { code: "UNAUTHORIZED", message: "Unauthorized" };
        }

        const userId = authUser.userId;

        let unsubscribe: (() => void) | null = null;
        let heartbeatTimer: Timer | null = null;
        let isCleanedUp = false;

        const cleanup = () => {
          if (isCleanedUp) return;
          isCleanedUp = true;
          if (heartbeatTimer) {
            clearInterval(heartbeatTimer);
            heartbeatTimer = null;
          }
          if (unsubscribe) {
            unsubscribe();
            unsubscribe = null;
          }
        };

        context.request.signal?.addEventListener("abort", cleanup);

        const stream = new ReadableStream({
          start(controller) {
            const encoder = new TextEncoder();

            try {
              // Send connection handshake frame
              controller.enqueue(
                encoder.encode(
                  `event: connected\ndata: ${JSON.stringify({ userId, connectedAt: Date.now() })}\n\n`,
                ),
              );
            } catch {
              cleanup();
              return;
            }

            // Subscribe to user's real-time sync bus events
            unsubscribe = subscribeUserSync(userId, (event: UserSyncEvent) => {
              try {
                controller.enqueue(
                  encoder.encode(`data: ${JSON.stringify(event)}\n\n`),
                );
              } catch {
                cleanup();
              }
            });

            // Heartbeat frame every 15s keeps proxies and browsers from timing out
            heartbeatTimer = setInterval(() => {
              try {
                controller.enqueue(encoder.encode(": heartbeat\n\n"));
              } catch {
                cleanup();
              }
            }, 15000);
          },
          cancel() {
            cleanup();
          },
        });

        return new Response(stream, {
          headers: {
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache, no-transform",
            Connection: "keep-alive",
            "X-Accel-Buffering": "no",
          },
        });
      }),
  );
