# Macro Tracker Design System

A hybrid design language for nutrition tracking applications, combining Memoria-inspired premium aesthetics with brand-specific color coding for macro tracking.

---

## Philosophy

> "Numbers are heroes, labels are whispers. Green means protein, data tells the story."

This system creates interfaces that feel like premium personal analytics while preserving the essential color-coded macro tracking experience. The design is calm, confident, and data-forward with purposeful use of brand colors.

### Core Beliefs

1. **Hierarchy through restraint** — Size and opacity create importance, color serves function
2. **Data speaks first** — Large metrics dominate, supporting text recedes
3. **Sequential revelation** — Elements wake up one by one, never all at once
4. **Confident emptiness** — Whitespace is intentional, not leftover
5. **Invisible interaction** — Hover states reveal, not decorate
6. **Functional color** — Brand colors serve semantic purposes (macros, status, CTAs)

### Key Decisions (Hybrid Approach)

The design system adopts a **Hybrid Approach** that selectively adopts Memoria patterns while preserving brand identity:

| What               | Decision            | Rationale                                                  |
| ------------------ | ------------------- | ---------------------------------------------------------- |
| Brand Colors       | **PRESERVED**       | Green primary (#22c55e) is core to macro tracking identity |
| Macro Color System | **PRESERVED**       | Protein=green, Carbs=blue, Fats=red is essential UX        |
| Semantic Colors    | **PRESERVED**       | Success/Warning/Error colors for status meaning            |
| Typography Scale   | **ADOPTED**         | Light weights for large text, size for hierarchy           |
| Animation Patterns | **ADOPTED**         | Blur-to-clear, spring-based modals, staggered reveals      |
| ProgressiveBlur    | **ADOPTED**         | Required on all scroll containers                          |
| 3D Card Effects    | **ADOPTED**         | Premium hover interactions with glare                      |
| BorderBeam         | **NOT IMPLEMENTED** | Scrapped - not needed for current design                   |
| Minimal Shadows    | **ADOPTED**         | Flat, modern aesthetic                                     |

---

## Color Palette

### Brand Colors (Preserved)

```css
/* Primary Brand */
--color-primary: #22c55e; /* Green - protein, success, main CTAs */
--color-secondary: #6ee7a0; /* Light green - secondary accents */
--color-vibrant-accent: #f59e0b; /* Amber - Pro features, highlights */

/* Macro Tracking Colors (Essential UX) */
--color-protein: #22c55e; /* Green */
--color-carbs: #3b82f6; /* Blue */
--color-fats: #ef4444; /* Red */

/* Semantic/Feedback Colors */
--color-success: #22c55e; /* Green */
--color-warning: #f59e0b; /* Amber */
--color-error: #ef4444; /* Red */
```

### Surface Colors (Memoria-aligned)

```css
/* Backgrounds (darkest to lightest) */
--color-background: #09090b; /* Main app background */
--color-surface: #121218; /* Primary surface */
--color-surface-2: #1a1a22; /* Elevated surface */
--color-surface-3: #22222c; /* Cards, containers */
--color-surface-4: #2a2a36; /* Hover states */

/* Borders */
--color-border: #27272a; /* Default borders */
--color-border-2: #3f3f46; /* Subtle borders */

/* Text Hierarchy */
--color-foreground: #fafafa; /* Primary text */
--color-muted: #a1a1aa; /* Secondary text */
```

### Neutral Opacity Backgrounds

```css
/* For depth and layering */
--color-neutral-950-80: rgba(9, 9, 11, 0.8);
--color-neutral-950-90: rgba(9, 9, 11, 0.9);
--color-neutral-900-50: rgba(24, 24, 27, 0.5);
--color-neutral-900-80: rgba(24, 24, 27, 0.8);
```

### Effect Colors

```css
/* Glare Effects */
rgba(255,255,255,0.15)  /* Glare center */
rgba(255,255,255,0.05)  /* Glare mid */
rgba(255,255,255,0)     /* Glare edge */
```

---

## Typography

Light weights for large text. Size creates hierarchy, not bold.

### Font Weights

```css
font-light       /* Hero stats (3xl-6xl numbers), main titles - PREFERRED */
font-normal      /* Body text default */
font-medium      /* Item titles, badges, buttons */
font-semibold    /* Important labels, section headings */
/* font-bold is avoided — use size + font-light instead */
```

### Font Size Scale

```css
text-[10px]      /* Tags, timestamps, progress indicators */
text-xs          /* Descriptions, metadata (12px) */
text-sm          /* Item titles, body text (14px) */
text-base        /* Modal titles, section headers (16px) */
text-lg          /* Page titles (18px) */
text-xl          /* Card titles (20px) */
text-2xl         /* Activity totals, card stats (24px) */
text-3xl-6xl     /* Hero stats (responsive) */
```

### Letter Spacing

```css
tracking-tight     /* Hero stats, main numbers */
tracking-wide      /* Body text emphasis */
tracking-wider     /* Labels */
tracking-widest    /* Uppercase labels */
```

### Text Transforms

```css
uppercase          /* Tags, badges, progress labels, section headers */
capitalize         /* Titles */
lowercase          /* Formatting normalization */
```

---

## Animation System

### Core Philosophy: Sequential Revelation

Elements appear sequentially—hero content first, then supporting sections, then list items one by one.

### Signature Easing Curves

```tsx
// Section reveal (smooth deceleration)
ease: [0.22, 1, 0.36, 1];

// Page transitions (smooth deceleration)
ease: [0.25, 0.46, 0.45, 0.94];

// Modal/drawer
ease: [0.32, 0.72, 0, 1];

// Spring-based (tabs, modals)
type: "spring";
stiffness: 260 - 420;
damping: 15 - 32;
```

### Section Reveals & Performance

```tsx
const sectionRevealVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] },
  },
};

// Usage with performance optimizations
<motion.section
  variants={sectionRevealVariants}
  initial="hidden"
  whileInView="visible"
  viewport={{ once: true, amount: 0.2 }}
  style={{ contentVisibility: "auto", containIntrinsicSize: "600px" }}
>
```

### Page Transitions (Blur-to-Clear)

```tsx
// PageTransition component
initial={{ opacity: 0, filter: 'blur(8px)' }}
animate={{ opacity: 1, filter: 'blur(0px)' }}
exit={{ opacity: 0, filter: 'blur(8px)' }}
transition={{ duration: 0.3, ease: [0.32, 0.72, 0, 1] }}
```

### Text Generate Effect (Word-by-Word)

```tsx
// TextGenerateEffect component
initial={{ opacity: 0, filter: 'blur(10px)', y: 5 }}
animate={{ opacity: 1, filter: 'blur(0px)', y: 0 }}
stagger: 0.08s (fast) or 0.2s (dramatic)
duration: 0.4s
```

### Scroll-Triggered Animations

```tsx
// ScrollTriggeredDiv component
initial={{ opacity: 0, y: 48, filter: 'blur(8px)' }}
animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
transition={{ type: "spring", stiffness: 420, damping: 32, duration: 0.65 }}
```

### Modal Animations (3D Spring)

```tsx
// Modal component
initial={{ opacity: 0, scale: 0.95, y: 20, rotateX: -10 }}
animate={{ opacity: 1, scale: 1, y: 0, rotateX: 0 }}
exit={{ opacity: 0, scale: 0.95, y: 20, rotateX: 10 }}
transition={{ type: "spring", stiffness: 300, damping: 30 }}
```

### Tab Indicator (Shared Layout)

```tsx
// TabButton component
layoutId="tabHighlight"
transition={{ type: "spring", stiffness: 400, damping: 28, mass: 0.8 }}
```

### Animated Counter

```tsx
// AnimatedNumber component
duration: 800-1000ms
suffix: " kcal" (optional)
toFixedValue: 0
```

### Accessibility

All animations respect `prefers-reduced-motion` using `motion/react`:

```tsx
import { useReducedMotion } from "motion/react";

const shouldReduceMotion = useReducedMotion();

// Fallback variants or conditional props
const inViewRevealProps =
  shouldReduceMotion ?
    { initial: false as const }
  : {
      initial: "hidden",
      whileInView: "visible",
      viewport: { once: true, amount: 0.2 },
    };
```

---

## Loading States & Skeletons

### Themed Fallbacks

For Suspense boundaries, use themed fallbacks that match the surface they replace, utilizing `animate-pulse` with specific opacity backgrounds:

```tsx
<div className="rounded-xl border border-border bg-surface px-8 py-10">
  <div className="mb-6 h-6 w-56 animate-pulse rounded bg-muted/40" />
  <div className="mb-3 h-4 w-80 animate-pulse rounded bg-muted/30" />
  <div className="h-10 w-28 animate-pulse rounded-lg bg-primary/20" />
</div>
```

### Component Skeletons

Prefer specific skeleton components (e.g., `AddEntryLoadingSkeleton`, `DailySummaryLoadingSkeleton`) over generic spinners for content areas to prevent layout shift.

---

## UI Components

### ProgressiveBlur

**Required for all scrollable containers.** Creates depth by fading content at edges.

```tsx
// Usage
<ProgressiveBlur
  direction="up" // "up" | "down"
  intensity={0.6} // 0-1, blur strength
  height="60px" // 60-80px typical
  position="bottom" // "top" | "bottom"
  show={!isAtBottom} // Hide when scrolled to edge
/>
```

**Required Pattern:**

```tsx
<div className="relative h-80">
  <div className="absolute inset-0 overflow-y-auto" onScroll={handleScroll}>
    {/* Content */}
  </div>
  <ProgressiveBlur
    direction="up"
    intensity={0.2}
    height="40px"
    show={!isAtBottom}
  />
</div>
```

### useCardGlare Hook

3D card glare effect for premium hover interactions.

```tsx
const { cardRef, cardStyle, glareStyle, handlers } = useCardGlare({
  maxRotation: 15, // Max rotation degrees
  scale: 1.02, // Hover scale
  perspective: 1000, // 3D perspective
  glareIntensity: 0.15, // 0-1
  enableGlare: true,
  enableRotation: true,
});

// Usage
<motion.div ref={cardRef} style={cardStyle} {...handlers}>
  <div style={glareStyle} />
  {content}
</motion.div>;
```

### MetricCard

Hero stat display with optional glare effect.

```tsx
<MetricCard
  icon={Icon}
  title="Protein"
  value={120}
  acronym="g"
  color="protein"
  enableGlare={true} // Enable 3D effect
  delay={0.1} // Animation delay
/>
```

### StatusBadge

Status indicators with uppercase styling.

```tsx
<StatusBadge
  status="active" // active | success | warning | error | neutral
  size="md" // sm | md | lg
  variant="solid" // solid | outline | subtle
  pulse={true} // Pulsing animation
  showIcon={true}
/>
```

### Modal

Animated modal with 3D spring animation.

```tsx
<Modal
  isOpen={isOpen}
  onClose={onClose}
  title="Title"
  variant="form" // "form" | "confirmation"
  size="md" // sm | md | lg | xl | 2xl
  onSave={handleSave} // Form variant
  onConfirm={handleConfirm} // Confirmation variant
  isDanger={true} // Destructive action styling
/>
```

### TabButton

Tab with animated background indicator.

```tsx
<TabButton
  active={isActive}
  onClick={handleClick}
  layoutId="tabHighlight"
  isMotion={true}
  fullWidth={false}
>
  Tab Label
</TabButton>
```

---

## Layout Patterns

### Page Containers

Use standard wrappers for consistent page layouts:

- `DashboardPageContainer`: Main wrapper for authenticated dashboard pages.
- `FeaturePage`: Inner wrapper with animated title and subtitle.

```tsx
<DashboardPageContainer>
  <FeaturePage title="Dashboard" subtitle="Welcome back" animateTitle>
    {/* Content */}
  </FeaturePage>
</DashboardPageContainer>
```

### Grid Layouts

Standard responsive grid for dashboard panels:

```tsx
<div className="grid grid-cols-1 gap-5 lg:grid-cols-6">
  <div className="flex h-full flex-col space-y-5 lg:col-span-4">
    {/* Main content */}
  </div>
  <div className="flex h-full flex-col lg:col-span-2">
    {/* Sidebar/Summary */}
  </div>
</div>
```

### Spacing Scale

```css
gap-1           /* Tight elements */
gap-2           /* Icon buttons, small elements */
gap-3           /* Item groups, navigation */
gap-4           /* Dashboard cards */
gap-6           /* Page sections */

/* Padding Scale */
p-2             /* Small items */
p-3             /* Compact cards */
p-4             /* Standard cards */
p-5             /* Form sections */
p-6             /* Page padding, modal content */
```

### Border Radius Scale

```css
rounded-lg      /* Buttons, inputs (8px) */
rounded-xl      /* Cards (12px) */
rounded-2xl     /* Large cards, modals (16px) */
rounded-full    /* Pills, tabs, badges, avatars */
```

### Scroll Container Pattern

**All scrollable content requires ProgressiveBlur:**

```tsx
<div className="relative flex-1 min-h-0">
  <div className="absolute inset-0 overflow-y-auto pb-16">
    {/* Content with adequate bottom padding */}
  </div>
  <ProgressiveBlur direction="up" height="80px" position="bottom" />
</div>
```

### Card Containers

```tsx
// Standard CardContainer
<CardContainer className="rounded-2xl border border-border/60">
  <div className="p-5">{/* Content */}</div>
</CardContainer>
```

---

## Performance Patterns

### Component Prefetching

Use `requestIdleCallback` to prefetch lazy-loaded components without blocking the main thread, respecting data saver preferences:

```tsx
useEffect(() => {
  const connection = (navigator as any).connection;
  if (connection?.saveData || connection?.effectiveType === "2g") return;

  const doPrefetch = () => {
    void import("../components/HeavyComponent");
  };

  if ("requestIdleCallback" in globalThis) {
    globalThis.requestIdleCallback(doPrefetch, { timeout: 1500 });
  } else {
    setTimeout(doPrefetch, 500);
  }
}, []);
```

### Rendering Optimization

Use `contentVisibility: "auto"` and `containIntrinsicSize` on large animated sections to defer rendering of off-screen content.

---

## Interactive States

### Hover States

```tsx
// Cards
hover:border-neutral-700
hover:bg-surface-2
whileHover={{ scale: 1.02 }}

// Text
hover:text-foreground  /* From text-muted */

// Reveal on hover
opacity-0 group-hover:opacity-100
```

### Focus States

```tsx
focus:outline-none
focus:ring-2 focus:ring-primary
focus-visible:ring-2 focus-visible:ring-primary
```

### Disabled States

```tsx
opacity-50 cursor-not-allowed
disabled:hover:bg-surface-3
```

---

## Component Catalog

### Cards

```tsx
// Standard card
"bg-surface border border-border rounded-xl p-4 hover:border-border-2"

// With glare effect (MetricCard)
enableGlare={true}

// Featured card
"relative bg-surface border border-border rounded-xl"
```

### Buttons

```tsx
// Primary (brand green)
"bg-primary text-background hover:bg-primary/85 active:bg-primary/70";

// Secondary
"bg-surface-3 text-foreground border border-border hover:bg-surface-4";

// Danger
"bg-error/15 text-error border border-error/25 hover:bg-error/25";

// Ghost
"bg-transparent text-muted hover:bg-surface-2 hover:text-foreground";
```

### Badges

```tsx
// StatusBadge with uppercase styling
"px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider rounded-full";

// Color variants
success: "bg-success/20 text-success border border-success/40";
warning: "bg-warning/20 text-warning border border-warning/40";
error: "bg-error/20 text-error border border-error/40";
neutral: "bg-surface-3 text-foreground border border-border/40";
```

### Inputs

```tsx
"bg-surface border border-border rounded-lg px-4 py-2
 text-foreground placeholder:text-muted
 focus:outline-none focus:ring-2 focus:ring-primary"
```

---

## Tech Stack

- **React** - UI framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Utility-first styling
- **motion/react** (Framer Motion) - Animations
- **TanStack Query** - Data fetching
- **TanStack Router** - Routing
- **Vitest** - Unit testing
- **Playwright / Puppeteer** - E2E testing

---

## Testing Patterns

### UI Testability

Design components to be easily testable by E2E frameworks (Playwright/Puppeteer) without relying on brittle CSS classes:

1. **Semantic HTML First**: Prefer native elements (`<button>`, `<select>`, `<nav>`) that can be selected by role or text.
2. **Accessible Text**: Ensure buttons and links have clear, predictable text content (e.g., `button:has-text("Sign In")`).
3. **ARIA Attributes**: Use `aria-label` for icon-only buttons or complex interactive elements (e.g., `[aria-label="User menu"]`).
4. **Test IDs**: Use `data-testid` as a fallback for elements that lack semantic meaning or text (e.g., `data-testid="user-menu"`).

```tsx
// ✅ Good: Testable via semantic text or ARIA
<button onClick={submit}>Save Entry</button>
<button aria-label="Close modal" onClick={close}><Icon name="x" /></button>

// ✅ Good: Testable via data-testid when necessary
<div data-testid="macro-summary-chart">...</div>

// ❌ Bad: Relying on CSS classes for tests
<div className="btn-primary submit-btn" onClick={submit}>Save</div>
```

---

## Quality Checklist

Before considering a feature complete:

- [ ] Do animations respect `prefers-reduced-motion`?
- [ ] Are large numbers using `font-light`, not `font-bold`?
- [ ] Are labels uppercase with `tracking-wider`?
- [ ] Do all scroll containers have ProgressiveBlur?
- [ ] Do cards have hover state transitions?
- [ ] Is the primary green used for main CTAs?
- [ ] Are macro colors consistent (protein=green, carbs=blue, fats=red)?
- [ ] Is there generous whitespace between sections?
- [ ] Are animations staggered sequentially?
- [ ] Are utility functions covered by Vitest unit tests?
- [ ] Are critical user flows testable via semantic HTML, ARIA labels, or `data-testid`?

---

## Allowed vs Not Allowed

### ✓ Allowed

- Brand green (#22c55e) for primary actions and protein
- Macro color coding (protein=green, carbs=blue, fats=red)
- Semantic colors (success/warning/error)
- Light font weights for large text
- Uppercase labels with wide letter-spacing
- Semi-transparent backgrounds
- Subtle borders
- Staggered sequential animations
- Blur-to-clear text reveals
- Growing bars and counting numbers
- Hover states that reveal or brighten
- Generous whitespace
- ProgressiveBlur on all scroll containers
- 3D card glare effects
- Minimal shadows

### ✗ Not Allowed

- Gradients for decoration
- `font-bold` for emphasis (use size + `font-light`)
- Heavy or prominent borders
- Simultaneous animations (everything at once)
- Decorative icons
- Emojis in UI
- Drop shadows (except very subtle on modals)
- Color-coded badges for non-semantic purposes
- Gridlines or axis labels on charts (keep minimal)

---

## Best Practices Summary

1. **Brand Consistency** - Use green for primary actions, preserve macro colors
2. **Hierarchy** - Use opacity and size for visual hierarchy
3. **Animations** - Keep subtle (0.2-0.4s), use blur-to-clear for polish
4. **Accessibility** - Always respect `prefers-reduced-motion`
5. **Spacing** - Consistent padding (p-4 for cards, p-6 for pages)
6. **Borders** - Default `border-border`, hover `border-border-2`
7. **Scroll** - Always add ProgressiveBlur to scrollable containers
8. **Cards** - Add glare effect for premium feel when appropriate
9. **Typography** - Light weights for large text, uppercase for labels
10. **Color** - Functional use only (macros, status, CTAs)
