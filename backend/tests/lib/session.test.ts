import { beforeEach, describe, expect, it } from "vitest";
import { readSessionTokenFromRequest } from "../../src/lib/auth/session";
import {
  issueSyncTicket,
  resetSyncTicketsForTests,
} from "../../src/lib/auth/sync-ticket";

describe("readSessionTokenFromRequest", () => {
  beforeEach(() => {
    resetSyncTicketsForTests();
  });

  it("reads a bearer token", () => {
    const request = new Request("https://api.test/api/user/me", {
      headers: { authorization: "Bearer sess-id.secret" },
    });

    expect(readSessionTokenFromRequest(request)).toBe("sess-id.secret");
  });

  it("ignores Clerk tokens presented as bearer credentials", () => {
    const request = new Request("https://api.test/api/user/me", {
      headers: { authorization: "Bearer sess_clerk123" },
    });

    expect(readSessionTokenFromRequest(request)).toBeNull();
  });

  it("reads the session cookie", () => {
    const request = new Request("https://api.test/api/user/me", {
      headers: { cookie: "mt_session=sess-id.secret; other=1" },
    });

    expect(readSessionTokenFromRequest(request)).toBe("sess-id.secret");
  });

  it("rejects a query-string token on ordinary API routes", () => {
    const request = new Request(
      "https://api.test/api/user/me?token=sess-id.secret",
    );

    expect(readSessionTokenFromRequest(request)).toBeNull();
  });

  it("no longer accepts a raw session token in the SSE query string", () => {
    const request = new Request(
      "https://api.test/api/sync/events?token=sess-id.secret",
    );

    expect(readSessionTokenFromRequest(request)).toBeNull();
  });

  it("exchanges a one-time ticket on the SSE stream, which cannot set headers", () => {
    const { ticket } = issueSyncTicket("sess-id.secret");
    const request = new Request(
      `https://api.test/api/sync/events?ticket=${ticket}`,
    );

    expect(readSessionTokenFromRequest(request)).toBe("sess-id.secret");
  });

  it("burns the ticket, so a replay from a proxy log resolves to nothing", () => {
    const { ticket } = issueSyncTicket("sess-id.secret");
    const url = `https://api.test/api/sync/events?ticket=${ticket}`;

    expect(readSessionTokenFromRequest(new Request(url))).toBe(
      "sess-id.secret",
    );
    expect(readSessionTokenFromRequest(new Request(url))).toBeNull();
  });

  it("ignores a ticket presented on any other route", () => {
    const { ticket } = issueSyncTicket("sess-id.secret");
    const request = new Request(
      `https://api.test/api/user/me?ticket=${ticket}`,
    );

    expect(readSessionTokenFromRequest(request)).toBeNull();
  });
});
