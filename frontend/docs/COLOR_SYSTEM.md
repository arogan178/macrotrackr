# UI/UX Revitalization Plan: A Material 3 Expressive Color System

## 1. Vision & Philosophy

### Objective

Our goal is to transform the application's user interface from its current state—a bland, monochromatic, and utilitarian tool—into a **vibrant, motivating, and personalized experience**. We are moving beyond a purely functional design to one that inspires engagement, celebrates progress, and makes the daily process of tracking nutrition and fitness genuinely enjoyable.

### Core Principles

Our new design system is guided by four core principles inspired by Material 3's "Expressive" style:

- **Expressive:** The UI will have a distinct personality. Through dynamic color, playful shapes, and engaging typography, the application will feel less like a sterile utility and more like a supportive partner in the user's health journey.
- **Reactive:** The interface will provide immediate, intuitive feedback. Components will respond to user interactions with subtle but clear animations and state changes, making the application feel alive, responsive, and satisfying to use.
- **Polished:** Every element will be crafted with a high degree of quality and attention to detail. A consistent and well-defined system for color, spacing, and typography will ensure a clean, professional, and trustworthy appearance.
- **Fun:** We will inject moments of delight and encouragement throughout the experience. This will be achieved through positive reinforcement, celebratory animations, and a more playful visual language, turning mundane tasks into rewarding interactions.

### User Experience Goal

The new design should make users feel **empowered, motivated, and positive** about their health journey. The application should be a space they _want_ to return to daily, not one they feel obligated to use. It will be a visually rewarding experience that mirrors the positive changes they are making in their lives.

### Best Practices

- **Accessibility First:** All color combinations and typography choices must meet WCAG 2.1 AA standards for contrast and readability. Our tonal palette system is designed to make this achievable.
- **Consistency is Key:** The defined tokens and styles must be applied consistently across the entire application to create a cohesive and predictable user experience.
- **Purposeful Animation:** Motion should be used to provide feedback, guide focus, and add character without being distracting or hindering usability.

---

## 2. Core Color Palette Strategy (Material 3 Inspired)

### Seed Color Selection

Our primary seed color is **Vibrant Green (`#386A20`)**.

**Justification:** Green is universally associated with health, nature, growth, and positivity. This specific vibrant shade is energetic and fresh, perfectly aligning with our goal to create a motivating and revitalizing user experience. It provides a strong foundation for generating a versatile and expressive color palette.

### Dynamic Tonal Palettes

Based on the seed color, we generate the following tonal palettes. These palettes provide the full spectrum of tones needed for both light and dark themes, ensuring accessibility and visual harmony.

**Best Practice:** The Material 3 tonal system is designed to simplify accessibility. When pairing a main color token (e.g., `primary` which is `primary40`) with its corresponding "on" color (e.g., `on-primary` which is `primary100`), the contrast is mathematically guaranteed to meet or exceed accessibility standards.

