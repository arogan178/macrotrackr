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
| `primary`        | `#259145` | Primary brand color, CTAs, links  |
| `secondary`      | `#6bb38a` | Secondary accents, hover states   |
| `vibrant-accent` | `#dd7a24` | High-impact CTAs, attention items |

### Surface System (Elevation)

Surfaces get progressively lighter to indicate elevation:

| Token        | Value     | Usage                            |
| ------------ | --------- | -------------------------------- |
| `background` | `#0b1220` | Page background (Level 0)        |
| `surface`    | `#151b2b` | Cards, modals (Level 1)          |
| `surface-2`  | `#1b2336` | Nested elements (Level 2)        |
| `surface-3`  | `#202a40` | High-emphasis elements (Level 3) |
| `surface-4`  | `#252f48` | Highest emphasis (Level 4)       |

### Text Colors

| Token        | Value     | Usage                         |
| ------------ | --------- | ----------------------------- |
| `foreground` | `#eef3f8` | Primary text (high emphasis)  |
| `muted`      | `#98a6b5` | Secondary text, labels, hints |

### Border Colors

| Token      | Value     | Usage              |
| ---------- | --------- | ------------------ |
| `border`   | `#3a4350` | Standard borders   |
| `border-2` | `#465064` | Emphasized borders |

### Macro Colors

| Token     | Value     | Usage                      |
| --------- | --------- | -------------------------- |
| `protein` | `#23c06b` | Protein indicators, charts |
| `carbs`   | `#3a9ae6` | Carbohydrate indicators    |
| `fats`    | `#e24a46` | Fat indicators, charts     |

### System Colors

| Token     | Value     | Usage                         |
| --------- | --------- | ----------------------------- |
| `success` | `#24c46f` | Success states, confirmations |
| `warning` | `#c69060` | Warnings, cautions            |
| `error`   | `#ee544d` | Errors, destructive actions   |

---

## Shadow System

| Token        | Value                                                   |
| ------------ | ------------------------------------------------------- |
| `shadow-xs`  | `0 1px 2px 0 rgba(0,0,0,0.05)`                          |
| `shadow-sm`  | `0 1px 3px 0 rgba(0,0,0,0.1), 0 1px 2px -1px ...`       |
| `shadow-md`  | `0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -2px ...`    |
| `shadow-lg`  | `0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -4px ...`  |
| `shadow-xl`  | `0 20px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px ...` |
| `shadow-2xl` | `0 25px 50px -12px rgba(0,0,0,0.25)`                    |

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
<div className="bg-surface border border-border rounded-lg shadow-md">Content</div>

// Elevated card
<div className="bg-surface-2 border border-border rounded-lg shadow-lg">Elevated</div>
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
  --color-primary: #259145;
  --color-secondary: #6bb38a;
  --color-vibrant-accent: #dd7a24;
  --color-background: #0b1220;
  --color-surface: #151b2b;
  --color-surface-2: #1b2336;
  --color-surface-3: #202a40;
  --color-surface-4: #252f48;
  --color-border: #3a4350;
  --color-border-2: #465064;
  --color-foreground: #eef3f8;
  --color-muted: #98a6b5;
  --color-protein: #23c06b;
  --color-carbs: #3a9ae6;
  --color-fats: #e24a46;
  --color-success: #24c46f;
  --color-warning: #c69060;
  --color-error: #ee544d;
  /* shadows defined here too */
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
.text-surface-2 {
  color: var(--color-surface-2);
}
.text-surface-3 {
  color: var(--color-surface-3);
}
.text-surface-4 {
  color: var(--color-surface-4);
}
```

---

## Guidelines

1. **Always use semantic tokens** – never hardcode hex values in components
2. **Use the elevation ladder** – `surface` → `surface-2` → `surface-3` for nested elements
3. **Pair macro colors consistently** – protein=green, carbs=blue, fats=red
4. **Use muted for secondary text** – reserve `foreground` for primary content

---

_Last updated: Documented from actual implementation in `src/style.css`_
