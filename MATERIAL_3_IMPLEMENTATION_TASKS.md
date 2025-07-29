# Material 3 Design System Implementation Task Document

This document provides a comprehensive task breakdown for implementing the Material 3 Expressive Color System across the macro tracker application codebase.

## 🎯 Overview & Goals

**Objective:** Transform the application from a bland, monochromatic interface into a vibrant, motivating, and personalized experience using Material 3's Expressive design principles with green-based health-focused theming.

**Design Foundation:** Following the comprehensive `COLOR_SYSTEM.md` specification which defines:

- **Seed Color**: Vibrant Green (`#386A20`) representing health, nature, growth, and positivity
- **Complete Material 3 Palette**: Primary (Green), Secondary (Sage), Tertiary (Teal), Neutral (Gray), Neutral Variant (Cool Gray), Error (Red)
- **13-Tone System**: Full tonal range from 0-100 for each color family
- **Semantic Token Mapping**: Light/dark theme assignments following Material 3 specifications

**Key Outcomes:**

- ✨ Vibrant, health-focused UI that motivates daily nutrition tracking
- 🎨 Complete Material 3 color system with green seed color and proper accessibility
- � Psychology-driven design using nature-inspired colors for habit building
- �🌙 Seamless light/dark theme support with intelligent switching
- 📱 Enhanced user experience across all macro tracking components
- ♿ WCAG 2.1 AA accessibility compliance with Material 3 contrast guarantees
- ⚡ Performance-optimized interactions with smooth theme transitions
- 🎮 Celebratory animations for nutrition goals and progress milestones
- 🤖 Intelligent, adaptive UI behaviors based on user progress
- 📊 Advanced data visualization using the green-based color palette

## 📈 Success Metrics

- **User Engagement**: 40% increase in daily active users
- **Retention**: 60% increase in 30-day retention
- **Task Completion**: 50% reduction in time-to-log-meal
- **User Satisfaction**: 4.8+ star rating in app stores
- **Accessibility**: 100% WCAG 2.1 AA compliance
- **Performance**: <100ms theme switching, <2s initial load

## 📁 CSS Architecture Overview

The Material 3 implementation uses a **modular CSS architecture** for maintainability and performance:

### **File Structure & Responsibilities:**

```
frontend/src/
├── style.css                          # 🎯 Main application stylesheet
│   ├── Font imports (Roboto Flex)
│   ├── Global HTML/body styles
│   ├── Application-wide utilities
│   ├── Keyframe animations
│   └── Imports material3-variables.css
│
├── styles/
│   ├── material3-variables.css        # 🎨 Pure Material 3 color system
│   │   ├── @theme inline definitions
│   │   ├── Green-based semantic tokens
│   │   ├── Light/dark theme mappings
│   │   └── Tailwind v4 integration
│   │
│   └── typography.css (planned)        # ✏️ Typography scale & font utilities
```

### **Why This Architecture?**

- ✅ **Separation of Concerns**: Color system isolated from application styles
- ✅ **Reusability**: `material3-variables.css` can be imported by any stylesheet
- ✅ **Maintainability**: Easy to update design tokens without touching app logic
- ✅ **Performance**: Tailwind v4 can optimize theme variables separately
- ✅ **Modularity**: Each CSS file has a single, clear responsibility

### **Import Order (Critical for Tailwind v4):**

```css
/* style.css - CORRECT ORDER */
@import url("...fonts..."); /* 1. External fonts first */
@import "./styles/material3-variables.css"; /* 2. Design system tokens */
@import "tailwindcss"; /* 3. Tailwind processes tokens */
/* Global styles using semantic tokens */ /* 4. Application styles */
```

---

## 📋 Phase 1: Foundation Setup

### 🎯 Phase 1 Goals

- ✅ **Material 3 Foundation**: Complete green-based color system implemented with Tailwind v4
- ✅ **Health-Focused Design**: Vibrant Green (`#386A20`) seed color promoting growth and positivity
- ✅ **Architecture Established**: Modular CSS structure with `material3-variables.css` + `style.css`
- ✅ **Typography System**: Roboto Flex + Montserrat implementation per COLOR_SYSTEM.md
- ✅ **Animation Framework**: Celebration and feedback animations for macro tracking (foundation in place, advanced in Phase 2+)
- ✅ **Theme Management**: Intelligent light/dark mode switching with user preferences

### 📊 Components Status (Phase 1)

**Foundation Files: 7 total**

| Component                 | Status  | Priority | Effort    | Notes                                     |
| ------------------------- | ------- | -------- | --------- | ----------------------------------------- |
| Material 3 Color System   | ✅ DONE | Critical | Completed | Green-based system with Tailwind v4       |
| Global Styles Integration | ✅ DONE | Critical | Completed | Font loading and semantic token usage     |
| Tailwind Configuration    | ✅ DONE | Critical | Completed | All tokens/utilities available            |
| Typography System         | ✅ DONE | High     | Completed | Roboto Flex + Montserrat per COLOR_SYSTEM |
| Animation Framework       | ✅ DONE | High     | Completed | Foundation in place, advanced in Phase 2+ |
| Theme Management Hook     | ✅ DONE | Medium   | Completed | Intelligent light/dark switching          |
| Shape & Motion Tokens     | ✅ DONE | Medium   | Completed | Material 3 corner radius and durations    |

### 1.1 Advanced Color System Implementation

#### Task 1.1.1: ✅ Complete Material 3 Green-Based Color System

- ✅ **File:** `frontend/src/styles/material3-variables.css`
- ✅ **Refactoring Type:** Complete rewrite with Material 3 + Tailwind v4 integration
- ✅ **Complexity:** High (✅ COMPLETED)
- ✅ **Description:** Implemented comprehensive green-based Material 3 color system using Tailwind v4 `@theme inline` syntax
- ✅ **Successfully Resolved:**
  - ✅ **Green Seed Color**: Implemented Vibrant Green (`#386A20`) as primary seed color
  - ✅ **Complete 6-Color Palette**: Primary (Green), Secondary (Sage), Tertiary (Teal), plus Error (Red), and Neutral variants
  - ✅ **Semantic Token System**: All Material 3 semantic tokens (primary, on-primary, primary-container, etc.)
  - ✅ **Light/Dark Theme Support**: Proper contrast ratios following Material 3 specifications
  - ✅ **Tailwind v4 Integration**: Using `@theme inline` for direct color value inlining
  - ✅ **Performance Optimization**: Direct color values instead of CSS variable chains
- ✅ **Implementation Details:**
  - ✅ **Light Theme**: Uses tone 40 for primary colors, tone 90 for containers, tone 99 for surfaces
  - ✅ **Dark Theme**: Uses tone 80 for primary colors, tone 30 for containers, tone 10 for surfaces
  - ✅ **Health-Focused Semantics**: Green represents growth/success, Sage for supporting elements, Teal for accents
  - ✅ **Accessibility Guaranteed**: Material 3 tone pairing ensures WCAG 2.1 AA compliance
- ✅ **File Structure**:
  - ✅ `material3-variables.css` - Pure color system definition with `@theme inline`
  - ✅ `style.css` - Imports Material 3 variables and defines global application styles
  - ✅ This separation enables maintainable design system architecture

#### Task 1.1.2: Update Tailwind Configuration for Green-Based Design System

- ✅ **File:** `frontend/tailwind.config.js`
- ✅ **Refactoring Type:** Configuration alignment with completed Material 3 system
- ✅ **Complexity:** Medium (1 day)
- ✅ **Description:** Ensure Tailwind configuration properly recognizes the new green-based Material 3 color system
- ✅ **Current Status:**
  - ✅ **Tailwind v4**: Already using `@tailwindcss/vite": "^4.1.11"`
  - ✅ **Dark Mode**: `darkMode: "class"` configured for `.dark` selector
  - ✅ **Basic Config**: Typography and animation tokens partially configured
- ✅ **Key Updates Needed:**
  - **Color System Verification**: Ensure all Material 3 semantic tokens are available as utilities
  - **Component Utilities**: Add macro-tracking specific utility classes
  - **Performance Optimization**: Verify tree-shaking works with new `@theme inline` approach
- ✅ **Specific Steps:**
  1. **Verify color token availability** - Test that `bg-primary`, `text-on-primary-container`, etc. work
  2. **Add nutrition-specific utilities** for calorie/macro display styling
  3. **Enhance animation tokens** for celebration and progress feedback
  4. **Add shape tokens** following Material 3 specifications (4px, 8px, 16px, full)
  5. **Test performance** of new Tailwind v4 + Material 3 integration

#### Task 1.1.3: Enhance Global Styles with Green Theme Integration

- ✅ **File:** `frontend/src/style.css`
- ✅ **Refactoring Type:** Enhancement to work optimally with new Material 3 system
- ✅ **Complexity:** Low (0.5 days)
- ✅ **Description:** Update global styles to fully leverage the new green-based Material 3 color system
- ✅ **Current Status:**
  - ✅ **Font Loading**: Roboto Flex imported and configured
  - ✅ **Material 3 Import**: `@import "./styles/material3-variables.css";` correctly positioned
  - ✅ **CSS Variable Usage**: Global styles use semantic tokens (`var(--color-background)`)
  - ✅ **Performance**: Smooth transitions configured for theme switching
- ✅ **Key Updates Needed:**
  - **Typography Enhancement**: Add Montserrat for display/headline typography per COLOR_SYSTEM.md
  - **Color Psychology**: Update selection, scrollbar, and link colors to use green semantic tokens
  - **Accessibility**: Enhance reduced motion and high contrast support
