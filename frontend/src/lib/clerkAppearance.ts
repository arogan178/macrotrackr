import { type DesignTokens, resolveTokens } from "@/lib/designTokens";

/**
 * Clerk's appearance object, built from the app's own tokens.
 *
 * This file held 95 hex literals transcribed by hand, and they were the palette
 * from before Phase 9: `#22c55e` green over `#121218` / `#1a1a22` cool greys,
 * while the app had moved to `#57c04a` over a warm near-black. The sign-in,
 * sign-up and profile screens were visibly a different product. It also pinned
 * `Inter`, which Archivo replaced.
 *
 * Two rules keep that from recurring: the `variables` come from
 * `resolveTokens()`, and the `elements` name Tailwind token classes rather than
 * arbitrary values, so both follow `style.css` automatically. Clerk needs `!`
 * on element classes to win against its own stylesheet.
 */

const el = {
  card: "bg-surface! border border-border! rounded-card",
  surface: "bg-surface!",
  raised: "bg-surface-2!",
  text: "text-foreground!",
  textMuted: "text-muted!",
  hairline: "border-border!",
  control: "rounded-control font-medium transition-colors",
} as const;

export function buildClerkAppearance(tokens: DesignTokens = resolveTokens()) {
  return {
    baseTheme: undefined,
    variables: {
      colorPrimary: tokens.primary,
      colorBackground: tokens.surface,
      colorBackgroundSecondary: tokens.surface2,
      colorBackgroundTertiary: tokens.surface3,
      colorForeground: tokens.foreground,
      colorForegroundSecondary: tokens.muted,
      colorForegroundMuted: tokens.muted,
      colorBorder: tokens.border,
      colorBorderSecondary: tokens.border2,
      colorSuccess: tokens.success,
      colorWarning: tokens.warning,
      colorError: tokens.error,
      colorInputBackground: tokens.surface2,
      colorInputBorder: tokens.border,
      borderRadius: "0.75rem",
      // Follow whatever the app is set in, rather than naming a family that a
      // later type decision has to remember to update here too.
      fontFamily: "inherit",
    },
    elements: {
      rootBox: "clerk-root-box",
      // No shadow: the page is near-black, so a drop shadow renders as nothing
      // and the border already separates the card. `shadows` is a pinned budget.
      card: el.card,
      header: `${el.surface} border-b ${el.hairline}`,
      headerTitle: `${el.text} font-semibold text-xl`,
      headerSubtitle: el.textMuted,
      navbar: `${el.raised} border-r ${el.hairline}`,
      navbarButton: `${el.textMuted} hover:text-foreground! hover:bg-surface-3! ${el.control}`,
      navbarButtonActive: `${el.text} bg-surface-3!`,
      navbarButtonIcon: "text-primary!",
      main: el.surface,
      mainContent: el.surface,

      text: el.text,
      textSecondary: el.textMuted,
      textCaption: el.textMuted,

      formFieldLabel: `${el.text} font-medium`,
      formFieldInput: `${el.raised} border-border! ${el.text} rounded-control focus:border-primary!`,
      formFieldInputError: "border-error! focus:border-error!",
      formFieldErrorText: "text-error!",
      formFieldHelperText: el.textMuted,
      formHeaderTitle: el.text,
      formHeaderSubtitle: el.textMuted,

      formButtonPrimary: `bg-primary! text-background! ${el.control} hover:opacity-90`,
      formButtonPrimaryDisabled: "opacity-50 cursor-not-allowed",
      formButtonSecondary: `${el.raised} ${el.text} border ${el.hairline} ${el.control} hover:bg-surface-3!`,
      button: el.control,

      badge: "rounded-full px-3 py-1 text-xs font-medium",
      badgeSuccess: "bg-surface-2! text-primary!",
      badgeWarning: "bg-surface-2! text-warning!",
      badgeDanger: "bg-surface-2! text-error!",
      badgeNeutral: `bg-surface-2! ${el.textMuted}`,

      avatar: "rounded-full",
      avatarImage: "rounded-full",

      userButtonTrigger: "rounded-full hover:opacity-80 transition-opacity",
      userButtonPopoverCard: el.card,
      userButtonPopoverActionButton: `${el.text} hover:bg-surface-2! ${el.control}`,
      userButtonPopoverActionButtonIcon: el.textMuted,
      userButtonPopoverFooter: `border-t ${el.hairline}`,

      profileSection: `border-b ${el.hairline} last:border-b-0`,
      profileSectionTitle: `${el.text} font-semibold`,
      profileSectionContent: el.textMuted,

      connectedAccount: `${el.raised} border ${el.hairline} rounded-control hover:border-border-2! transition-colors`,
      connectedAccountIcon: "text-primary!",
      connectedAccountName: `${el.text} font-medium`,
      connectedAccountDescription: el.textMuted,

      socialButtonsBlockButton: `${el.raised} border ${el.hairline} ${el.text} ${el.control} hover:bg-surface-3!`,
      socialButtonsBlockButtonText: "font-medium",
      socialButtonsIconButton: `${el.raised} border ${el.hairline} rounded-control hover:bg-surface-3!`,

      dividerLine: "bg-border!",
      dividerText: el.textMuted,

      modal: el.card,
      modalContent: el.surface,
      modalCloseButton: `${el.textMuted} hover:text-foreground! hover:bg-surface-2! ${el.control}`,
      modalBackdrop: "bg-black/70",

      accordionTrigger: `${el.text} hover:text-primary!`,
      accordionContent: el.textMuted,

      pages: {
        user: {
          profileSection: {
            card: `${el.raised} border ${el.hairline} rounded-control`,
          },
        },
      },
    },
  };
}

export const clerkAppearance = buildClerkAppearance();
