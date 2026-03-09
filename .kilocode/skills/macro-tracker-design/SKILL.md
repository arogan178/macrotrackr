---
name: macro-tracker-design
description: Review UI code for Macro Tracker design system compliance. Use when asked to "review my UI", "check design", "audit design system", or when implementing new components.
metadata:
  author: macro-tracker
  version: "1.0.0"
  argument-hint: <file-or-pattern>
---

# Macro Tracker Design System Review

Review files for compliance with the Macro Tracker Design System.

## How It Works

1. Read the design system documentation from `.github/design-system.md`
2. Read the specified files (or prompt user for files/pattern)
3. Check against all rules in the design system
4. Output findings with specific line references and suggestions

## Design System Principles

### Core Philosophy

The Macro Tracker uses a **Hybrid Approach** that combines:

- **Memoria-inspired patterns**: Blur-to-clear animations, spring-based modals, ProgressiveBlur, minimal shadows
- **Brand identity preservation**: Green primary (#22c55e), macro color coding, semantic colors

### Key Rules

#### Colors

| Rule            | Description                                     |
| --------------- | ----------------------------------------------- |
| Brand Colors    | Green (#22c55e) for primary CTAs and protein    |
| Macro Colors    | Protein=green, Carbs=blue, Fats=red - ESSENTIAL |
| Semantic Colors | Success=green, Warning=amber, Error=red         |
| Surfaces        | Use surface-1 through surface-4 progression     |
| Text            | foreground for primary, muted for secondary     |

#### Typography

| Rule           | Description                                  |
| -------------- | -------------------------------------------- |
| Hero Numbers   | Use `font-light`, not `font-bold`            |
| Labels         | Use `uppercase tracking-wider`               |
| Size Hierarchy | Use size for emphasis, not weight            |
| Avoid          | `font-bold` or `font-extrabold` for emphasis |

#### Animation

| Rule             | Description                           |
| ---------------- | ------------------------------------- |
| Page Transitions | Blur-to-clear effect                  |
| Modals           | 3D spring-based animation             |
| Lists            | Staggered entry animations            |
| Accessibility    | MUST respect `prefers-reduced-motion` |

#### Components

| Rule              | Description                         |
| ----------------- | ----------------------------------- |
| Scroll Containers | MUST have ProgressiveBlur           |
| Cards             | SHOULD have hover state transitions |
| MetricCards       | CAN have 3D glare effect            |
| StatusBadges      | Use uppercase + tracking-wider      |

#### Layout

| Rule          | Description                                  |
| ------------- | -------------------------------------------- |
| Spacing       | Use consistent gap-2/3/4/6 scale             |
| Padding       | p-4 for cards, p-6 for pages                 |
| Border Radius | rounded-lg for buttons, rounded-xl for cards |

## Review Checklist

When reviewing code, check for:

### Colors

- [ ] Primary green used for main CTAs
- [ ] Macro colors consistent (protein=green, carbs=blue, fats=red)
- [ ] Surface colors follow progression
- [ ] No decorative gradients

### Typography

- [ ] Hero numbers use `font-light`
- [ ] Labels use `uppercase tracking-wider`
- [ ] No `font-bold` for emphasis

### Animation

- [ ] `prefers-reduced-motion` is respected
- [ ] Page transitions use blur-to-clear
- [ ] Modals use spring-based animation
- [ ] List items have staggered delays

### Components

- [ ] Scroll containers have ProgressiveBlur
- [ ] Cards have hover states
- [ ] Buttons follow variant patterns

### Accessibility

- [ ] Focus states are visible
- [ ] ARIA labels on interactive elements
- [ ] Reduced motion fallbacks

## Output Format

```
## Design System Review: [filename]

### Issues Found

| Severity | Line | Rule | Issue | Suggestion |
|----------|------|------|-------|------------|
| ERROR | 42 | typography | font-bold used for hero | Use font-light with larger size |
| WARNING | 87 | animation | Missing reduced-motion | Add prefersReducedMotion check |

### Positive Observations

- ✓ ProgressiveBlur correctly applied to scroll container
- ✓ Macro colors follow convention
- ✓ Animation respects reduced motion

### Summary

[Overall assessment and recommendations]
```

## Usage

When a user provides a file or pattern argument:

1. Read `.github/design-system.md` for full context
2. Read the specified files
3. Apply all rules from this skill and the design system
4. Output findings using the format above

If no files specified, ask the user which files to review.

## Quick Reference

### Color Tokens

```css
--color-primary: #22c55e; /* Green - CTAs, protein */
--color-vibrant-accent: #f59e0b; /* Amber - Pro features */
--color-protein: #22c55e; /* Green */
--color-carbs: #3b82f6; /* Blue */
--color-fats: #ef4444; /* Red */
--color-success: #22c55e;
--color-warning: #f59e0b;
--color-error: #ef4444;
```

### Animation Patterns

```tsx
// Page transition
initial={{ opacity: 0, filter: 'blur(8px)' }}
animate={{ opacity: 1, filter: 'blur(0px)' }}

// Modal 3D spring
initial={{ opacity: 0, scale: 0.95, rotateX: -10 }}
transition={{ type: "spring", stiffness: 300, damping: 30 }}

// Reduced motion fallback
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
```

### Required Components

```tsx
// ProgressiveBlur on scroll containers
<ProgressiveBlur direction="up" height="60px" />;

// StatusBadge styling
("uppercase tracking-wider text-[10px] font-semibold");

// MetricCard hero numbers
("font-light text-3xl");
```