- ✅ **Specific Steps:**

  1. **Add Montserrat font** for display and headline typography
  2. **Update link hover states** to use green-based primary-container colors
  3. **Enhance selection colors** for better contrast with green theme
  4. **Verify scrollbar styling** works across light/dark themes
  5. **Test reduced motion** and ensure accessibility compliance

  ```

  ```

### 1.2 Typography System Alignment with COLOR_SYSTEM.md

#### Task 1.2.1: Create Material 3 Typography Scale with Roboto Flex & Montserrat

- ✅ **File:** `frontend/src/styles/typography.css` (new file)
- ✅ **Refactoring Type:** New typography system following COLOR_SYSTEM.md specifications
- ✅ **Complexity:** Medium (1 day)
- ✅ **Description:** Implement the typography system defined in COLOR_SYSTEM.md using Roboto Flex and Montserrat
- ✅ **Typography Specifications from COLOR_SYSTEM.md:**
  - **Display/Headline**: Montserrat (Bold, ExtraBold) for impactful titles and key metrics
  - **Title/Body**: Roboto Flex for versatility, readability, and variable font axes
  - **Responsive Scale**: Display (57px), Headline (45px), Title (22px), Body (16px), Label (12px)
- ✅ **Specific Steps:**
  1. **Create typography utility classes** for Material 3 scale
  2. **Configure Montserrat import** for display typography
  3. **Set up Roboto Flex variable** font axes optimization
  4. **Add responsive typography scaling** for different devices
  5. **Test typography hierarchy** with green-based color tokens

#### Task 1.2.2: Update Tailwind Typography Configuration

- ✅ **File:** `frontend/tailwind.config.js`
- ✅ **Description:** Add Material 3 typography scale to Tailwind configuration
- ✅ **Details:**

  - Extend fontSize with Material 3 scale following COLOR_SYSTEM.md
  - Configure proper line heights and letter spacing for health/fitness context
  - Ensure typography works optimally with green-based semantic tokens
    font-weight: 800;
    line-height: 1.1;
    }

  .text-headline-large {
  font-family: "Montserrat", sans-serif;
  font-size: 2.8125rem; /_ 45px _/
  font-weight: 700;
  line-height: 1.2;
  }

  .text-title-large {
  font-family: "Roboto Flex", sans-serif;
  font-size: 1.375rem; /_ 22px _/
  font-weight: 500;
  line-height: 1.3;
  }

  .text-body-large {
  font-family: "Roboto Flex", sans-serif;
  font-size: 1rem; /_ 16px _/
  font-weight: 400;
  line-height: 1.5;
  }

  .text-label-medium {
  font-family: "Roboto Flex", sans-serif;
  font-size: 0.75rem; /_ 12px _/
  font-weight: 500;
  line-height: 1.4;
  letter-spacing: 0.5px;
  }

  ```

  ```

#### Task 1.2.2: Update Tailwind 4 Typography Extension

- ✅ **File:** `frontend/tailwind.config.js`
- ✅ **Description:** Add typography scale to Tailwind 4 configuration
- ✅ **Details:**
  - Extend fontSize with Material 3 scale
  - Add font families for Montserrat and Roboto Flex
  - Configure proper line heights and letter spacing

### 1.3 Shape & Motion System

#### Task 1.3.1: Create Shape System Configuration

- ✅ **File:** `frontend/tailwind.config.js`
- ✅ **Description:** Define Material 3 shape tokens
- ✅ **Details:**
  - Add corner radius system (4px, 8px, 16px, full)
  - Create shape utility classes
- ✅ **Shape Extension:**
  ```javascript
  borderRadius: {
    'shape-corner-small': '4px',
    'shape-corner-medium': '8px',
    'shape-corner-large': '16px',
    'shape-corner-full': '9999px',
  }
  ```

#### Task 1.3.2: Enhance Animation System

- ✅ **File:** `frontend/tailwind.config.js`
- ✅ **Description:** Add Material 3 motion tokens
- ✅ **Details:**
  - Define duration tokens (150ms, 300ms, 500ms)
  - Add easing curves for Material Design
  - Create component-specific animations

### 1.4 Theme Management Setup

#### Task 1.4.1: Create Theme Context/Hook

- ✅ **File:** `frontend/src/hooks/useTheme.ts`
- ✅ **Description:** Create theme management system
- ✅ **Details:**
  - Implement dark/light mode toggle
  - Handle system preference detection
  - Persist theme preference in localStorage
  - Apply theme class to document root

#### Task 1.4.2: Update Theme Toggle Implementation

- ✅ **File:** `frontend/src/components/ui/ThemeToggle.tsx`
- ✅ **Description:** Create Material 3 styled theme toggle
- ✅ **Details:**
  - Use Material 3 color tokens
  - Implement smooth transition animations
  - Include accessibility features

---

## 📋 Phase 2: Core UI Components

### 🎯 Phase 2 Goals

- Transform all core UI components with Material 3 specifications
- Implement intelligent interaction states and micro-animations
- Create consistent component library with advanced accessibility
- Build reusable component patterns for macro tracking

### 📊 Components Requiring Refactoring (Phase 2)

**Total Components: 28 core UI components**

| Component Category    | Count | Priority | Avg Complexity | Total Effort |
| --------------------- | ----- | -------- | -------------- | ------------ |
| **Button System**     | 5     | Critical | High           | 6 days       |
| **Form Components**   | 8     | Critical | Medium         | 8 days       |
| **Card & Container**  | 4     | High     | Medium         | 4 days       |
| **Navigation**        | 3     | Critical | High           | 5 days       |
| **Layout Components** | 5     | High     | Medium         | 4 days       |
| **UI Utilities**      | 3     | Medium   | Low            | 2 days       |

#### ✅ Button System: All core button components refactored and validated (Button, ActionButton, ActionButtonGroup)

#### ✅ TextField: Refactored, layout and icon issues resolved, validated in all forms

### **Detailed Component Breakdown:**

#### **Button System (5 components)**

- `Button.tsx` - Primary component with variants
- `ActionButton.tsx` - Form-specific actions
- `ActionButtonGroup.tsx` - Button groupings
- `FormButton.tsx` - Form submissions
- `TabButton.tsx` - Navigation tabs

#### **Form Components (8 components)**

- `TextField.tsx` - Text inputs with floating labels
- `NumberField.tsx` - Numeric inputs with steppers
- `DateField.tsx` - Date selection with calendar
- `TimeField.tsx` - Time selection
- `Dropdown.tsx` - Select menus with search
- `CardContainer.tsx` - Form card wrapper
- `InfoCard.tsx` - Information display
- Custom form utilities

#### **Navigation (3 components)**

- `Navbar.tsx` - Main navigation bar
- `MainLayout.tsx` - App layout wrapper
- `PageHeader.tsx` - Page-level headers

### 2.1 Button System Overhaul

#### Task 2.1.1: Transform Button Component into Intelligent System

- ✅ **File:** `frontend/src/components/ui/Button.tsx`
- ✅ **Refactoring Type:** Complete architectural redesign
- ✅ **Complexity:** High (3 days)
- ✅ **Description:** Create intelligent button system with advanced interactions
- ✅ **Current Issues:**
  - Basic styling without personality
  - No celebration or feedback animations
  - Missing contextual adaptations
  - Poor accessibility in complex states
  - No performance optimizations
- ✅ **Key Improvements:**
  - **Intelligent Variants**: Context-aware button types (celebration, encouragement, warning)
  - **Micro-Animations**: Ripple effects, bounce feedback, success celebrations
  - **Accessibility Excellence**: Proper ARIA states, keyboard navigation, screen reader support
  - **Performance Optimization**: Virtualized rendering for button groups, optimized animations
  - **Contextual Adaptation**: Buttons adapt to user progress and app state
- ✅ **Specific Refactoring Steps:**
  1. **Create variant system** with filled, outlined, text, and floating action buttons
  2. **Implement ripple animation system** with proper touch feedback
  3. **Add celebration micro-interactions** for achievement buttons
  4. **Build intelligent loading states** with progress indicators
  5. **Create contextual color adaptation** based on user progress
  6. **Implement advanced accessibility** with proper ARIA support
  7. **Add performance optimizations** for smooth animations
- ✅ **Implementation Pattern:**
  ```typescript
  interface ButtonProps {
    variant:
      | "filled"
      | "outlined"
      | "text"
      | "fab"
      | "celebration"
      | "encouragement";
    size: "small" | "medium" | "large";
    context?: "achievement" | "goal-setting" | "data-entry" | "destructive";
    celebrationLevel?: "subtle" | "moderate" | "enthusiastic";
    progressState?: "struggling" | "improving" | "excelling";
    adaptiveColor?: boolean;
    rippleEffect?: boolean;
    hapticFeedback?: boolean;
    loadingState?: {
      isLoading: boolean;
      progress?: number;
      successAnimation?: boolean;
    };
  }
  ```

#### Task 2.1.2: Enhance ActionButton with Intelligence

- ✅ **File:** `frontend/src/components/form/ActionButton.tsx`
- ✅ **Refactoring Type:** Major enhancement with contextual intelligence
- ✅ **Complexity:** Medium (2 days)
- ✅ **Current Issues:**
  - Generic action handling without context awareness
  - No visual feedback for different action types
  - Missing celebration animations for positive actions
