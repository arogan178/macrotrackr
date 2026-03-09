// Clerk appearance configuration matching the app's dark theme
// Used globally in ClerkProvider and in openUserProfile calls

export const clerkAppearance = {
  baseTheme: undefined,
  variables: {
    colorPrimary: "#22c55e",
    colorBackground: "#121218",
    colorBackgroundSecondary: "#1a1a22",
    colorBackgroundTertiary: "#22222c",
    colorForeground: "#fafafa",
    colorForegroundSecondary: "#a1a1aa",
    colorForegroundMuted: "#71717a",
    colorBorder: "#27272a",
    colorBorderSecondary: "#3f3f46",
    colorSuccess: "#22c55e",
    colorWarning: "#f59e0b",
    colorError: "#ef4444",
    colorInputBackground: "#1a1a22",
    colorInputBorder: "#27272a",
    borderRadius: "0.75rem",
    fontFamily: '"Inter", system-ui, -apple-system, sans-serif',
  },
  elements: {
    rootBox: "clerk-root-box",
    card: "bg-[#121218]! border border-[#27272a]! rounded-xl shadow-[0_25px_50px_-12px_rgba(0,0,0,0.25)]",
    header: "bg-[#121218]! border-b border-[#27272a]!",
    headerTitle: "text-[#fafafa]! font-semibold text-xl",
    headerSubtitle: "text-[#a1a1aa]!",
    navbar: "bg-[#1a1a22]! border-r border-[#27272a]!",
    navbarButton: "text-[#a1a1aa]! hover:text-[#fafafa]! hover:bg-[#22222c]! rounded-lg transition-colors",
    navbarButtonActive: "text-[#fafafa]! bg-[#22222c]!",
    navbarButtonIcon: "text-[#22c55e]!",
    main: "bg-[#121218]!",
    mainContent: "bg-[#121218]!",
    // Text elements - ensure all text is light colored
    text: "text-[#fafafa]!",
    textSecondary: "text-[#a1a1aa]!",
    textCaption: "text-[#71717a]!",
    // Form elements
    formFieldLabel: "text-[#fafafa]! font-medium",
    formFieldInput: "bg-[#1a1a22]! border-[#27272a]! text-[#fafafa]! rounded-lg focus:border-[#22c55e]! focus:ring-[#22c55e]/20",
    formFieldInputError: "border-[#ef4444]! focus:border-[#ef4444]!",
    formFieldErrorText: "text-[#ef4444]!",
    formFieldHelperText: "text-[#a1a1aa]!",
    formHeaderTitle: "text-[#fafafa]!",
    formHeaderSubtitle: "text-[#a1a1aa]!",
    // Buttons
    formButtonPrimary: "bg-[#22c55e]! text-[#09090b]! font-medium rounded-lg hover:bg-[#22c55e]/90 transition-colors",
    formButtonPrimaryDisabled: "opacity-50 cursor-not-allowed",
    formButtonSecondary: "bg-[#1a1a22]! text-[#fafafa]! border border-[#27272a]! rounded-lg hover:bg-[#22222c]! transition-colors",
    button: "rounded-lg font-medium transition-colors",
    // Badges
    badge: "rounded-full px-3 py-1 text-xs font-medium",
    badgeSuccess: "bg-[#22c55e]/20! text-[#22c55e]!",
    badgeWarning: "bg-[#f59e0b]/20! text-[#f59e0b]!",
    badgeDanger: "bg-[#ef4444]/20! text-[#ef4444]!",
    badgeNeutral: "bg-[#27272a]! text-[#a1a1aa]!",
    // Avatar
    avatar: "rounded-full",
    avatarImage: "rounded-full",
    // User button
    userButtonTrigger: "rounded-full hover:opacity-80 transition-opacity",
    userButtonPopoverCard: "bg-[#121218]! border border-[#27272a]! rounded-xl shadow-[0_25px_50px_-12px_rgba(0,0,0,0.25)]",
    userButtonPopoverActionButton: "text-[#fafafa]! hover:bg-[#1a1a22]! rounded-lg transition-colors",
    userButtonPopoverActionButtonIcon: "text-[#a1a1aa]!",
    userButtonPopoverFooter: "border-t border-[#27272a]!",
    // Profile sections
    profileSection: "border-b border-[#27272a]! last:border-b-0",
    profileSectionTitle: "text-[#fafafa]! font-semibold",
    profileSectionContent: "text-[#a1a1aa]!",
    // Connected accounts
    connectedAccount: "bg-[#1a1a22]! border border-[#27272a]! rounded-lg hover:border-[#3f3f46]! transition-colors",
    connectedAccountIcon: "text-[#22c55e]!",
    connectedAccountName: "text-[#fafafa]! font-medium",
    connectedAccountDescription: "text-[#a1a1aa]!",
    // Social buttons
    socialButtonsBlockButton: "bg-[#1a1a22]! border border-[#27272a]! text-[#fafafa]! rounded-lg hover:bg-[#22222c]! transition-colors",
    socialButtonsBlockButtonText: "font-medium",
    socialButtonsIconButton: "bg-[#1a1a22]! border border-[#27272a]! rounded-lg hover:bg-[#22222c]!",
    // Dividers
    dividerLine: "bg-[#27272a]!",
    dividerText: "text-[#71717a]!",
    // Modals
    modal: "bg-[#121218]! border border-[#27272a]! rounded-xl shadow-[0_25px_50px_-12px_rgba(0,0,0,0.25)]",
    modalContent: "bg-[#121218]!",
    modalCloseButton: "text-[#a1a1aa]! hover:text-[#fafafa]! hover:bg-[#1a1a22]! rounded-lg transition-colors",
    modalBackdrop: "bg-black/70 backdrop-blur-[2px]",
    // Accordion
    accordionTrigger: "text-[#fafafa]! hover:text-[#22c55e]!",
    accordionContent: "text-[#a1a1aa]!",
    // Page specific
    pages: {
      user: {
        profileSection: {
          card: "bg-[#1a1a22]! border border-[#27272a]! rounded-xl",
        },
      },
    },
  },
};