| Tone    | Primary (Green) | Secondary (Sage) | Tertiary (Teal) | Neutral (Gray) | Neutral Variant (Cool Gray) | Error (Red) |
| :------ | :-------------- | :--------------- | :-------------- | :------------- | :-------------------------- | :---------- |
| **0**   | `#000000`       | `#000000`        | `#000000`       | `#000000`      | `#000000`                   | `#000000`   |
| **10**  | `#002205`       | `#0F1F12`        | `#002019`       | `#191C18`      | `#171D1B`                   | `#410002`   |
| **20**  | `#00390C`       | `#243426`        | `#00372D`       | `#2E312D`      | `#2C3230`                   | `#690005`   |
| **30**  | `#005316`       | `#3A4B3C`        | `#004F42`       | `#444843`      | `#424946`                   | `#93000A`   |
| **40**  | `#386A20`       | `#516352`        | `#006A59`       | `#5C605A`      | `#5A615E`                   | `#B3261E`   |
| **50**  | `#508433`       | `#697B69`        | `#218572`       | `#757973`      | `#727976`                   | `#DC362E`   |
| **60**  | `#699F48`       | `#829582`        | `#3E9F8B`       | `#8F928C`      | `#8B9390`                   | `#FF5449`   |
| **70**  | `#82BA5F`       | `#9DAFA0`        | `#58BAA5`       | `#AAAEAA`      | `#A6ADAA`                   | `#FF897D`   |
| **80**  | `#9DD678`       | `#B9CABE`        | `#73D6BF`       | `#C6C8C5`      | `#C2C9C6`                   | `#FFB4AB`   |
| **90**  | `#B8F391`       | `#D5E6DA`        | `#8FF2DA`       | `#E2E4E0`      | `#DEE5E2`                   | `#FFDAD6`   |
| **95**  | `#D7FFAD`       | `#F3FFF3`        | `#AEFFEE`       | `#F0F3ED`      | `#ECF3F0`                   | `#FFEDEA`   |
| **99**  | `#F6FFE8`       | `#F8FFFA`        | `#F7FFFA`       | `#FDFDF9`      | `#F9FCFA`                   | `#FFFBF9`   |
| **100** | `#FFFFFF`       | `#FFFFFF`        | `#FFFFFF`       | `#FFFFFF`      | `#FFFFFF`                   | `#FFFFFF`   |

### Light & Dark Mode Theme Mapping

#### Light Theme

| Semantic Role             | Token               |
| :------------------------ | :------------------ |
| Primary                   | `primary40`         |
| On Primary                | `primary100`        |
| Primary Container         | `primary90`         |
| On Primary Container      | `primary10`         |
| Secondary                 | `secondary40`       |
| On Secondary              | `secondary100`      |
| Secondary Container       | `secondary90`       |
| On Secondary Container    | `secondary10`       |
| Tertiary                  | `tertiary40`        |
| On Tertiary               | `tertiary100`       |
| Tertiary Container        | `tertiary90`        |
| On Tertiary Container     | `tertiary10`        |
| Error                     | `error40`           |
| On Error                  | `error100`          |
| Error Container           | `error90`           |
| On Error Container        | `error10`           |
| Surface                   | `neutral99`         |
| On Surface                | `neutral10`         |
| Surface Variant           | `neutral-variant90` |
| On Surface Variant        | `neutral-variant30` |
| Outline                   | `neutral-variant50` |
| Outline Variant           | `neutral-variant80` |
| Background                | `neutral99`         |
| On Background             | `neutral10`         |
| Surface Container Lowest  | `neutral100`        |
| Surface Container Low     | `neutral95`         |
| Surface Container         | `neutral90`         |
| Surface Container High    | `neutral80`         |
| Surface Container Highest | `neutral-variant90` |

#### Dark Theme

| Semantic Role             | Token               |
| :------------------------ | :------------------ |
| Primary                   | `primary80`         |
| On Primary                | `primary20`         |
| Primary Container         | `primary30`         |
| On Primary Container      | `primary90`         |
| Secondary                 | `secondary80`       |
| On Secondary              | `secondary20`       |
| Secondary Container       | `secondary30`       |
| On Secondary Container    | `secondary90`       |
| Tertiary                  | `tertiary80`        |
| On Tertiary               | `tertiary20`        |
| Tertiary Container        | `tertiary30`        |
| On Tertiary Container     | `tertiary90`        |
| Error                     | `error80`           |
| On Error                  | `error20`           |
| Error Container           | `error30`           |
| On Error Container        | `error90`           |
| Surface                   | `neutral10`         |
| On Surface                | `neutral90`         |
| Surface Variant           | `neutral-variant30` |
| On Surface Variant        | `neutral-variant80` |
| Outline                   | `neutral-variant60` |
| Outline Variant           | `neutral-variant30` |
| Background                | `neutral10`         |
| On Background             | `neutral90`         |
| Surface Container Lowest  | `neutral-variant30` |
| Surface Container Low     | `neutral-variant10` |
| Surface Container         | `neutral20`         |
| Surface Container High    | `neutral30`         |
| Surface Container Highest | `neutral40`         |