- ✅ **Key Improvements:**
  - **Context-Aware Actions**: Different styles for add/edit/delete/achieve actions
  - **Intelligent Feedback**: Success celebrations, gentle error handling
  - **Predictive States**: Pre-loading likely next actions
- ✅ **Specific Refactoring Steps:**
  1. **Add action-type classification** (create, update, delete, achieve)
  2. **Implement contextual color schemes** for each action type
  3. **Create celebration animations** for positive actions
  4. **Add gentle error handling** with recovery suggestions
  5. **Implement predictive loading** for likely actions

#### Task 2.1.3: Create Advanced ActionButtonGroup

- ✅ **File:** `frontend/src/components/form/ActionButtonGroup.tsx`
- ✅ **Refactoring Type:** New intelligent grouping system
- ✅ **Complexity:** Medium (1 day)
- ✅ **Key Improvements:**
  - **Smart Grouping**: Automatically arrange buttons by priority and context
  - **Responsive Adaptation**: Collapse to menu on smaller screens
  - **Contextual Shortcuts**: Keyboard shortcuts for power users

### 2.2 Intelligent Form Components

#### Task 2.2.1: Transform TextField into Smart Input System

✅ **File:** `frontend/src/components/form/TextField.tsx`
✅ **Refactoring Type:** Complete redesign with intelligence
✅ **Complexity:** High (2 days)
✅ **Current Issues:**

- Basic text input without smart features
- No contextual suggestions or validation
- Missing accessibility enhancements
- Poor performance with large datasets
  ✅ **Key Improvements:**
- **Smart Autocomplete**: Context-aware suggestions (food names, common entries)
- **Intelligent Validation**: Real-time feedback with helpful suggestions
- **Accessibility Excellence**: Screen reader optimization, keyboard navigation
- **Performance Optimization**: Debounced validation, virtualized suggestions
  ✅ **Specific Refactoring Steps:**

1. **Implement floating label system** with smooth animations
2. **Add intelligent autocomplete** with food database integration
3. **Create contextual validation** with helpful error messages
4. **Build accessibility features** beyond WCAG requirements
5. **Add performance optimizations** for smooth typing experience
6. **Implement smart formatting** for nutrition values

#### Task 2.2.2: Enhance NumberField with Smart Features

- ✅ **File:** `frontend/src/components/form/NumberField.tsx`
- ✅ **Refactoring Type:** Major enhancement with intelligent features
- ✅ **Complexity:** Medium (1.5 days)
- ✅ **Key Improvements:**
  - **Smart Increment/Decrement**: Context-aware step sizes
  - **Visual Progress**: Show progress toward goals
  - **Unit Intelligence**: Automatic unit conversion and validation
- ✅ **Specific Refactoring Steps:**
  1. **Add smart stepper controls** with variable increments
  2. **Implement visual progress indicators** for goal tracking
  3. **Create unit conversion system** with user preferences
  4. **Add contextual validation** for nutrition ranges

#### Task 2.2.3: ✅ Transform Dropdown into Intelligent Selection

- ✅ **File:** `frontend/src/components/form/Dropdown.tsx`
- ✅ **Refactoring Type:** Material 3 design system integration with consistent formStyles
- ✅ **Complexity:** Medium (1 day)
- ✅ **Description:** Updated Dropdown component to use Material 3 design tokens while maintaining existing functionality
- ✅ **Key Improvements:**
  - **Material 3 Integration**: Updated to use semantic color tokens (surface-container, outline, primary, error)
  - **Consistent Styling**: Now uses shared formStyles like TextField and NumberField components
  - **Enhanced Accessibility**: Added proper ARIA attributes and focus management
  - **Placeholder Functionality**: Maintained existing placeholder pattern (empty value options are hidden/disabled)
- ✅ **Updated formStyles.ts**: Migrated all form styling from hardcoded gray colors to Material 3 semantic tokens for consistency across all form components

### 2.3 Advanced Card & Container System

#### Task 2.3.1: ✅ Create Intelligent Card System

- ✅ **Files:**
  - `frontend/src/components/form/CardContainer.tsx`
  - `frontend/src/components/form/InfoCard.tsx`
- ✅ **Refactoring Type:** Material 3 design system integration
- ✅ **Complexity:** Medium (2 days)
- ✅ **Key Improvements:**
  - **Material 3 Styling**: Uses semantic tokens for background (`surface-container-high`), border (`outline-variant`), and text (`on-surface`)
  - **Consistent Elevation**: Cards visually adapt to theme and context
  - **Color Dot Mapping**: InfoCard color dots mapped to Material 3 tokens
  - **Accessibility**: Improved contrast and ARIA support
  - **Theme Adaptation**: Fully responsive to light/dark mode
- ✅ **Validation:**
  - All card components tested for theme switching and accessibility
  - No hardcoded Tailwind colors remain; all use semantic tokens

### 2.4 Advanced Navigation System

#### Task 2.4.1: Transform Navbar into Intelligent Navigation

- [ ] **File:** `frontend/src/components/layout/Navbar.tsx`
- [ ] **Refactoring Type:** Complete redesign with adaptive intelligence
- [ ] **Complexity:** High (3 days)
- [ ] **Current Issues:**
  - Static navigation without user context
  - No adaptive behavior based on user patterns
  - Missing advanced accessibility features
  - Poor performance on mobile devices
- [ ] **Key Improvements:**
  - **Contextual Navigation**: Adapt navigation based on user's current goals and patterns
  - **Progressive Enhancement**: Show advanced features as users become more experienced
  - **Accessibility Excellence**: Keyboard navigation, screen reader optimization
  - **Performance Optimization**: Lazy loading, smooth transitions
- [ ] **Specific Refactoring Steps:**
  1. **Implement adaptive menu structure** based on user expertise level
  2. **Add contextual quick actions** for current user goals
  3. **Create smooth transition animations** between navigation states
  4. **Build accessibility enhancements** with keyboard navigation
  5. **Add performance optimizations** for mobile devices
  6. **Implement smart notifications** for progress and achievements

#### Task 2.4.2: Enhance MainLayout with Intelligence

- [ ] **File:** `frontend/src/components/layout/MainLayout.tsx`
- [ ] **Refactoring Type:** Major enhancement with adaptive features
- [ ] **Complexity:** Medium (2 days)
- [ ] **Key Improvements:**

  - **Adaptive Layout**: Layout adjusts based on content and user preferences
  - **Smart Sidebar**: Contextual sidebar content based on current page
  - **Performance Optimization**: Optimized re-rendering and layout shifts

- [ ] **File:** `frontend/src/components/ui/Button.tsx`
- [ ] **Description:** Implement Material 3 button specifications
- [ ] **Details:**
  - Filled button: `primary` background, `on-primary` text
  - Outlined button: `outline` border, `primary` text
  - Text button: `primary` text, transparent background
  - FAB: `primary-container` background, `on-primary-container` icon
  - Implement proper hover, pressed, and disabled states
  - Add ripple effect animation
- [ ] **State Implementations:**
  ```typescript
  const buttonVariants = {
    filled: {
      default: "bg-primary text-on-primary",
      hover: "bg-primary/90",
      pressed: "bg-primary/80",
      disabled: "bg-on-surface/12 text-on-surface/38",
    },
    outlined: {
      default: "border border-outline text-primary bg-transparent",
      hover: "bg-primary-container/50",
      pressed: "bg-primary-container/80",
      disabled: "border-on-surface/12 text-on-surface/38",
    },
  };
  ```

#### Task 2.1.2: Update ActionButton Components

- [ ] **File:** `frontend/src/components/form/ActionButton.tsx`
- [ ] **Description:** Apply Material 3 styling to action buttons
- [ ] **Details:**
  - Update color schemes to use semantic tokens
  - Implement proper state transitions
  - Add loading state with Material 3 spinner

#### Task 2.1.3: Update Form Button Components

- [ ] **File:** `frontend/src/components/form/FormButton.tsx`
- [ ] **Description:** Modernize form-specific buttons
- [ ] **Details:**
  - Apply Material 3 container colors
  - Update focus states for accessibility
  - Implement proper disabled styling

### 2.2 Input & Form Components

#### Task 2.2.1: Update TextField Component

- [ ] **File:** `frontend/src/components/form/TextField.tsx`
- [ ] **Description:** Implement Material 3 text field design
- [ ] **Details:**
  - Default: `surface-variant` container, `outline` border
  - Focused: `primary` border and label
  - Error: `error` border and helper text
  - Implement floating label animation
  - Add proper state transitions

#### Task 2.2.2: Update NumberField Component

- [ ] **File:** `frontend/src/components/form/NumberField.tsx`
- [ ] **Description:** Apply Material 3 styling to number inputs
- [ ] **Details:**
  - Use consistent field styling with TextField
  - Implement proper increment/decrement button styling
  - Add focus ring and error states

#### Task 2.2.3: Update Dropdown Component

- [ ] **File:** `frontend/src/components/form/Dropdown.tsx`
- [ ] **Description:** Modernize dropdown with Material 3 design
- [ ] **Details:**
  - Use `surface-container-high` for dropdown menu
  - Implement proper item hover states with `secondary-container`
  - Add smooth open/close animations

#### Task 2.2.4: Update DateField and TimeField Components

- [ ] **Files:**
  - `frontend/src/components/form/DateField.tsx`
  - `frontend/src/components/form/TimeField.tsx`
- [ ] **Description:** Apply consistent Material 3 styling
- [ ] **Details:**
  - Use same container and border styling as TextField
  - Implement calendar/time picker with Material 3 colors
  - Add proper focus and error states

