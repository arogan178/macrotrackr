import React, { useCallback, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import { motion, useReducedMotion } from "motion/react";

import { getButtonClasses } from "@/components/ui/Button";
import {
  BackIcon,
  ChevronDownIcon,
  CloseIcon,
  ExternalLinkIcon,
  GithubIcon,
  GoalsIcon,
  HomeIcon,
  LogoutIcon,
  MenuIcon,
  ReportingIcon,
  SettingsIcon,
} from "@/components/ui/Icons";
import {
  CALCULATOR_TOOLS,
  TOOLS_HUB_PATH,
} from "@/features/landing/tools/toolsCatalog";
import { useLogout } from "@/hooks/auth/useAuthQueries";
import { DOCS_URL, GITHUB_REPO_URL } from "@/utils/appConstants";

import LogoButton from "./LogoButton";
import MobileNavSheet, {
  type MobileNavAction,
  type MobileNavItem,
} from "./MobileNavSheet";

export type AppHeaderMode = "app" | "public" | "minimal";

const APP_NAV_ITEMS = [
  { path: "/home", label: "Home", icon: HomeIcon },
  { path: "/goals", label: "Goals", icon: GoalsIcon },
  { path: "/reporting", label: "Analytics", icon: ReportingIcon },
  { path: "/settings", label: "Settings", icon: SettingsIcon },
] as const;

const linkClasses =
  "inline-flex min-h-11 cursor-pointer items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium text-muted transition-colors duration-200 hover:bg-surface-2 hover:text-foreground focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:outline-none";

const activeLinkClasses = "bg-surface-2 font-semibold text-foreground";

const iconButtonClasses =
  "inline-flex min-h-11 min-w-11 cursor-pointer items-center justify-center rounded-full border border-border bg-background text-foreground transition-colors duration-200 hover:bg-surface-2 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:outline-none";

const useHeaderNavigation = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  const isActiveRoute = useCallback(
    (path: string) => location.pathname.startsWith(path),
    [location.pathname],
  );

  const goTo = useCallback(
    (path: string) => {
      navigate({ to: path });
      setIsSheetOpen(false);
    },
    [navigate],
  );

  return {
    pathname: location.pathname,
    navigate,
    isActiveRoute,
    goTo,
    isSheetOpen,
    setIsSheetOpen,
  };
};

interface HeaderFrameProps {
  label: string;
  onLogoClick: () => void;
  logoLabel: string;
  center?: React.ReactNode;
  leading?: React.ReactNode;
  trailing?: React.ReactNode;
  menu?: { isOpen: boolean; onToggle: () => void };
  children?: React.ReactNode;
}

/** The chrome every mode shares: one height, one radius, one safe-area offset. */
const HeaderFrame: React.FC<HeaderFrameProps> = ({
  label,
  onLogoClick,
  logoLabel,
  center,
  leading,
  trailing,
  menu,
  children,
}) => {
  const shouldReduceMotion = useReducedMotion() ?? false;

  return (
    <>
      <header
        className="fixed inset-x-0 z-70 px-4 sm:px-6 lg:px-8"
        style={{ top: "calc(1rem + var(--sat))" }}
      >
        <nav
          className="mx-auto flex min-h-14 w-full max-w-7xl items-center justify-between gap-2 rounded-card border border-border bg-surface px-4 sm:px-6"
          aria-label={label}
          style={{ touchAction: "manipulation" }}
        >
          <div className="flex min-w-0 items-center gap-2 lg:gap-4">
            <LogoButton compact ariaLabel={logoLabel} onClick={onLogoClick} />
            {leading}
          </div>

          {center}

          <div className="flex shrink-0 items-center gap-2">
            {trailing}
            {menu ? (
              <motion.button
                type="button"
                whileTap={shouldReduceMotion ? undefined : { scale: 0.98 }}
                onClick={menu.onToggle}
                aria-label={menu.isOpen ? "Close menu" : "Open menu"}
                aria-expanded={menu.isOpen}
                className={`${iconButtonClasses} lg:hidden ${
                  menu.isOpen ? "bg-surface-2 text-foreground" : ""
                }`}
              >
                {menu.isOpen ? (
                  <CloseIcon className="h-5 w-5" />
                ) : (
                  <MenuIcon className="h-5 w-5" />
                )}
              </motion.button>
            ) : null}
          </div>
        </nav>
      </header>

      {children}
    </>
  );
};