---

## 3. Component-Level Implementation Guide

This section details how the new color tokens will be applied to our core UI components. For each component, we specify the color tokens for different visual parts and interaction states.

**Best Practice:** Always use semantic color tokens (`primary`, `surface`, `outline`) rather than hardcoding HEX values. This ensures that components will adapt correctly to both light and dark themes and any future theme adjustments.

- **Buttons:**
  - **Filled:**
    - **Default:** `primary` background, `on-primary` text.
    - **Hover:** `primary` background with a `surface-container-high` overlay.
    - **Pressed:** `primary` background with a `surface-container-highest` overlay.
    - **Disabled:** `on-surface` (at 38% opacity) background, `on-surface` (at 38% opacity) text.
  - **Outlined:**
    - **Default:** `outline` border, `primary` text.
    - **Hover:** `primary-container` background.
    - **Pressed:** `primary-container` background with a `surface-container-high` overlay.
    - **Disabled:** `on-surface` (at 12% opacity) border, `on-surface` (at 38% opacity) text.
  - **Text:**
    - **Default:** `primary` text.
    - **Hover:** `primary-container` background.
    - **Pressed:** `primary-container` background with a `surface-container-high` overlay.
  - **FAB (Floating Action Button):**
    - **Default:** `primary-container` background, `on-primary-container` icon.
    - **Hover:** `primary-container` with a `surface-container-high` overlay.
- **Cards:**
  - **Elevated:** `surface-container-low` background with a subtle shadow. `on-surface` text.
  - **Filled:** `surface-container-highest` background. `on-surface` text.
  - **Outlined:** `surface` background with an `outline` border. `on-surface` text.
  - **Best Practice:** Use `surface-container` variations to create visual hierarchy. For example, a primary card could be `surface-container-low` while a less important one is `surface-container-lowest`.
- **Inputs & Forms:**
  - **Text Fields:**
    - **Default:** `surface-variant` container, `on-surface-variant` text/label, `outline` border.
    - **Focused:** `primary` border and label color.
    - **Error:** `error` border and label color, `on-error-container` for helper text.
  - **Checkboxes/Sliders:**
    - **Selected:** `primary` for the control, `on-primary` for the icon/thumb.
    - **Unselected:** `on-surface-variant` for the track, `outline` for the border.
- **Navigation:**
  - **Top App Bar:** `surface` background, `on-surface` title. Use `surface-container-high` when scrolled to indicate elevation.
  - **Navigation Bar/Rail:** `surface-container` background. Active item uses `secondary` for the indicator and `on-secondary-container` for the icon/label. Inactive items use `on-surface-variant`.
- **Dialogs & Modals:** `surface-container-high` background, `on-surface` for title and body text. Action buttons follow the Button component styles.
- **Data Visualization & Charts:**
  - **Primary Series:** `primary`
  - **Secondary Series:** `secondary`
  - **Tertiary Series:** `tertiary`
  - Use lighter/darker tones from each palette for variations (e.g., stacked bars).
- **Lists & Table Items:** `surface` background, `on-surface` text. Use `secondary-container` for hover/selected state.
- **Progress Indicators:** `primary` for the indicator, `surface-variant` for the track.
- **Chips & Badges:** `secondary-container` background, `on-secondary-container` text.

---

## 4. Beyond Color: The "Expressive" Style

### Typography

- **Font Pairing:** We will adopt the **"Roboto Flex"** and **"Montserrat"** font families from Google Fonts.
  - **Display/Headline:** Montserrat (Bold, ExtraBold) - For impactful titles and key metrics.
  - **Title/Body:** Roboto Flex - For its versatility, readability, and variable font axes, allowing for fine-tuned weight and style adjustments.
    - **Best Practice:** Use a clear typographic scale. Example: Display (57px), Headline (45px), Title (22px), Body (16px), Label (12px).

### Shape & Corner Radius