### 2.3 Card & Container Components

#### Task 2.3.1: Update Card Components

- [ ] **Files:**
  - `frontend/src/components/form/CardContainer.tsx`
  - `frontend/src/components/form/InfoCard.tsx`
- [ ] **Description:** Implement Material 3 card specifications
- [ ] **Details:**
  - Elevated cards: `surface-container-low` with subtle shadow
  - Filled cards: `surface-container-highest` background
  - Outlined cards: `surface` with `outline` border
  - Use `on-surface` for text content
  - Implement proper elevation system

#### Task 2.3.2: Update MetricCard Component

- [ ] **File:** `frontend/src/features/reporting/components/MetricCard.tsx`
- [ ] **Description:** Apply Material 3 styling to metrics display
- [ ] **Details:**
  - Use `surface-container` variations for hierarchy
  - Apply proper typography scale for metrics
  - Implement subtle hover animations

### 2.4 Navigation Components

#### Task 2.4.1: Update Navbar Component

- [ ] **File:** `frontend/src/components/layout/Navbar.tsx`
- [ ] **Description:** Implement Material 3 navigation design
- [ ] **Details:**
  - Use `surface` background with elevation
  - Active items: `secondary` indicator, `on-secondary-container` labels
  - Inactive items: `on-surface-variant` color
  - Implement smooth selection animations
  - Add proper focus states for accessibility

#### Task 2.4.2: Update MainLayout Component

- [ ] **File:** `frontend/src/components/layout/MainLayout.tsx`
- [ ] **Description:** Apply Material 3 layout principles
- [ ] **Details:**
  - Use appropriate surface container colors
  - Implement proper spacing using Material 3 grid
  - Add smooth page transition animations

---

## 📋 Phase 3: Feature-Specific Components

### 🎯 Phase 3 Goals

- Transform domain-specific components with intelligent behaviors
- Implement psychology-driven design for health and fitness context
- Create advanced data visualization with meaningful insights
- Build habit-forming interaction patterns

### 📊 Components Requiring Refactoring (Phase 3)

**Total Components: 45 feature-specific components**

| Feature Category           | Count | Priority | Avg Complexity | Total Effort | Key Focus                    |
| -------------------------- | ----- | -------- | -------------- | ------------ | ---------------------------- |
| **Authentication**         | 8     | High     | Medium         | 6 days       | User onboarding & confidence |
| **Macro Tracking**         | 12    | Critical | High           | 12 days      | Core app functionality       |
| **Goals & Progress**       | 15    | Critical | High           | 15 days      | Motivation & achievement     |
| **Dashboard**              | 5     | High     | Medium         | 5 days       | Data overview & insights     |
| **Charts & Visualization** | 8     | High     | High           | 8 days       | Data storytelling            |
| **Reporting**              | 7     | Medium   | Medium         | 6 days       | Advanced analytics           |

### **Psychology-Driven Design Principles for Phase 3:**

- **Achievement Psychology**: Celebrate small wins, build momentum
- **Habit Formation**: Make logging effortless and rewarding
- **Progress Visualization**: Show improvement clearly and motivationally
- **Gentle Guidance**: Support struggling users without judgment
- **Expertise Progression**: Gradually reveal advanced features

### 3.1 Authentication Experience Enhancement

#### Task 3.1.1: Transform Auth Forms into Confidence-Building Journey

- [ ] **Files:**
  - `frontend/src/features/auth/components/AuthForm.tsx`
  - `frontend/src/features/auth/components/LoginForm.tsx`
  - `frontend/src/features/auth/components/RegisterForm.tsx`
  - `frontend/src/features/auth/components/ForgotPasswordForm.tsx`
  - `frontend/src/features/auth/components/ResetPasswordForm.tsx`
- [ ] **Refactoring Type:** Psychology-driven redesign
- [ ] **Complexity:** Medium (4 days)
- [ ] **Description:** Create authentication experience that builds user confidence
- [ ] **Current Issues:**
  - Generic form design without personality
  - No progressive disclosure of features
  - Missing motivational elements
  - Poor error handling experience
- [ ] **Key Improvements:**
  - **Confidence Building**: Progressive form completion with encouraging feedback
  - **Gentle Error Handling**: Helpful suggestions instead of harsh error messages
  - **Feature Preview**: Show app benefits during registration process
  - **Accessibility Excellence**: Screen reader optimization, keyboard navigation
- [ ] **Specific Refactoring Steps:**
  1. **Create progressive form system** with encouraging micro-animations
  2. **Implement intelligent validation** with helpful suggestions
  3. **Add feature preview animations** during registration
  4. **Build gentle error handling** with recovery guidance
  5. **Create accessibility enhancements** for diverse users
  6. **Add success celebrations** for completed registration

#### Task 3.1.2: Enhance Step Indicator with Progress Psychology

- [ ] **File:** `frontend/src/features/auth/components/StepIndicator.tsx`
- [ ] **Refactoring Type:** Psychology-driven enhancement
- [ ] **Complexity:** Low (1 day)
- [ ] **Key Improvements:**
  - **Progress Momentum**: Visual design that builds excitement for completion
  - **Achievement Celebration**: Micro-celebrations for each completed step
  - **Clear Navigation**: Easy to understand where user is in the process

### 3.2 Macro Tracking Intelligence System

#### Task 3.2.1: Transform Macro Entry into Effortless Experience

- [ ] **Files:**
  - `frontend/src/features/macroTracking/components/AddEntryForm.tsx`
  - `frontend/src/features/macroTracking/components/CalorieSearchForm.tsx`
- [ ] **Refactoring Type:** Complete AI-driven redesign
- [ ] **Complexity:** High (4 days)
- [ ] **Description:** Create intelligent food logging that learns from user behavior
- [ ] **Current Issues:**
  - Manual food search without intelligence
  - No contextual suggestions based on time/habits
  - Missing quick-add shortcuts for frequent foods
  - Poor mobile experience for on-the-go logging
- [ ] **Key Improvements:**
  - **AI-Powered Suggestions**: Learn user patterns and suggest likely foods
  - **Contextual Intelligence**: Different suggestions for breakfast vs dinner
  - **Quick-Add Shortcuts**: One-tap logging for frequent items
  - **Camera Integration**: Food recognition with nutrition estimation
  - **Voice Input**: Hands-free logging capability
- [ ] **Specific Refactoring Steps:**
  1. **Implement intelligent food suggestions** based on time and history
  2. **Add quick-action shortcuts** for frequent foods
  3. **Create contextual search filters** (meal type, cuisine, etc.)
  4. **Build camera integration** for food recognition
  5. **Add voice input capability** for accessibility
  6. **Implement smart portion estimation** with visual guides

#### Task 3.2.2: Enhance Macro Visualization with Achievement Psychology

- [ ] **Files:**
  - `frontend/src/features/macroTracking/components/MacroBadgeGroup.tsx`
  - `frontend/src/features/macroTracking/components/MacroSliderGroup.tsx`
  - `frontend/src/features/macroTracking/components/MacroTargetBar.tsx`
  - `frontend/src/components/macros/MacroSlider.tsx`
  - `frontend/src/components/macros/MacroTarget.tsx`
- [ ] **Refactoring Type:** Achievement-focused redesign
- [ ] **Complexity:** High (4 days)
- [ ] **Description:** Transform macro display into motivational progress visualization
- [ ] **Current Issues:**
  - Static progress bars without personality
  - No celebration of achievements
  - Missing contextual feedback for different progress states
  - Poor visual hierarchy for macro importance
- [ ] **Key Improvements:**
  - **Achievement Celebrations**: Animations when goals are met
  - **Progressive Visual Feedback**: Colors and animations that adapt to progress
  - **Contextual Encouragement**: Different messaging for different progress states
  - **Smart Visual Hierarchy**: Emphasize most important macros for user's goals
- [ ] **Specific Refactoring Steps:**
  1. **Create celebration animations** for goal achievements
  2. **Implement progressive color schemes** that adapt to progress
  3. **Add contextual messaging** for different progress states
  4. **Build smart visual hierarchy** based on user goals
  5. **Create micro-interactions** for engaging progress tracking
  6. **Add achievement badges** for consistency milestones

#### Task 3.2.3: Transform Entry Management into Intelligent History

- [ ] **Files:**
  - `frontend/src/features/macroTracking/components/DesktopEntryTable.tsx`
  - `frontend/src/features/macroTracking/components/MobileEntryCards.tsx`
  - `frontend/src/features/macroTracking/components/EditModal.tsx`
- [ ] **Refactoring Type:** Intelligence-driven redesign
- [ ] **Complexity:** High (4 days)
- [ ] **Key Improvements:**
  - **Smart Grouping**: Automatically group entries by meal, time, or similarity
  - **Quick Actions**: Swipe gestures and context menus for fast editing
  - **Pattern Recognition**: Highlight unusual entries or suggest corrections
  - **Bulk Operations**: Smart selection and batch editing capabilities

### 3.3 Goals & Progress Psychology System

#### Task 3.3.1: Transform Weight Goal Tracking into Motivational Journey

- [ ] **Files:**
  - `frontend/src/features/goals/components/WeightGoalDashboard.tsx`
  - `frontend/src/features/goals/components/WeightGoalForm.tsx`
  - `frontend/src/features/goals/components/WeightGoalProgressChart.tsx`
  - `frontend/src/features/goals/components/LogWeightModal.tsx`