const ToolsDropdown: React.FC<{ isActive: boolean; currentPath: string }> = ({
  isActive,
  currentPath,
}) => {
  const [open, setOpen] = useState(false);
  const popoverRef = React.useRef<HTMLDivElement>(null);

  // Close when the route changes, including on browser back/forward.
  // jsdom has no popover API, hence the optional call.
  const closePopover = () => popoverRef.current?.hidePopover?.();
  React.useEffect(closePopover, [currentPath]);

  const toolsPopoverItems = useMemo(
    () => [
      {
        to: TOOLS_HUB_PATH,
        label: "All free calculators",
        description: "Browse the complete suite of nutrition tools",
      },
      ...CALCULATOR_TOOLS.map((tool) => ({
        to: tool.path,
        label: tool.navLabel ?? tool.title,
        description: tool.tagline,
      })),
    ],
    [],
  );

  return (
    <>
      {/* Light dismiss, Escape and focus restoration come from the popover API. */}
      <button
        type="button"
        popoverTarget="tools-popover"
        className={`${linkClasses} [anchor-name:--tools-trigger] ${isActive ? activeLinkClasses : ""}`}
      >
        Tools
        <ChevronDownIcon
          className={`h-3.5 w-3.5 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          aria-hidden="true"
        />
      </button>
      <div
        ref={popoverRef}
        id="tools-popover"
        popover="auto"
        onToggle={(event) => setOpen(event.newState === "open")}
        className="w-80 rounded-card border border-border bg-surface p-2 shadow-modal [margin:0.5rem_0_0_0] [position-anchor:--tools-trigger] [position-area:bottom_span-right]"
      >
        <p
          id="tools-popover-heading"
          className="px-3 pt-1 pb-2 text-xs font-semibold tracking-wider text-muted uppercase"
        >
          Free calculators
        </p>
        <ul aria-labelledby="tools-popover-heading">
          {toolsPopoverItems.map((tool) => {
            const isCurrent = tool.to === currentPath;

            return (
              <li key={tool.to}>
                <Link
                  to={tool.to}
                  onClick={closePopover}
                  aria-current={isCurrent ? "page" : undefined}
                  className={`block rounded-control px-3 py-2.5 transition-colors duration-200 focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none ${
                    isCurrent ? "bg-surface-2" : "hover:bg-surface-2"
                  }`}
                >
                  <span
                    className={`block text-sm font-medium ${isCurrent ? "text-primary" : "text-foreground"}`}
                  >
                    {tool.label}
                  </span>
                  <span className="block text-xs text-muted">
                    {tool.description}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </>
  );
};

const AppModeHeader: React.FC = () => {
  const { navigate, isActiveRoute, goTo, isSheetOpen, setIsSheetOpen } =
    useHeaderNavigation();
  const shouldReduceMotion = useReducedMotion() ?? false;
  const logoutMutation = useLogout();

  const handleLogout = useCallback(() => {
    logoutMutation.mutate();
    setIsSheetOpen(false);
  }, [logoutMutation, setIsSheetOpen]);

  const items = useMemo<MobileNavItem[]>(
    () =>
      APP_NAV_ITEMS.map((item) => ({
        key: item.path,
        label: item.label,
        icon: item.icon,
        isActive: isActiveRoute(item.path),
        onSelect: () => goTo(item.path),
      })),
    [goTo, isActiveRoute],
  );

  const actions = useMemo<MobileNavAction[]>(
    () => [
      {
        key: "logout",
        label: "Log out",
        icon: LogoutIcon,
        onSelect: handleLogout,
        disabled: logoutMutation.isPending,
        tone: "danger",
      },
    ],
    [handleLogout, logoutMutation.isPending],
  );

  return (
    <HeaderFrame
      label="Main navigation"
      logoLabel="Go to home page"
      onLogoClick={() =>
        navigate({ to: "/home", search: { limit: 20, offset: 0 } })
      }
      leading={
        <div className="hidden items-center gap-2 lg:flex">
          {APP_NAV_ITEMS.map(({ path, label, icon: Icon }) => {
            const isActive = isActiveRoute(path);

            return (
              <button
                key={path}
                type="button"
                onClick={() => goTo(path)}
                aria-current={isActive ? "page" : undefined}
                className={`${linkClasses} ${isActive ? activeLinkClasses : ""}`}
              >
                <Icon
                  className={`h-4 w-4 shrink-0 ${isActive ? "text-primary" : "text-muted"}`}
                />
                <span>{label}</span>
              </button>
            );
          })}
        </div>
      }
      trailing={
        <div className="hidden lg:flex">
          <button
            type="button"
            onClick={handleLogout}
            disabled={logoutMutation.isPending}
            className={getButtonClasses(
              "ghost",
              "sm",
              false,
              "gap-2.5 rounded-full font-medium",
            )}
          >
            <LogoutIcon className="h-4 w-4" />
            <span>Log out</span>
          </button>
        </div>
      }
      menu={{
        isOpen: isSheetOpen,
        onToggle: () => setIsSheetOpen((open) => !open),
      }}
    >
      <MobileNavSheet
        isOpen={isSheetOpen}
        onClose={() => setIsSheetOpen(false)}
        items={items}
        actions={actions}
        shouldReduceMotion={shouldReduceMotion}
        label="Main navigation"
      />
    </HeaderFrame>
  );
};

const PublicModeHeader: React.FC = () => {
  const { pathname, navigate, isActiveRoute, goTo, isSheetOpen, setIsSheetOpen } =
    useHeaderNavigation();
  const shouldReduceMotion = useReducedMotion() ?? false;

  const openExternal = useCallback(
    (url: string) => {
      globalThis.open(url, "_blank", "noreferrer");
      setIsSheetOpen(false);
    },
    [setIsSheetOpen],
  );

  const items = useMemo<MobileNavItem[]>(
    () => [
      {
        key: TOOLS_HUB_PATH,
        label: "Calculators",
        isActive: isActiveRoute("/tools"),
        onSelect: () => goTo(TOOLS_HUB_PATH),
      },
      {
        key: "/blog",
        label: "Blog",
        isActive: isActiveRoute("/blog"),
        onSelect: () => goTo("/blog"),
      },
      {
        key: "/pricing",
        label: "Pricing",
        isActive: isActiveRoute("/pricing"),
        onSelect: () => goTo("/pricing"),
      },
      {
        key: "docs",
        label: "Docs",
        icon: ExternalLinkIcon,
        onSelect: () => openExternal(DOCS_URL),
      },
      {
        key: "github",
        label: "GitHub",
        icon: GithubIcon,
        onSelect: () => openExternal(GITHUB_REPO_URL),
      },
    ],
    [goTo, isActiveRoute, openExternal],
  );

  const actions = useMemo<MobileNavAction[]>(
    () => [
      { key: "login", label: "Log in", onSelect: () => goTo("/login") },
      {
        key: "register",
        label: "Start free",
        onSelect: () => goTo("/register"),
        tone: "primary",
      },
    ],
    [goTo],
  );

  return (
    <HeaderFrame
      label="Site navigation"
      logoLabel="MacroTrackr home"
      onLogoClick={() => navigate({ to: "/" })}
      center={
        <div className="hidden items-center justify-center gap-1 lg:flex lg:flex-1">
          <ToolsDropdown
            isActive={isActiveRoute("/tools")}
            currentPath={pathname}
          />
          <Link
            to="/blog"
            search={{ category: undefined, tag: undefined, q: undefined }}
            className={`${linkClasses} ${isActiveRoute("/blog") ? activeLinkClasses : ""}`}
          >
            Blog
          </Link>
          <Link
            to="/pricing"
            className={`${linkClasses} ${isActiveRoute("/pricing") ? activeLinkClasses : ""}`}
          >
            Pricing
          </Link>
          <a
            href={DOCS_URL}
            target="_blank"
            rel="noreferrer"
            className={linkClasses}
          >
            Docs
            <ExternalLinkIcon className="h-3.5 w-3.5" aria-hidden="true" />
          </a>
          <a
            href={GITHUB_REPO_URL}
            target="_blank"
            rel="noreferrer"
            className={linkClasses}
            aria-label="View MacroTrackr on GitHub"
          >
            <GithubIcon className="h-3.5 w-3.5" aria-hidden="true" />
            GitHub
          </a>
        </div>
      }
      trailing={
        <div className="hidden items-center gap-3 lg:flex">
          <Link
            to="/login"
            search={{ returnTo: undefined }}
            className={linkClasses}
          >
            Log in
          </Link>
          <Link
            to="/register"
            search={{ returnTo: undefined }}
            className={getButtonClasses(
              "primary",
              "sm",
              false,
              "rounded-full font-semibold whitespace-nowrap",
            )}
          >
            Start free
          </Link>
        </div>
      }
      menu={{
        isOpen: isSheetOpen,
        onToggle: () => setIsSheetOpen((open) => !open),
      }}
    >
      <MobileNavSheet
        isOpen={isSheetOpen}
        onClose={() => setIsSheetOpen(false)}
        items={items}
        actions={actions}
        shouldReduceMotion={shouldReduceMotion}
        label="Site navigation"
      />
    </HeaderFrame>
  );
};

const MinimalModeHeader: React.FC<{ showBackToHome: boolean }> = ({
  showBackToHome,
}) => {
  const navigate = useNavigate();

  return (
    <HeaderFrame
      label="Site navigation"
      logoLabel="MacroTrackr home"
      onLogoClick={() => navigate({ to: "/" })}
      trailing={
        showBackToHome ? (
          <button
            type="button"
            onClick={() => navigate({ to: "/" })}
            className={getButtonClasses(
              "ghost",
              "sm",
              false,
              "gap-2 rounded-full font-medium text-foreground",
            )}
          >
            <BackIcon />
            <span>Back to home</span>
          </button>
        ) : null
      }
    />
  );
};

interface AppHeaderProps {
  mode: AppHeaderMode;
  /** `minimal` only: hides the single trailing action. */
  showBackToHome?: boolean;
}

/**
 * The one top bar. `app` carries the signed-in destinations, `public` carries
 * the marketing and tools routes, `minimal` is the auth pages. All three share
 * one set of chrome, one height and one safe-area offset, so the page offset
 * stays a single number that `PageShell` positions against.
 */
const AppHeader: React.FC<AppHeaderProps> = ({
  mode,
  showBackToHome = true,
}) => {
  if (mode === "app") return <AppModeHeader />;
  if (mode === "public") return <PublicModeHeader />;

  return <MinimalModeHeader showBackToHome={showBackToHome} />;
};

export default AppHeader;
