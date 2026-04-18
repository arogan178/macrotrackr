import { setAuthLinkIntent } from "./linkIntent";

type SignOutFunction = () => Promise<void>;
type NavigateFunction = (options: {
  to: "/login";
  search: { returnTo: string };
  replace: boolean;
}) => Promise<void> | void;

interface HandleAccountCollisionOptions {
  signOut: SignOutFunction;
  navigate: NavigateFunction;
}

export async function handleAccountCollision({
  signOut,
  navigate,
}: HandleAccountCollisionOptions): Promise<void> {
  try {
    await signOut();
  } catch {
    // Best effort sign-out so we can continue with the recovery flow.
  }

  setAuthLinkIntent({ reason: "ACCOUNT_LINK_REQUIRED" });

  await navigate({
    to: "/login",
    search: {
      returnTo: "/settings?tab=accounts",
    },
    replace: true,
  });
}