- [ ] **Refactoring Type:** Psychology-driven complete redesign
- [ ] **Complexity:** High (6 days)
- [ ] **Description:** Create goal tracking that motivates and supports users psychologically
- [ ] **Current Issues:**
  - Focus only on weight loss without body-positive approach
  - No support for users struggling with progress
  - Missing celebration of non-scale victories
  - Poor visualization of long-term trends
- [ ] **Key Improvements:**
  - **Body-Positive Approach**: Focus on health metrics beyond just weight
  - **Struggle Support**: Gentle encouragement for difficult periods
  - **Non-Scale Victories**: Track and celebrate energy, strength, habits
  - **Trend Intelligence**: Smart analysis of patterns and plateaus
  - **Personalized Insights**: Custom messages based on progress patterns
- [ ] **Specific Refactoring Steps:**
  1. **Redesign goal setting** with body-positive language and options
  2. **Create struggle support system** with encouraging messages
  3. **Add non-scale victory tracking** (energy, mood, strength)
  4. **Build intelligent trend analysis** with pattern recognition
  5. **Implement personalized coaching** messages
  6. **Add celebration system** for various types of progress

#### Task 3.3.2: Enhance Progress Cards with Insight Intelligence

- [ ] **Files:**
  - `frontend/src/features/goals/components/MonthlyTrendCard.tsx`
  - `frontend/src/features/goals/components/WeeklyAverageCard.tsx`
  - `frontend/src/features/goals/components/ProgressInsightsCard.tsx`
- [ ] **Refactoring Type:** Data intelligence enhancement
- [ ] **Complexity:** Medium (3 days)
- [ ] **Key Improvements:**
  - **Actionable Insights**: Transform data into specific, actionable recommendations
  - **Pattern Recognition**: Identify and highlight meaningful patterns
  - **Contextual Analysis**: Consider external factors (stress, sleep, events)
  - **Predictive Elements**: Show likely outcomes based on current trends

### 3.4 Dashboard Intelligence Hub

#### Task 3.4.1: Transform UserMetricsPanel into Intelligent Overview

- [ ] **File:** `frontend/src/features/dashboard/components/UserMetricsPanel.tsx`
- [ ] **Refactoring Type:** Intelligence-driven complete redesign
- [ ] **Complexity:** High (3 days)
- [ ] **Description:** Create dashboard that adapts to user needs and provides actionable insights
- [ ] **Current Issues:**
  - Static data display without context
  - No prioritization of important information
  - Missing actionable insights
  - Poor personalization for different user types
- [ ] **Key Improvements:**
  - **Adaptive Information Architecture**: Show most relevant data first
  - **Intelligent Prioritization**: Highlight metrics that need attention
  - **Actionable Insights**: Convert data into specific next steps
  - **Contextual Adaptation**: Different layouts for different user goals
- [ ] **Specific Refactoring Steps:**
  1. **Implement adaptive layout** based on user goals and patterns
  2. **Create intelligent data prioritization** system
  3. **Add actionable insight generation** from user data
  4. **Build contextual quick actions** for next steps
  5. **Implement celebration elements** for achievements
  6. **Add personalized coaching** suggestions

### 3.5 Advanced Chart & Visualization Intelligence

#### Task 3.5.1: Transform Charts into Story-Telling Visualizations

- [ ] **Files:**
  - `frontend/src/components/chart/LineChartComponent.tsx`
  - `frontend/src/components/chart/ChartCard.tsx`
  - `frontend/src/components/chart/ChartTooltip.tsx`
- [ ] **Refactoring Type:** Narrative-driven redesign
- [ ] **Complexity:** High (4 days)
- [ ] **Description:** Create charts that tell meaningful stories about user progress
- [ ] **Key Improvements:**
  - **Narrative Elements**: Charts that explain what the data means
  - **Interactive Exploration**: Deep-dive capabilities for curious users
  - **Contextual Annotations**: Highlight important events and milestones
  - **Predictive Visualization**: Show potential future trends
- [ ] **Specific Refactoring Steps:**
  1. **Add narrative elements** that explain data patterns
  2. **Implement interactive exploration** with drill-down capabilities
  3. **Create contextual annotations** for important events
  4. **Build predictive visualization** elements
  5. **Add celebration markers** for achievements
  6. **Implement accessibility** for screen readers

### 3.6 Reporting Intelligence System

#### Task 3.6.1: Transform Reporting into Personal Coaching

- [ ] **Files:**
  - `frontend/src/features/reporting/components/AtAGlanceSection.tsx`
  - `frontend/src/features/reporting/components/NutritionInsights.tsx`
  - `frontend/src/features/reporting/components/UnifiedInsights.tsx`
- [ ] **Refactoring Type:** AI-coaching redesign
- [ ] **Complexity:** High (4 days)
- [ ] **Description:** Create reporting that acts like a personal nutrition coach
- [ ] **Key Improvements:**
  - **Personal Coaching Tone**: Supportive, encouraging, knowledgeable voice
  - **Actionable Recommendations**: Specific steps user can take
  - **Pattern Recognition**: Identify and explain meaningful patterns
  - **Goal-Oriented Insights**: Focus on helping user achieve their specific goals

### 3.2 Dashboard Components

#### Task 3.2.1: Update UserMetricsPanel Component

- [ ] **File:** `frontend/src/features/dashboard/components/UserMetricsPanel.tsx`
- [ ] **Description:** Apply Material 3 styling to metrics dashboard
- [ ] **Details:**
  - Use `surface-container` variations for card hierarchy
  - Apply proper typography scale for metrics display
  - Implement data visualization colors using `primary`, `secondary`, `tertiary`
  - Add micro-interactions for engagement

### 3.3 Macro Tracking Components

#### Task 3.3.1: Update Macro Tracking Forms

- [ ] **Files:**
  - `frontend/src/features/macroTracking/components/AddEntryForm.tsx`
  - `frontend/src/features/macroTracking/components/CalorieSearchForm.tsx`
- [ ] **Description:** Modernize macro entry interface
- [ ] **Details:**
  - Apply consistent form field styling
  - Use `primary` for add/save actions
  - Implement smooth form submission animations
  - Add proper loading states

#### Task 3.3.2: Update Macro Display Components

- [ ] **Files:**
  - `frontend/src/features/macroTracking/components/MacroBadgeGroup.tsx`
  - `frontend/src/features/macroTracking/components/MacroSliderGroup.tsx`
  - `frontend/src/features/macroTracking/components/MacroTargetBar.tsx`
  - `frontend/src/components/macros/MacroSlider.tsx`
  - `frontend/src/components/macros/MacroTarget.tsx`
- [ ] **Description:** Enhance macro visualization components
- [ ] **Details:**
  - Use `primary` for protein, `secondary` for carbs, `tertiary` for fats
  - Implement smooth progress animations
  - Apply proper contrast for accessibility
  - Add celebratory micro-animations for goal achievement

#### Task 3.3.3: Update Entry Management Components

- [ ] **Files:**
  - `frontend/src/features/macroTracking/components/DesktopEntryTable.tsx`
  - `frontend/src/features/macroTracking/components/MobileEntryCards.tsx`
  - `frontend/src/features/macroTracking/components/EditModal.tsx`
- [ ] **Description:** Modernize entry management interface
- [ ] **Details:**
  - Apply Material 3 table/list styling
  - Use `secondary-container` for selection states
  - Implement smooth edit transitions
  - Add proper delete confirmation with `error` styling

### 3.4 Goals & Progress Components

#### Task 3.4.1: Update Weight Goal Components

- [ ] **Files:**
  - `frontend/src/features/goals/components/WeightGoalDashboard.tsx`
  - `frontend/src/features/goals/components/WeightGoalForm.tsx`
  - `frontend/src/features/goals/components/WeightGoalProgressChart.tsx`
  - `frontend/src/features/goals/components/LogWeightModal.tsx`
- [ ] **Description:** Enhance goal tracking interface
- [ ] **Details:**
  - Use `primary` for progress indicators
  - Apply Material 3 chart color scheme
  - Implement smooth progress animations
  - Add achievement celebration animations

#### Task 3.4.2: Update Progress Cards

- [ ] **Files:**
  - `frontend/src/features/goals/components/MonthlyTrendCard.tsx`
  - `frontend/src/features/goals/components/WeeklyAverageCard.tsx`
  - `frontend/src/features/goals/components/ProgressInsightsCard.tsx`
- [ ] **Description:** Modernize progress visualization
- [ ] **Details:**
  - Use `surface-container` variations for card hierarchy
  - Apply proper typography scale for metrics
  - Implement data-driven color coding
  - Add smooth hover animations

### 3.5 Chart & Visualization Components

#### Task 3.5.1: Update Chart Components

- [ ] **Files:**
  - `frontend/src/components/chart/LineChartComponent.tsx`
  - `frontend/src/components/chart/ChartCard.tsx`
  - `frontend/src/components/chart/ChartTooltip.tsx`
- [ ] **Description:** Apply Material 3 data visualization principles
- [ ] **Details:**
  - Primary series: `primary` color
  - Secondary series: `secondary` color
  - Tertiary series: `tertiary` color
  - Use tonal variations for multi-series charts
  - Implement smooth chart animations
  - Apply `surface-container-low` for chart backgrounds

#### Task 3.5.2: Update Chart Controls

- [ ] **Files:**
  - `frontend/src/components/chart/DateRangeSelector.tsx`
  - `frontend/src/components/chart/StatSelector.tsx`
- [ ] **Description:** Modernize chart interaction controls
- [ ] **Details:**
  - Apply consistent button styling
  - Use `outline-variant` for inactive states
  - Implement smooth selection animations
  - Add proper accessibility features

