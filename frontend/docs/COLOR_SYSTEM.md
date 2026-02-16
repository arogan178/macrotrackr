# Color System

This documents the actual color system used in Macro Tracker, defined via Tailwind CSS 4's `@theme` directive in `src/style.css`.

## Overview

- **Theme**: Dark only (no light mode)
- **Technology**: Tailwind CSS 4 with `@theme` directive
- **Source of truth**: `frontend/src/style.css`

All colors are defined as CSS custom properties and automatically generate Tailwind utility classes (e.g., `bg-primary`, `text-muted`).

---

## Color Tokens

### Brand Colors

| Token            | Value     | Usage                             |
| ---------------- | --------- | --------------------------------- |
| `primary`        | `#22c55e` | Primary brand color, CTAs, links  |
| `secondary`      | `#6ee7a0` | Secondary accents, hover states   |
| `vibrant-accent` | `#f59e0b` | High-impact CTAs, attention items |

### Surface System (Elevation)

Surfaces get progressively lighter to indicate elevation:

| Token        | Value     | Usage                            |
| ------------ | --------- | -------------------------------- |
| `background` | `#09090b` | Page background (Level 0)        |
| `surface`    | `#121218` | Cards, modals (Level 1)          |
| `surface-2`  | `#1a1a22` | Nested elements (Level 2)        |
| `surface-3`  | `#22222c` | High-emphasis elements (Level 3) |
| `surface-4`  | `#2a2a36` | Highest emphasis (Level 4)       |

### Text Colors

| Token        | Value     | Usage                         |
| ------------ | --------- | ----------------------------- |
| `foreground` | `#fafafa` | Primary text (high emphasis)  |
| `muted`      | `#a1a1aa` | Secondary text, labels, hints |

### Border Colors

| Token      | Value     | Usage              |
| ---------- | --------- | ------------------ |
| `border`   | `#27272a` | Standard borders   |
| `border-2` | `#3f3f46` | Emphasized borders |

### Macro Colors

| Token     | Value     | Usage                      |
| --------- | --------- | -------------------------- |
| `protein` | `#22c55e` | Protein indicators, charts |
| `carbs`   | `#3b82f6` | Carbohydrate indicators    |
| `fats`    | `#ef4444` | Fat indicators, charts     |

### System Colors

| Token     | Value     | Usage                         |
| --------- | --------- | ----------------------------- |
| `success` | `#22c55e` | Success states, confirmations |
| `warning` | `#f59e0b` | Warnings, cautions            |
| `error`   | `#ef4444` | Errors, destructive actions   |

---

## Shadow System

Minimal shadows following Memoria Design System principles. Shadows are subtle and used sparingly.

| Token               | Value                                              | Usage                    |
| ------------------- | -------------------------------------------------- | ------------------------ |
| `shadow-surface`    | `0 1px 2px 0 rgba(0,0,0,0.03)`                     | Subtle surface elevation |
| `shadow-primary`    | `0 1px 3px 0 rgba(0,0,0,0.06), 0 1px 2px -1px ...` | Primary elements         |
| `shadow-card`       | `0 1px 3px rgba(0,0,0,0.1)`                        | Card components          |
| `shadow-card-hover` | `0 4px 12px rgba(0,0,0,0.15)`                      | Card hover state         |
| `shadow-modal`      | `0 20px 40px -12px rgba(0,0,0,0.2)`                | Modal dialogs            |
| `shadow-warning`    | `0 2px 8px -2px rgba(245,158,11,0.1)`              | Warning elements         |
| `shadow-error`      | `0 2px 8px -2px rgba(239,68,68,0.1)`               | Error elements           |
| `shadow-success`    | `0 2px 8px -2px rgba(34,197,94,0.1)`               | Success elements         |
| `shadow-accent`     | `0 2px 8px -2px rgba(245,158,11,0.1)`              | Accent elements          |
| `shadow-glow`       | `0 0 12px rgba(34,197,94,0.08)`                    | Subtle glow effect       |
| `shadow-border`     | `0 1px 2px 0 rgba(0,0,0,0.03)`                     | Border elevation         |

### Shadow Usage Guidelines

1. **Cards**: Use `shadow-card` with `hover:shadow-card-hover` for interactive cards
2. **Modals**: Use `shadow-modal` for dialog overlays
3. **Colored shadows**: Use sparingly - the colored glow shadows (`shadow-warning`, `shadow-error`, `shadow-success`, `shadow-accent`) are intentionally subtle
4. **Avoid overuse**: The Memoria system prefers depth through surface colors over heavy shadows

