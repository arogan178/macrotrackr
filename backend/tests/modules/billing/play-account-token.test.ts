import { beforeEach, describe, expect, it, vi } from "vitest";

const safeQueryMock = vi.fn();
const safeExecuteMock = vi.fn();

vi.mock("../../../src/lib/data/database", () => ({
  safeQuery: (...arguments_: unknown[]) => safeQueryMock(...arguments_),
  safeExecute: (...arguments_: unknown[]) => safeExecuteMock(...arguments_),
  withTransaction: (_db: unknown, work: () => unknown) => work(),
}));

import {
  configureSubscriptionService,
  SubscriptionService,
} from "../../../src/modules/billing/subscription-service";

describe("Play account token", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    configureSubscriptionService({
      db: { kind: "test-db" } as never,
      cacheService: { get: vi.fn(), set: vi.fn() } as never,
    });
  });

  describe("getOrCreatePlayAccountToken", () => {
    it("returns the token an account already has, without writing", async () => {
      safeQueryMock.mockReturnValue({
        play_obfuscated_account_id: "existing_token",
      });

      const token = await SubscriptionService.getOrCreatePlayAccountToken(7);

      expect(token).toBe("existing_token");
      // Rotating the token would orphan purchases made under the old one.
      expect(safeExecuteMock).not.toHaveBeenCalled();
    });

    it("creates one on first use", async () => {
      safeQueryMock
        .mockReturnValueOnce({ play_obfuscated_account_id: null })
        .mockImplementationOnce(() => ({
          play_obfuscated_account_id: String(
            safeExecuteMock.mock.calls[0]?.[2]?.[0],
          ),
        }));

      const token = await SubscriptionService.getOrCreatePlayAccountToken(7);

      expect(safeExecuteMock).toHaveBeenCalledTimes(1);
      // 24 random bytes as hex, inside Play's 64 character limit.
      expect(token).toMatch(/^[0-9a-f]{48}$/);
    });

    it("only writes when the column is still null, so a race cannot overwrite", async () => {
      safeQueryMock
        .mockReturnValueOnce({ play_obfuscated_account_id: null })
        .mockReturnValueOnce({ play_obfuscated_account_id: "whoever_won" });

      await SubscriptionService.getOrCreatePlayAccountToken(7);

      const sql = String(safeExecuteMock.mock.calls[0]?.[1]);
      expect(sql).toContain("play_obfuscated_account_id IS NULL");
    });

    it("returns the stored token, not the generated one, when a race is lost", async () => {
      safeQueryMock
        .mockReturnValueOnce({ play_obfuscated_account_id: null })
        .mockReturnValueOnce({ play_obfuscated_account_id: "whoever_won" });

      const token = await SubscriptionService.getOrCreatePlayAccountToken(7);

      // Both callers have to end up with the same token, or one of them hands
      // Play a value the server will never recognise.
      expect(token).toBe("whoever_won");
    });

    it("gives two accounts different tokens", async () => {
      const mint = async () => {
        safeQueryMock.mockReset();
        safeExecuteMock.mockReset();
        safeQueryMock
          .mockReturnValueOnce({ play_obfuscated_account_id: null })
          .mockImplementationOnce(() => ({
            play_obfuscated_account_id: String(
              safeExecuteMock.mock.calls[0]?.[2]?.[0],
            ),
          }));

        return SubscriptionService.getOrCreatePlayAccountToken(7);
      };

      expect(await mint()).not.toBe(await mint());
    });

    it("fails when the account does not exist", async () => {
      safeQueryMock.mockReturnValue(null);

      await expect(
        SubscriptionService.getOrCreatePlayAccountToken(404),
      ).rejects.toThrow();
    });
  });

  describe("findUserByPlayAccountToken", () => {
    it("finds the account a Play notification belongs to", async () => {
      safeQueryMock.mockReturnValue({ id: 7 });

      await expect(
        SubscriptionService.findUserByPlayAccountToken("some_token"),
      ).resolves.toBe(7);
    });

    it("returns null for a token no account holds", async () => {
      safeQueryMock.mockReturnValue(null);

      await expect(
        SubscriptionService.findUserByPlayAccountToken("unknown"),
      ).resolves.toBeNull();
    });

    it("returns null rather than throwing when the lookup fails", async () => {
      // A notification must not be retried forever because of a read error.
      safeQueryMock.mockImplementation(() => {
        throw new Error("database gone");
      });

      await expect(
        SubscriptionService.findUserByPlayAccountToken("some_token"),
      ).resolves.toBeNull();
    });
  });
});