### 3.6 Reporting Components

#### Task 3.6.1: Update Reporting Dashboard

- [ ] **Files:**
  - `frontend/src/features/reporting/components/AtAGlanceSection.tsx`
  - `frontend/src/features/reporting/components/NutritionInsights.tsx`
  - `frontend/src/features/reporting/components/UnifiedInsights.tsx`
- [ ] **Description:** Enhance reporting interface
- [ ] **Details:**
  - Use card hierarchy with `surface-container` variations
  - Apply proper typography scale for insights
  - Implement data-driven color coding
  - Add smooth loading animations

#### Task 3.6.2: Update Reporting Components

- [ ] **Files:**
  - `frontend/src/features/reporting/components/MacroDensityBreakdown.tsx`
  - `frontend/src/features/reporting/components/MealTimeBreakdown.tsx`
  - `frontend/src/features/reporting/components/TrendDisplay.tsx`
- [ ] **Description:** Modernize reporting visualizations
- [ ] **Details:**
  - Apply Material 3 chart color scheme
  - Use proper contrast for accessibility
  - Implement smooth data transitions
  - Add interactive hover states

---

## 📋 Phase 4: Specialized Components

### 4.1 Modal & Dialog Components

#### Task 4.1.1: Update Modal Component

- [ ] **File:** `frontend/src/components/ui/Modal.tsx`
- [ ] **Description:** Implement Material 3 modal design
- [ ] **Details:**
  - Use `surface-container-high` background
  - Apply proper elevation and shadows
  - Implement smooth open/close animations
  - Add backdrop blur effect
  - Ensure proper focus management

#### Task 4.1.2: Update Specialized Modals

- [ ] **Files:**
  - `frontend/src/features/goals/components/WeightGoalModal.tsx`
  - `frontend/src/components/billing/UpgradeModal.tsx`
- [ ] **Description:** Apply consistent modal styling
- [ ] **Details:**
  - Use Material 3 action button styling
  - Implement proper content hierarchy
  - Add smooth content transitions

### 4.2 Status & Feedback Components

#### Task 4.2.1: Update Status Components

- [ ] **Files:**
  - `frontend/src/components/ui/StatusBadge.tsx`
  - `frontend/src/components/ui/StatusIndicator.tsx`
  - `frontend/src/components/billing/ProBadge.tsx`
- [ ] **Description:** Modernize status display components
- [ ] **Details:**
  - Success states: `primary` or `secondary` background
  - Warning states: `tertiary` background
  - Error states: `error` background
  - Use proper contrast ratios
  - Add subtle pulse animations for active states

#### Task 4.2.2: Update Progress Components

- [ ] **Files:**
  - `frontend/src/components/ui/ProgressBar.tsx`
  - `frontend/src/components/ui/LoadingSpinner.tsx`
  - `frontend/src/components/ui/LoadingStates.tsx`
- [ ] **Description:** Enhance progress feedback
- [ ] **Details:**
  - Use `primary` for progress indicators
  - Apply `surface-variant` for track background
  - Implement smooth progress animations
  - Add accessibility labels

### 4.3 Notification Components

#### Task 4.3.1: Update Notification System

- [ ] **Files:**
  - `frontend/src/features/notifications/components/FloatingNotification.tsx`
  - `frontend/src/features/notifications/components/NotificationManager.tsx`
- [ ] **Description:** Modernize notification interface
- [ ] **Details:**
  - Success: `primary-container` background
  - Warning: `tertiary-container` background
  - Error: `error-container` background
  - Implement smooth slide-in animations
  - Add proper dismiss functionality

### 4.4 Settings Components

#### Task 4.4.1: Update Settings Forms

- [ ] **Files:**
  - `frontend/src/features/settings/components/ProfileForm.tsx`
  - `frontend/src/features/settings/components/ChangePasswordForm.tsx`
- [ ] **Description:** Modernize settings interface
- [ ] **Details:**
  - Apply consistent form field styling
  - Use proper validation error display
  - Implement smooth save confirmation
  - Add proper loading states

#### Task 4.4.2: Update Billing Components

- [ ] **Files:**
  - `frontend/src/features/settings/components/BillingForm.tsx`
  - `frontend/src/features/settings/components/FreeBillingView.tsx`
  - `frontend/src/features/settings/components/ProBillingView.tsx`
  - `frontend/src/components/billing/PricingTable.tsx`
- [ ] **Description:** Enhance billing interface
- [ ] **Details:**
  - Use Material 3 card styling for pricing tiers
  - Apply proper CTA button hierarchy
  - Implement feature comparison styling
  - Add upgrade success animations

---

## 📋 Phase 5: Pages & Layout

### 5.1 Main Application Pages

#### Task 5.1.1: Update Core Pages

- [ ] **Files:**
  - `frontend/src/pages/HomePage.tsx`
  - `frontend/src/pages/GoalsPage.tsx`
  - `frontend/src/pages/ReportingPage.tsx`
  - `frontend/src/pages/SettingsPage.tsx`
- [ ] **Description:** Apply Material 3 page layout principles
- [ ] **Details:**
  - Use proper page containers with `surface` background
  - Apply consistent spacing and typography
  - Implement smooth page transitions
  - Add proper loading states

#### Task 5.1.2: Update Authentication Pages

- [ ] **Files:**
  - `frontend/src/pages/AuthPage.tsx`
  - `frontend/src/pages/ResetPasswordPage.tsx`
- [ ] **Description:** Modernize authentication flow
- [ ] **Details:**
  - Use clean, centered layout design
  - Apply proper form hierarchy
  - Implement smooth step transitions
  - Add brand personality elements

### 5.2 Landing & Marketing Pages

#### Task 5.2.1: Update Landing Page Components

- [ ] **Files:**
  - `frontend/src/features/landing/components/HeroSection.tsx`
  - `frontend/src/features/landing/components/FeaturesSection.tsx`
  - `frontend/src/features/landing/components/PricingSection.tsx`
  - `frontend/src/features/landing/components/TestimonialsSection.tsx`
- [ ] **Description:** Create engaging landing experience
- [ ] **Details:**
  - Use vibrant Material 3 colors for CTAs
  - Apply proper typography hierarchy
  - Implement scroll-triggered animations
  - Add brand personality elements

#### Task 5.2.2: Update Landing Page Structure

- [ ] **Files:**
  - `frontend/src/pages/LandingPage.tsx`
  - `frontend/src/features/landing/components/Header.tsx`
  - `frontend/src/features/landing/components/Footer.tsx`
- [ ] **Description:** Enhance overall landing page experience
- [ ] **Details:**
  - Apply consistent Material 3 theming
  - Implement smooth section transitions
  - Add proper mobile responsiveness
  - Include accessibility improvements

### 5.3 Utility Pages

#### Task 5.3.1: Update Error & Info Pages

- [ ] **Files:**
  - `frontend/src/pages/NotFoundPage.tsx`
  - `frontend/src/pages/PrivacyPolicyPage.tsx`
  - `frontend/src/pages/TermsAndConditionsPage.tsx`
- [ ] **Description:** Create consistent utility page styling
- [ ] **Details:**
  - Use clean, readable typography
  - Apply proper spacing and layout
  - Include navigation elements
  - Add brand consistency

---

## 📋 Phase 6: Animation & Micro-interactions

### 6.1 Component Animations

#### Task 6.1.1: Update Animation Components

- [ ] **Files:**
  - `frontend/src/components/animation/AnimatedNumber.tsx`
  - `frontend/src/components/animation/BackgroundAnimation.tsx`
  - `frontend/src/components/animation/ScrollTriggeredDiv.tsx`
- [ ] **Description:** Enhance component animations with Material 3 principles
- [ ] **Details:**
  - Use proper Material Design motion curves
  - Implement informative, focused animations
  - Add accessibility considerations (reduced motion)
  - Keep durations between 150-300ms

#### Task 6.1.2: Add Button Ripple Effects

- [ ] **All Button Components**
- [ ] **Description:** Implement Material 3 ripple animations
- [ ] **Details:**
  - Add click ripple effect to all interactive elements
  - Use proper color contrast for ripples
  - Implement smooth expand/fade animations
  - Ensure accessibility compliance

### 6.2 Page Transitions

#### Task 6.2.1: Implement Route Transitions

- [ ] **File:** `frontend/src/app/appRouter.tsx`
- [ ] **Description:** Add smooth page transition animations
- [ ] **Details:**
  - Implement fade and slide transitions
  - Use consistent timing and easing
  - Add loading state transitions
  - Ensure smooth navigation experience

---

## 📋 Phase 7: Dark Mode & Accessibility

### 7.1 Dark Mode Implementation

#### Task 7.1.1: Test Dark Mode Across All Components

- [ ] **All Updated Components**
- [ ] **Description:** Ensure proper dark mode support
- [ ] **Details:**
  - Verify all components respond to theme changes
  - Test color contrast ratios in dark mode
  - Ensure proper semantic token usage
  - Fix any dark mode specific issues

#### Task 7.1.2: Add Dark Mode Specific Adjustments

- [ ] **Various Component Files**
- [ ] **Description:** Fine-tune dark mode appearance
- [ ] **Details:**
  - Adjust shadows and elevation for dark backgrounds
  - Ensure proper contrast for all text elements
  - Test chart and visualization readability
  - Optimize for OLED displays

### 7.2 Accessibility Enhancements

#### Task 7.2.1: Accessibility Audit