---

## Neutral Opacity Backgrounds

For depth and overlay effects:

| Token            | Value                   | Usage                 |
| ---------------- | ----------------------- | --------------------- |
| `neutral-950-80` | `rgba(9, 9, 11, 0.8)`   | Modal/drawer overlays |
| `neutral-950-90` | `rgba(9, 9, 11, 0.9)`   | High-opacity overlays |
| `neutral-900-50` | `rgba(24, 24, 27, 0.5)` | Subtle overlays       |
| `neutral-900-80` | `rgba(24, 24, 27, 0.8)` | Standard overlays     |

---

## Easing Curves

Design system animation easing:

| Token         | Value                                     | Usage                    |
| ------------- | ----------------------------------------- | ------------------------ |
| `ease-modal`  | `cubic-bezier(0.32, 0.72, 0, 1)`          | Modal animations         |
| `ease-drawer` | `cubic-bezier(0.32, 0.72, 0, 1)`          | Drawer/sheet animations  |
| `ease-spring` | `cubic-bezier(0.175, 0.885, 0.32, 1.275)` | Bouncy/spring animations |

---

## Letter Spacing Tokens

For consistent typography:

| Token            | Value     | Usage                    |
| ---------------- | --------- | ------------------------ |
| `tracking-label` | `0.025em` | Labels, small text       |
| `tracking-wide`  | `0.05em`  | Standard wide tracking   |
| `tracking-wider` | `0.1em`   | Extra wide for uppercase |

---

## Usage Examples

### Text Hierarchy

```tsx
<p className="text-foreground">Primary content</p>
<p className="text-muted">Supporting content</p>
<a className="text-primary hover:text-secondary">Interactive link</a>
```

### Buttons

```tsx
// Primary
<button className="bg-primary hover:bg-secondary text-white">Action</button>

// Ghost
<button className="bg-surface-2 hover:bg-surface-3 text-foreground border border-border">
  Secondary
</button>

// Destructive
<button className="bg-error hover:bg-error/90 text-white">Delete</button>
```

### Cards

```tsx
// Standard card
<div className="bg-surface border border-border rounded-xl shadow-surface">Content</div>

// Elevated card
<div className="bg-surface-2 border border-border rounded-xl shadow-primary">Elevated</div>
```

### Macro Display

```tsx
<div className="flex gap-2">
  <span className="text-protein">Protein: 150g</span>
  <span className="text-carbs">Carbs: 200g</span>
  <span className="text-fats">Fats: 65g</span>
</div>
```

### System States

```tsx
<div className="bg-success/10 text-success border-l-4 border-success">Success</div>
<div className="bg-error/10 text-error border-l-4 border-error">Error</div>
<div className="bg-warning/10 text-warning border-l-4 border-warning">Warning</div>
```

---

## Implementation Details

### @theme Definition

All tokens are defined in `src/style.css`:

```css
@theme {
  /* Brand palette */
  --color-primary: #22c55e;
  --color-secondary: #6ee7a0;
  --color-vibrant-accent: #f59e0b;

  /* Surfaces */
  --color-background: #09090b;
  --color-surface: #121218;
  --color-surface-2: #1a1a22;
  --color-surface-3: #22222c;
  --color-surface-4: #2a2a36;

  /* Borders */
  --color-border: #27272a;
  --color-border-2: #3f3f46;

  /* Text */
  --color-foreground: #fafafa;
  --color-muted: #a1a1aa;

  /* Macro colors */
  --color-protein: #22c55e;
  --color-carbs: #3b82f6;
  --color-fats: #ef4444;

  /* Feedback */
  --color-success: #22c55e;
  --color-warning: #f59e0b;
  --color-error: #ef4444;

  /* Shadows – minimal, subtle for modern flat feel (Memoria style) */
  --shadow-surface: 0 1px 2px 0 rgba(0, 0, 0, 0.03);
  --shadow-primary:
    0 1px 3px 0 rgba(0, 0, 0, 0.06), 0 1px 2px -1px rgba(0, 0, 0, 0.06);
  --shadow-modal: 0 20px 40px -12px rgba(0, 0, 0, 0.2);
  --shadow-card: 0 1px 3px rgba(0, 0, 0, 0.1);
  --shadow-card-hover: 0 4px 12px rgba(0, 0, 0, 0.15);
  --shadow-warning: 0 2px 8px -2px rgba(245, 158, 11, 0.1);
  --shadow-error: 0 2px 8px -2px rgba(239, 68, 68, 0.1);
  --shadow-success: 0 2px 8px -2px rgba(34, 197, 94, 0.1);
  --shadow-accent: 0 2px 8px -2px rgba(245, 158, 11, 0.1);
  --shadow-glow: 0 0 12px rgba(34, 197, 94, 0.08);
  --shadow-border: 0 1px 2px 0 rgba(0, 0, 0, 0.03);
  /* ... more shadows */

  /* Neutral opacity backgrounds */
  --color-neutral-950-80: rgba(9, 9, 11, 0.8);
  --color-neutral-950-90: rgba(9, 9, 11, 0.9);
  --color-neutral-900-50: rgba(24, 24, 27, 0.5);
  --color-neutral-900-80: rgba(24, 24, 27, 0.8);

  /* Easing curves */
  --ease-modal: cubic-bezier(0.32, 0.72, 0, 1);
  --ease-drawer: cubic-bezier(0.32, 0.72, 0, 1);
  --ease-spring: cubic-bezier(0.175, 0.885, 0.32, 1.275);

  /* Letter spacing */
  --tracking-label: 0.025em;
  --tracking-wide: 0.05em;
  --tracking-wider: 0.1em;
}
```