- **System:** We will implement a tiered corner radius system to create a softer, more organic feel.
  - **Small (4px):** Chips, small UI elements.
  - **Medium (8px):** Buttons, Inputs.
  - **Large (16px):** Cards, Modals.
  - **Full (Pill Shape):** Specific buttons or active state indicators.
    - **Best Practice:** Use shape to convey meaning. More rounded shapes can feel more friendly and casual, while sharper corners can feel more formal and precise.

### Motion & Reactivity

- **Key Areas for Animation:**
  - **Button Presses:** A subtle "lift" and ripple effect.
  - **Screen Transitions:** Gentle fade and slide transitions.
  - **State Changes:** Smooth color fades and size transformations (e.g., an icon changing state).
  - **Chart Animations:** Animate data points into view on load to draw the user's attention.
    - **Best Practice:** Follow Material Design's motion principles: animations should be **informative, focused, and expressive**. Durations should be kept short (typically 150-300ms) to avoid user frustration.

### Iconography

- **Library:** We will continue to use the existing **Lucide** icon library (via `lucide-react`). Its clean, consistent, and lightweight nature aligns perfectly with our new design principles.
- **Sizing:**
  - **Default:** 24px (stroke-width: 2)
  - **Small:** 20px (stroke-width: 2)
  - **Large:** 40px (stroke-width: 1.5)
- **Color:** Icons should inherit their color via the `currentColor` property, allowing them to easily adopt the color of their parent element (e.g., a button's text color). For standalone icons, apply color tokens directly:
  - **Default State:** `on-surface-variant`
  - **Interactive/Active State:** `primary` or `secondary`
- **Best Practices:**
  - **Accessibility:** As `lucide-react` icons are decorative by default, ensure any icon that conveys meaning or is interactive is accompanied by a text label or an appropriate `aria-label`.
  - **Consistency:** The strength of Lucide is its consistency. Avoid creating custom icons unless absolutely necessary.
  - **Performance:** `lucide-react` is tree-shakable, which is excellent for performance. Continue to import icons individually.

---

## 5. Action Plan: File Implementation

This checklist outlines the files that will need to be created or modified to implement the new design system.

**Best Practice:** The implementation should be staged. Start with the foundational elements (CSS variables, global styles), then update components one by one to ensure a smooth transition.

- **[ ] Theme Definition:**
  - `frontend/src/theme/theme.ts` (or similar): Create or modify to define the light and dark mode color mappings using the semantic roles defined above.
- **[ ] CSS Variables:**
  - `frontend/src/styles/variables.css` (or similar): Create a root CSS file to declare all 13 tones for each color role as CSS custom properties (e.g., `--primary-0`, `--primary-10`, etc.).
- **[ ] Base Component Styles (Examples):**
  - `frontend/src/components/ui/Button.tsx`
  - `frontend/src/components/ui/Card.tsx`
  - `frontend/src/components/ui/Input.tsx`
  - `frontend/src/components/layout/TopAppBar.tsx`
  - `frontend/src/features/dashboard/components/UserMetricsPanel.tsx`
  - `frontend/src/components/chart/LineChart.tsx`
- **[ ] Global Stylesheet:**
  - `frontend/src/styles/global.css`: Update `body` background, default text color, and set the new `font-family`.

---

## 6. Design System Governance

### Proposing Changes

- Any team member can propose a change to the design system by opening an issue in the repository.
- The proposal should include a clear rationale, visual mockups, and an analysis of the impact on existing components.

### Review Process

- Proposals will be reviewed by the lead designer and a senior front-end developer.
- The review will focus on consistency, accessibility, and technical feasibility.

### Versioning

- The design system will follow semantic versioning (MAJOR.MINOR.PATCH).
- **PATCH:** Bug fixes or minor tweaks.
- **MINOR:** Backward-compatible additions or enhancements.
- **MAJOR:** Breaking changes to tokens, components, or guidelines.

### Documentation

- All changes must be documented in this `COLOR_SYSTEM.md` file and in the component library (e.g., Storybook).
- The documentation should be clear, concise, and provide practical examples.
