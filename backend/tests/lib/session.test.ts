import { describe, expect, it } from "vitest";
import { readSessionTokenFromRequest } from "../../src/lib/auth/session";

describe("readSessionTokenFromRequest", () => {
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
    const request = new Request("https://api.test/api/user/me?token=sess-id.secret");

    expect(readSessionTokenFromRequest(request)).toBeNull();
  });

  it("accepts a query-string token on the SSE stream, which cannot set headers", () => {
    const request = new Request("https://api.test/api/sync/events?token=sess-id.secret");

    expect(readSessionTokenFromRequest(request)).toBe("sess-id.secret");
  });
});
