/// <reference types="vite/client" />

interface ImportMetaEnvironment {
	readonly VITE_API_URL?: string;
	readonly VITE_APP_URL?: string;
	readonly VITE_GITHUB_REPO_URL?: string;
	readonly VITE_DOCS_URL?: string;
	readonly VITE_PUBLIC_APP_NAME?: string;
	readonly VITE_SUPPORT_EMAIL?: string;
	readonly VITE_AUTH_MODE?: "clerk" | "local";
	readonly VITE_BILLING_MODE?: "managed" | "disabled";
	readonly VITE_ANALYTICS_MODE?: "posthog" | "disabled";
	readonly VITE_CLERK_PUBLISHABLE_KEY?: string;
	readonly VITE_PUBLIC_POSTHOG_KEY?: string;
	readonly VITE_PUBLIC_POSTHOG_HOST?: string;
	readonly VITE_ENABLE_POSTHOG?: "true" | "false";
}

interface ImportMeta {
	readonly env: ImportMetaEnvironment;
}
