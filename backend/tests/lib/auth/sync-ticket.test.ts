import { beforeEach, describe, expect, it } from "vitest";

import {
  consumeSyncTicket,
  issueSyncTicket,
  resetSyncTicketsForTests,
} from "../../../src/lib/auth/sync-ticket";

describe("sync tickets", () => {
  beforeEach(() => {
    resetSyncTicketsForTests();
  });

  it("redeems a ticket for the session token it was minted from", () => {
    const { ticket } = issueSyncTicket("session-id.secret");

    expect(consumeSyncTicket(ticket)).toBe("session-id.secret");
  });

  it("burns the ticket, so a value leaked from a proxy log is useless", () => {
    const { ticket } = issueSyncTicket("session-id.secret");

    expect(consumeSyncTicket(ticket)).toBe("session-id.secret");
    expect(consumeSyncTicket(ticket)).toBeNull();
  });

  it("returns null for a ticket nobody issued", () => {
    expect(consumeSyncTicket("not-a-real-ticket")).toBeNull();
  });

  it("gives every caller a distinct ticket", () => {
    const first = issueSyncTicket("session-a.secret").ticket;
    const second = issueSyncTicket("session-b.secret").ticket;

    expect(first).not.toBe(second);
    expect(consumeSyncTicket(first)).toBe("session-a.secret");
    expect(consumeSyncTicket(second)).toBe("session-b.secret");
  });

  it("rejects an expired ticket and consumes it anyway", () => {
    const realNow = Date.now;
    const { ticket, expiresInMs } = issueSyncTicket("session-id.secret");

    try {
      Date.now = () => realNow() + expiresInMs + 1;
      expect(consumeSyncTicket(ticket)).toBeNull();
    } finally {
      Date.now = realNow;
    }

    expect(consumeSyncTicket(ticket)).toBeNull();
  });

  it("does not hand back a token for the empty string", () => {
    issueSyncTicket("session-id.secret");

    expect(consumeSyncTicket("")).toBeNull();
  });
});
