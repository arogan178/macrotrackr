import { afterEach, describe, expect, it, vi } from "vitest";

import {
	createDefaultLocalUserData,
	fetchAllClerkUsers,
	generateTempPassword,
	getClerkErrorMetadata,
	isBcryptHash,
	normalizeEmail,
	parseOptions,
	splitNameFromEmail,
} from "../migrate-dev-users-to-clerk";

describe("migrate-dev-users-to-clerk helpers", () => {
	afterEach(() => {
		vi.restoreAllMocks();
	});

	it("parses migration CLI options", () => {
		expect(parseOptions([])).toEqual({
			dryRun: false,
			createMissingClerk: true,
			createMissingLocal: true,
			importPasswordHashes: true,
			requireBcrypt: true,
		});

		expect(
			parseOptions([
				"--dry-run",
				"--no-create-clerk",
				"--no-create-local",
				"--use-temp-passwords",
				"--allow-non-bcrypt",
			]),
		).toEqual({
			dryRun: true,
			createMissingClerk: false,
			createMissingLocal: false,
			importPasswordHashes: false,
			requireBcrypt: false,
		});
	});

	it("normalizes and validates email input", () => {
		expect(normalizeEmail("  USER@Example.COM ")).toBe("user@example.com");
		expect(normalizeEmail("   ")).toBeNull();
		expect(normalizeEmail(null)).toBeNull();
	});

	it("derives readable names from email local parts", () => {
		expect(splitNameFromEmail("jane_doe-test@example.com")).toEqual({
			first: "Jane",
			last: "Doe test",
		});
	});

	it("creates temporary passwords and recognizes bcrypt hashes", () => {
		const generated = generateTempPassword();
		expect(generated).toMatch(/^DevMigrate![0-9a-f-]{36}aA1$/);

		expect(
			isBcryptHash("$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy"),
		).toBe(
			true,
		);
		expect(isBcryptHash("not-a-hash")).toBe(false);
	});

	it("extracts useful Clerk API error metadata", () => {
		const metadata = getClerkErrorMetadata({
			status: 422,
			code: "form_param_invalid",
			errors: [
				{ longMessage: "Email address already exists" },
				{ message: "Fallback message" },
				{ code: "duplicate" },
			],
		});

		expect(metadata).toEqual({
			status: 422,
			code: "form_param_invalid",
			messages: [
				"Email address already exists",
				"Fallback message",
				"duplicate",
			],
		});
	});

	it("builds default local user data from Clerk user payload", () => {
		expect(
			createDefaultLocalUserData({
				id: "clerk_123",
				email: "NEW.USER@example.com",
				firstName: null,
				lastName: null,
			}),
		).toEqual({
			email: "new.user@example.com",
			firstName: "New",
			lastName: "User",
		});

		expect(
			createDefaultLocalUserData({
				id: "clerk_234",
				email: null,
				firstName: "Given",
				lastName: "Name",
			}),
		).toBeNull();
	});

	it("fetches all Clerk users across paginated responses", async () => {
		const firstPage = Array.from({ length: 100 }, (_, index) => ({
			id: `user_${index}`,
			emailAddresses: [{ emailAddress: `user${index}@example.com` }],
			firstName: null,
			lastName: null,
		}));

		const secondPage = [
			{
				id: "user_100",
				emailAddresses: [{ emailAddress: "user100@example.com" }],
				firstName: "Final",
				lastName: "User",
			},
		];

		const getUserList = vi
			.fn()
			.mockResolvedValueOnce({ data: firstPage })
			.mockResolvedValueOnce({ data: secondPage });

		const result = await fetchAllClerkUsers({
			users: { getUserList },
		} as never);

		expect(getUserList).toHaveBeenNthCalledWith(1, { limit: 100, offset: 0 });
		expect(getUserList).toHaveBeenNthCalledWith(2, { limit: 100, offset: 100 });
		expect(result).toHaveLength(101);
		expect(result[100]).toEqual({
			id: "user_100",
			email: "user100@example.com",
			firstName: "Final",
			lastName: "User",
		});
	});
});