- [ ] **All Components**
- [ ] **Description:** Comprehensive accessibility review
- [ ] **Details:**
  - Test keyboard navigation across all components
  - Verify screen reader compatibility
  - Ensure proper focus management
  - Test color contrast ratios (WCAG 2.1 AA)
  - Add missing aria-labels and descriptions

#### Task 7.2.2: Motion Preferences

- [ ] **All Animated Components**
- [ ] **Description:** Respect user motion preferences
- [ ] **Details:**
  - Implement `prefers-reduced-motion` support
  - Provide alternative non-animated states
  - Ensure functionality without animations
  - Test with accessibility tools

---

## 📋 Phase 8: Testing & Quality Assurance

### 8.1 Visual Testing

#### Task 8.1.1: Component Visual Testing

- [ ] **Description:** Create visual regression tests
- [ ] **Details:**
  - Test all components in light and dark modes
  - Verify responsive design across breakpoints
  - Test interaction states (hover, focus, active)
  - Document visual specifications

#### Task 8.1.2: Cross-browser Testing

- [ ] **Description:** Ensure browser compatibility
- [ ] **Details:**
  - Test in Chrome, Firefox, Safari, Edge
  - Verify mobile browser compatibility
  - Test CSS variable support
  - Fix any browser-specific issues

### 8.2 Performance Testing

#### Task 8.2.1: Performance Optimization

- [ ] **Description:** Optimize theme switching performance
- [ ] **Details:**
  - Measure theme switching speed
  - Optimize CSS variable usage
  - Minimize layout shifts
  - Test with large datasets

#### Task 8.2.2: Bundle Size Analysis

- [ ] **Description:** Analyze impact on bundle size
- [ ] **Details:**
  - Measure CSS size increase
  - Optimize unused styles
  - Ensure tree-shaking effectiveness
  - Document performance metrics

---

## 📋 Phase 9: Documentation & Maintenance

### 9.1 Design System Documentation

#### Task 9.1.1: Update Style Guide

- [ ] **File:** `frontend/docs/STYLE_GUIDE.md`
- [ ] **Description:** Document Material 3 implementation
- [ ] **Details:**
  - Document color token usage
  - Provide component examples
  - Include accessibility guidelines
  - Add implementation best practices

#### Task 9.1.2: Component Documentation

- [ ] **File:** `frontend/docs/COMPONENT_LIBRARY.md`
- [ ] **Description:** Document all updated components
- [ ] **Details:**
  - Include usage examples
  - Document props and variants
  - Provide accessibility notes
  - Add implementation guidelines

### 9.2 Migration Guidelines

#### Task 9.2.1: Create Migration Guide

- [ ] **File:** `frontend/docs/MATERIAL_3_MIGRATION.md`
- [ ] **Description:** Guide for future component updates
- [ ] **Details:**
  - Document token migration patterns
  - Provide code examples
  - Include common pitfalls
  - Add troubleshooting guide

---

## 📋 Phase 10: Advanced UX Psychology & Gamification

### 🎯 Phase 10 Goals

- Implement advanced psychology-driven design patterns
- Create gamification elements that build healthy habits
- Add emotional intelligence to the user interface
- Build predictive and adaptive user experiences

### 📊 Advanced UX Components (New)

**Total New Features: 25 advanced UX enhancements**

| Enhancement Category          | Count | Complexity | Effort  | Impact                     |
| ----------------------------- | ----- | ---------- | ------- | -------------------------- |
| **Gamification System**       | 8     | High       | 8 days  | High motivation boost      |
| **Emotional Intelligence**    | 6     | High       | 6 days  | Improved user connection   |
| **Predictive UX**             | 5     | Very High  | 10 days | Effortless user experience |
| **Social Features**           | 4     | Medium     | 4 days  | Community engagement       |
| **Accessibility Beyond WCAG** | 2     | Medium     | 3 days  | Inclusive excellence       |

### 10.1 Gamification & Achievement System

#### Task 10.1.1: Create Advanced Achievement System

- [ ] **Files:**
  - `frontend/src/features/gamification/components/AchievementBadge.tsx`
  - `frontend/src/features/gamification/components/StreakCounter.tsx`
  - `frontend/src/features/gamification/components/LevelProgressBar.tsx`
  - `frontend/src/features/gamification/components/CelebrationModal.tsx`
- [ ] **Refactoring Type:** New gamification system
- [ ] **Complexity:** High (4 days)
- [ ] **Description:** Create engaging achievement system that builds healthy habits
- [ ] **Key Features:**
  - **Multi-Dimensional Achievements**: Streak days, consistency, goal hitting, exploration
  - **Adaptive Difficulty**: Achievements adapt to user's current ability level
  - **Celebration Orchestration**: Different celebration styles for different achievement types
  - **Progress Visualization**: Clear progress toward next achievements
- [ ] **Implementation Details:**
  ```typescript
  interface Achievement {
    id: string;
    title: string;
    description: string;
    category:
      | "consistency"
      | "accuracy"
      | "exploration"
      | "social"
      | "wellness";
    difficulty: "beginner" | "intermediate" | "advanced" | "expert";
    progress: {
      current: number;
      target: number;
      milestones: number[];
    };
    celebrationStyle: "subtle" | "moderate" | "enthusiastic" | "epic";
    personalizedMessage: string;
    nextSteps: string[];
  }
  ```

#### Task 10.1.2: Implement Habit Formation Psychology

- [ ] **Files:**
  - `frontend/src/features/habits/components/HabitFormationTracker.tsx`
  - `frontend/src/features/habits/components/CueReminder.tsx`
  - `frontend/src/features/habits/components/RewardSystem.tsx`
- [ ] **Refactoring Type:** New habit psychology system
- [ ] **Complexity:** High (3 days)
- [ ] **Key Features:**
  - **Cue-Routine-Reward Loop**: Built into the app experience
  - **Habit Stacking**: Connect new habits to existing ones
  - **Environmental Design**: UI cues that trigger desired behaviors
  - **Reward Timing**: Immediate, variable, and meaningful rewards

### 10.2 Emotional Intelligence & Empathy

#### Task 10.2.1: Create Emotional State Adaptation

- [ ] **Files:**
  - `frontend/src/features/emotional/components/MoodTracker.tsx`
  - `frontend/src/features/emotional/components/EmotionalSupport.tsx`
  - `frontend/src/features/emotional/components/AdaptiveMessaging.tsx`
- [ ] **Refactoring Type:** New emotional intelligence system
- [ ] **Complexity:** High (3 days)
- [ ] **Description:** Interface that adapts to user's emotional state and provides appropriate support
- [ ] **Key Features:**
  - **Mood Detection**: Infer mood from interaction patterns and explicit input
  - **Adaptive Messaging**: Change tone and approach based on emotional state
  - **Supportive Interventions**: Gentle guidance during difficult periods
  - **Celebration Amplification**: Enhanced celebrations during positive periods

#### Task 10.2.2: Implement Struggle Support System

- [ ] **Files:**
  - `frontend/src/features/support/components/StruggleDetection.tsx`
  - `frontend/src/features/support/components/GentleGuidance.tsx`
  - `frontend/src/features/support/components/MotivationalContent.tsx`
- [ ] **Refactoring Type:** New support system
- [ ] **Complexity:** Medium (2 days)
- [ ] **Key Features:**
  - **Pattern Recognition**: Detect when users are struggling with consistency
  - **Gentle Interventions**: Non-judgmental support and guidance
  - **Resource Connection**: Connect users with helpful resources and content
  - **Recovery Celebration**: Celebrate return to healthy patterns

### 10.3 Predictive & Adaptive UX

#### Task 10.3.1: Build Predictive Interface System

- [ ] **Files:**
  - `frontend/src/features/prediction/components/SmartSuggestions.tsx`
  - `frontend/src/features/prediction/components/ContextualShortcuts.tsx`
  - `frontend/src/features/prediction/components/AdaptiveLayout.tsx`
- [ ] **Refactoring Type:** New AI-driven UX system
- [ ] **Complexity:** Very High (6 days)
- [ ] **Description:** Interface that learns and adapts to user patterns
- [ ] **Key Features:**
  - **Behavioral Learning**: Learn user patterns and preferences over time
  - **Contextual Prediction**: Predict likely actions based on time, location, history
  - **Adaptive Interface**: Interface elements appear/disappear based on relevance
  - **Proactive Assistance**: Offer help before users realize they need it

#### Task 10.3.2: Create Contextual Awareness System

- [ ] **Files:**
  - `frontend/src/features/context/components/TimeContextProvider.tsx`
  - `frontend/src/features/context/components/ProgressContextProvider.tsx`
  - `frontend/src/features/context/components/ContextualUI.tsx`
- [ ] **Refactoring Type:** New context awareness system
- [ ] **Complexity:** High (4 days)
- [ ] **Key Features:**
  - **Temporal Context**: Different UI for morning vs evening, weekday vs weekend
  - **Progress Context**: Adapt UI based on how well user is doing toward goals
  - **Social Context**: Consider social aspects of eating and health
  - **Environmental Context**: Adapt to different usage environments

---

## 📋 Phase 11: Performance Excellence & Micro-Interactions

### 🎯 Phase 11 Goals

- Achieve exceptional performance across all interactions
- Implement sophisticated micro-interactions that delight users
- Create seamless animations that enhance rather than distract
- Build performance monitoring and optimization systems

### 📊 Performance Enhancement Components

**Total Optimizations: 20 performance enhancements**

