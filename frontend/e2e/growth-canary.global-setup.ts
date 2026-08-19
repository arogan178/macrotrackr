import { clerkSetup } from "@clerk/testing/playwright";

export default async function growthCanarySetup(): Promise<void> {
  await clerkSetup();
}