### Manual Utility Classes

Surface variants have manual utilities defined:

```css
.bg-surface-2 {
  background-color: var(--color-surface-2);
}
.bg-surface-3 {
  background-color: var(--color-surface-3);
}
.bg-surface-4 {
  background-color: var(--color-surface-4);
}
.border-surface-2,
.border-border-2 {
  border-color: var(--color-border-2);
}
```

---

## Typography Guidelines

### Font Weight Usage

| Weight   | Class           | Usage                        |
| -------- | --------------- | ---------------------------- |
| Light    | `font-light`    | Hero numbers, large displays |
| Normal   | `font-normal`   | Body text                    |
| Medium   | `font-medium`   | Emphasized body text, labels |
| Semibold | `font-semibold` | Headings, buttons, labels    |

**Note**: Avoid `font-bold` and `font-extrabold` in most cases. Use `font-semibold` for emphasis.

### Letter Spacing

- Use `tracking-wide` for section labels and uppercase text
- Use `tracking-tight` for large headings
- Use default tracking for body text

#### Letter Spacing Guidelines

| Element Type     | Class            | Value      | Usage                           |
| ---------------- | ---------------- | ---------- | ------------------------------- |
| Section labels   | `tracking-wide`  | `0.025em`  | Form labels, section titles     |
| Uppercase badges | `tracking-wider` | `0.05em`   | Status badges, uppercase labels |
| Hero numbers     | `tracking-tight` | `-0.025em` | Large display numbers           |
| Body text        | (default)        | `0`        | Paragraphs, descriptions        |

---

## Spacing Standards

Consistent spacing patterns ensure visual harmony across the application.

### Page Layout Spacing

| Context   | Classes                | Usage                   |
| --------- | ---------------------- | ----------------------- |
| Page edge | `px-4 sm:px-6 lg:px-8` | Horizontal page padding |
| Sections  | `space-y-6`            | Vertical section gaps   |
| Cards     | `p-4` to `p-6`         | Card internal padding   |
| Forms     | `space-y-4`            | Form field spacing      |

### Component Spacing

| Component   | Internal Spacing | Example Usage                    |
| ----------- | ---------------- | -------------------------------- |
| Cards       | `p-4` to `p-6`   | `<div className="p-4">...</div>` |
| Form groups | `space-y-2`      | Label + input pairs              |
| Buttons     | `px-4 py-2`      | Standard button padding          |
| Badges      | `px-2 py-0.5`    | Compact badge padding            |

### Spacing Guidelines

1. **Use Tailwind's spacing scale** - Never use arbitrary pixel values
2. **Maintain consistent gaps** - Use `space-y-*` for vertical rhythm
3. **Responsive padding** - Start with `p-4`, increase for larger screens
4. **Group related elements** - Use `gap-*` in flex/grid containers

---

## Guidelines

1. **Always use semantic tokens** – never hardcode hex values in components
2. **Use the elevation ladder** – `surface` → `surface-2` → `surface-3` for nested elements
3. **Pair macro colors consistently** – protein=green, carbs=blue, fats=red
4. **Use muted for secondary text** – reserve `foreground` for primary content
5. **Use font-semibold instead of font-bold** – for better visual hierarchy
6. **Add tracking-wide to uppercase labels** – improves readability

---

_Last updated: Phase 5 Polish - Shadows & Spacing (2026-02-13)_
