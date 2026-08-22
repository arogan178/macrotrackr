import { randomBytes } from "node:crypto";

/**
 * One-time tickets for the SSE stream.
 *
 * EventSource cannot set an Authorization header, so the stream has to carry
 * its credential in the query string — where it lands in proxy access logs,
 * browser history and Referer headers. A long-lived session token in that
 * position is a standing liability; a ticket that dies after one use and 30
 * seconds is not.
 *
 * Tickets live in memory on purpose. They are worthless after a single
 * connect, and a process restart drops every open stream anyway, so there is
 * nothing worth persisting.
 */
const TICKET_TTL_MS = 30_000;

interface TicketEntry {
  sessionToken: string;
  expiresAt: number;
}

const tickets = new Map<string, TicketEntry>();

function sweepExpired(now: number): void {
  for (const [ticket, entry] of tickets) {
    if (entry.expiresAt <= now) {
      tickets.delete(ticket);
    }
  }
}

export function issueSyncTicket(sessionToken: string): {
  ticket: string;
  expiresInMs: number;
} {
  const now = Date.now();
  sweepExpired(now);

  const ticket = randomBytes(32).toString("base64url");
  tickets.set(ticket, { sessionToken, expiresAt: now + TICKET_TTL_MS });

  return { ticket, expiresInMs: TICKET_TTL_MS };
}

/**
 * Redeem a ticket for the session token it was minted from. Always consumes
 * the ticket, including when it turns out to be expired, so a leaked value
 * cannot be retried.
 */
export function consumeSyncTicket(ticket: string): string | null {
  const entry = tickets.get(ticket);
  if (!entry) {
    return null;
  }

  tickets.delete(ticket);

  if (entry.expiresAt <= Date.now()) {
    return null;
  }

  return entry.sessionToken;
}

/** Test seam — the map is module state that would otherwise leak across tests. */
export function resetSyncTicketsForTests(): void {
  tickets.clear();
}
