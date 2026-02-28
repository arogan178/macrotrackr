# MacroTrackr v2.0: A Complete Design Overhaul & Hybrid Meal Grouping

Over the past few months, we took a step back and looked at how our users were actually interacting with MacroTrackr. The feedback was clear: you loved the speed and the data, but you wanted a more premium feel, better insights, and less friction when tracking complex meals.

Today, we're thrilled to unveil MacroTrackr v2.0.

This is our biggest update yet, featuring a completely redesigned interface, our highly requested Hybrid Meal Grouping feature, and a massive upgrade to our analytics and reporting tools.

## The Spotify-Inspired UI Redesign

We've completely overhauled the visual language of the app. Drawing inspiration from top-tier audio and fitness apps, we adopted a darker, more immersive theme with bold typography, subtle gradients, and high-contrast vibrant accents for your macros.

**What's new in the UI:**
- **Sleek Dark Mode:** Deep surface colors with subtle frosted glass and neon accents make tracking at night or in the gym easy on the eyes.
- **Fluid Animations:** Powered by Framer Motion, every interaction—from opening modals to expanding meals—feels natural and responsive.
- **Simplified Navigation:** We reworked the landing page and the core dashboard to put your daily totals and tracking history front and center.

## Introducing: Hybrid Meal Grouping

One of the biggest pain points in macro tracking is logging the same complex meal day after day. You either have to log 10 different ingredients every time, or create a custom "food" that loses all the underlying data.

Not anymore. 

With **Hybrid Meal Grouping**, you can now select multiple items directly from your entry history and group them into a single "Saved Meal." 
- **Single Top-Level Entry:** When you log it, it shows up as one clean entry on your daily log.
- **Preserved Ingredients:** Expand the entry with our new accordion UI to see exactly what’s inside.
- **Dynamic Scaling:** Adjust the serving size of your saved meal, and all underlying ingredients will scale perfectly.

It’s the best of both worlds: a clean dashboard and perfectly accurate data.

## Unified Insights & Bento Grid Reporting

Data is only useful if you can understand it at a glance. We’ve replaced our old reporting charts with a modern, unified "Bento Grid" UI. 

- Your **Macro Density Breakdown**, **Meal Time Analytics**, and **Caloric Trends** are now beautifully arranged in a unified dashboard.
- We removed the nested, heavy styles in favor of clean, readable charts that highlight your progress over 7, 30, or 90 days.

## Performance & Accessibility

A premium design means nothing if the app is slow. We went through the entire application to ensure that performance and accessibility were first-class:
- Fixed invisible UI bugs and low-contrast text on authentication pages.
- Standardized our color tokens to ensure proper depth hierarchy and WCAG compliance.
- Continued leveraging **TanStack Query** and **React 19** for instant transitions and zero loading spinners between your views.

## What's Next?

This v2.0 release lays the groundwork for the rest of 2026. With our new UI system and flexible data structures (like nested ingredients), we're perfectly positioned to introduce advanced recipe building and barcode scanning soon.

Try out the new tracking flow today, and let us know what you think of the new look!

— The MacroTrackr Team