| Optimization Category          | Count | Complexity | Effort | Performance Impact         |
| ------------------------------ | ----- | ---------- | ------ | -------------------------- |
| **Animation Excellence**       | 8     | High       | 6 days | Perceived performance +40% |
| **Loading Optimization**       | 5     | Medium     | 4 days | Load time -60%             |
| **Interaction Responsiveness** | 4     | Medium     | 3 days | Response time -50%         |
| **Memory Optimization**        | 3     | High       | 3 days | Memory usage -30%          |

### 11.1 Advanced Animation & Micro-Interactions

#### Task 11.1.1: Create Physics-Based Animation System

- [ ] **Files:**
  - `frontend/src/components/animation/PhysicsAnimations.tsx`
  - `frontend/src/components/animation/SpringSystem.tsx`
  - `frontend/src/components/animation/GestureAnimations.tsx`
- [ ] **Refactoring Type:** New physics-based animation framework
- [ ] **Complexity:** High (3 days)
- [ ] **Description:** Create animations that feel natural and responsive
- [ ] **Key Features:**
  - **Spring Physics**: Natural feeling animations with proper easing
  - **Gesture Response**: Animations that respond to user touch and interaction
  - **Interruption Handling**: Smooth transitions when animations are interrupted
  - **Performance Optimization**: 60fps animations with minimal CPU usage

#### Task 11.1.2: Implement Celebration Orchestration

- [ ] **Files:**
  - `frontend/src/components/animation/CelebrationOrchestrator.tsx`
  - `frontend/src/components/animation/ParticleEffects.tsx`
  - `frontend/src/components/animation/SoundEffects.tsx`
- [ ] **Refactoring Type:** New celebration system
- [ ] **Complexity:** High (3 days)
- [ ] **Key Features:**
  - **Multi-Sensory Celebrations**: Visual, haptic, and audio feedback
  - **Contextual Intensity**: Celebration intensity matches achievement importance
  - **Accessibility Options**: Customizable celebration preferences
  - **Performance Optimization**: Efficient particle systems and sound management

### 11.2 Performance Optimization Excellence

#### Task 11.2.1: Implement Advanced Loading Strategies

- [ ] **Files:**
  - `frontend/src/components/loading/IntelligentLoading.tsx`
  - `frontend/src/components/loading/SkeletonSystem.tsx`
  - `frontend/src/components/loading/PreloadingStrategy.tsx`
- [ ] **Refactoring Type:** Performance optimization system
- [ ] **Complexity:** Medium (2 days)
- [ ] **Key Features:**
  - **Intelligent Preloading**: Predict and preload likely next actions
  - **Skeleton Matching**: Skeleton screens that exactly match content structure
  - **Progressive Loading**: Load critical content first, enhance progressively
  - **Offline Capability**: Smooth experience even with poor connectivity

#### Task 11.2.2: Create Responsive Performance Monitoring

- [ ] **Files:**
  - `frontend/src/utils/PerformanceMonitor.tsx`
  - `frontend/src/utils/UserExperienceMetrics.tsx`
  - `frontend/src/utils/AdaptivePerformance.tsx`
- [ ] **Refactoring Type:** New monitoring and adaptation system
- [ ] **Complexity:** Medium (2 days)
- [ ] **Key Features:**
  - **Real-Time Monitoring**: Track performance metrics in real-time
  - **Adaptive Quality**: Reduce animation complexity on slower devices
  - **User Experience Metrics**: Track user satisfaction alongside technical metrics
  - **Automatic Optimization**: Self-optimizing performance based on usage patterns

---

## 📋 Phase 12: Social & Community Features

### 🎯 Phase 12 Goals

- Build optional social features that enhance motivation
- Create community elements that support healthy habits
- Implement privacy-first social interactions
- Add collaborative goal-setting and achievement sharing

### 📊 Social Enhancement Components

**Total Social Features: 15 community enhancements**

| Social Category         | Count | Complexity | Effort | Engagement Impact         |
| ----------------------- | ----- | ---------- | ------ | ------------------------- |
| **Anonymous Sharing**   | 5     | Medium     | 4 days | Community connection      |
| **Collaborative Goals** | 4     | High       | 5 days | Motivation boost          |
| **Achievement Sharing** | 3     | Medium     | 3 days | Celebration amplification |
| **Community Insights**  | 3     | Medium     | 3 days | Educational value         |

### 12.1 Privacy-First Social Features

#### Task 12.1.1: Create Anonymous Progress Sharing

- [ ] **Files:**
  - `frontend/src/features/social/components/AnonymousSharing.tsx`
  - `frontend/src/features/social/components/CommunityComparison.tsx`
  - `frontend/src/features/social/components/PrivacyControls.tsx`
- [ ] **Refactoring Type:** New social system with privacy focus
- [ ] **Complexity:** Medium (3 days)
- [ ] **Key Features:**
  - **Anonymous Benchmarking**: Compare progress with similar users anonymously
  - **Opt-In Sharing**: All sharing is explicitly opted into by users
  - **Data Aggregation**: Share insights without compromising individual privacy
  - **Motivation Without Pressure**: Supportive comparison without judgment

---

## 🎯 Enhanced Success Criteria

### Completion Checklist

- [ ] All 150+ components updated with Material 3 styling and intelligence
- [ ] Complete light/dark theme support with contextual adaptation
- [ ] WCAG 2.1 AA+ accessibility compliance with cognitive accessibility enhancements
- [ ] Smooth animations and sophisticated micro-interactions
- [ ] Performance benchmarks exceeded (see metrics below)
- [ ] Cross-browser compatibility verified across all major browsers
- [ ] Comprehensive documentation completed
- [ ] Design system governance established with community feedback integration

### Enhanced Quality Gates

1. **Visual Consistency:** All components use Material 3 tokens consistently with contextual adaptations
2. **Accessibility Excellence:** All interactions accessible to users with diverse abilities
3. **Performance Excellence:** Theme switching <50ms, initial load <1.5s, 60fps animations
4. **Usability Excellence:** Smooth, engaging, and psychologically supportive interactions
5. **Maintainability Excellence:** Clear documentation, automated testing, and refactoring guidelines
6. **User Psychology Success:** Measurable improvement in user engagement and habit formation

### Advanced Performance Metrics

- **Load Performance:**

  - Initial page load: <1.5 seconds
  - Theme switching: <50ms
  - Component rendering: <16ms (60fps)
  - Memory usage: <100MB baseline

- **User Experience Metrics:**

  - Time to first interaction: <800ms
  - Animation smoothness: 60fps sustained
  - User satisfaction score: >4.8/5
  - Task completion rate: >95%

- **Psychological Impact Metrics:**
  - Daily active usage: +40% increase
  - Goal completion rate: +60% increase
  - User retention (30-day): +50% increase
  - User-reported motivation: +70% increase

### Post-Implementation Excellence Review

- [ ] User feedback collection with psychological impact assessment
- [ ] Performance metrics analysis with user experience correlation
- [ ] Accessibility audit results with real-user testing
- [ ] Team development experience review with process optimization
- [ ] Future enhancement planning with user community input
- [ ] Habit formation effectiveness measurement
- [ ] Community engagement and support system evaluation

---

## 📅 Enhanced Timeline with Advanced Features

- **Phase 1 (Foundation):** 2-3 weeks (includes advanced theming)
- **Phase 2 (Core UI):** 3-4 weeks (includes intelligent interactions)
- **Phase 3 (Features):** 4-6 weeks (includes psychology-driven design)
- **Phase 4 (Specialized):** 2-3 weeks (includes micro-interactions)
- **Phase 5 (Pages):** 2-3 weeks (includes adaptive layouts)
- **Phase 6 (Animation):** 2 weeks (includes physics-based animations)
- **Phase 7 (Accessibility):** 2 weeks (includes cognitive accessibility)
- **Phase 8 (Testing):** 2 weeks (includes performance optimization)
- **Phase 9 (Documentation):** 1 week (includes community guidelines)
- **Phase 10 (Advanced UX):** 4-5 weeks (psychology & gamification)
- **Phase 11 (Performance):** 2-3 weeks (excellence optimization)
- **Phase 12 (Social):** 2-3 weeks (community features)

**Total Enhanced Timeline:** 24-36 weeks

## 🚀 Enhanced Getting Started Strategy

### Prerequisites

1. **Performance Baseline**: Establish current performance metrics
2. **User Research**: Conduct user interviews to understand pain points
3. **Accessibility Audit**: Complete current accessibility assessment
4. **Technical Assessment**: Evaluate current component architecture

### Implementation Strategy

1. **Begin with Phase 1**: Foundation Setup with intelligent theming
2. **Parallel Development**: Work on design tokens while building components
3. **Continuous Testing**: Test components and user psychology impact as you build
4. **User Feedback Integration**: Regular user testing and feedback incorporation
5. **Performance Monitoring**: Continuous performance and user experience monitoring
6. **Community Building**: Engage with users throughout the process for feedback and beta testing

### Risk Mitigation

1. **Technical Complexity**: Break complex features into smaller, testable components
2. **User Adoption**: Gradual rollout with feature flags and user feedback
3. **Performance Impact**: Continuous monitoring and optimization
4. **Accessibility Compliance**: Regular testing with assistive technologies
5. **Timeline Management**: Prioritize core features, treat advanced features as progressive enhancement

This comprehensive implementation will transform the macro tracker from a simple logging tool into an intelligent, emotionally supportive, and psychologically optimized health companion that users will genuinely love and depend on for their wellness journey.
