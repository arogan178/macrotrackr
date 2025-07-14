# Macro Trackr Monetization Plan: Free vs. Pro Tiers

## 1. Executive Summary

This document outlines a strategic plan to introduce a recurring revenue model for the Macro Trackr application. The core of this strategy is a tiered membership system featuring a **Free** plan and a **Pro** plan. This model allows us to maintain a strong user acquisition funnel with the free offering while generating sustainable revenue from power users who require advanced functionality.

The Pro tier is designed to offer significant value through advanced features, in-depth analytics, and enhanced customization, justifying a monthly subscription fee.

---

## 2. Pricing Strategy

### 2.1. Proposed Price Point: $6.99/Month or $59.99/Year

A price of **$6.99 per month** or **$59.99 per year** is a competitive and accessible starting point. It positions the Pro plan as an affordable upgrade for users committed to their health and fitness journey, while supporting ongoing development.

### 2.2. Price Calculation & Validation

While $6.99/month is a strong initial proposal, the optimal price point should be validated through a combination of methods:

- **Competitor Analysis**:

  - **MyFitnessPal Premium**: ~$19.99/month or $79.99/year. Offers advanced features like custom macro goals, ad-free experience, and detailed reporting.
  - **Cronometer Gold**: ~$8.99/month or $49.99/year. Provides in-depth nutrient analysis, timestamps, and advanced charting.
  - **Lose It! Premium**: ~$39.99/year. Includes meal planning, advanced tracking, and pattern analysis.
  - **Conclusion**: At $6.99/month ($59.99/year), our Pro plan would be priced very competitively, making it an attractive alternative.

- **Value-Based Pricing**: The price should reflect the value delivered. The Pro features (outlined below) save users time, provide deeper insights, and offer powerful tools to achieve their goals more effectively.

- **Target Audience**: Our target users are individuals serious about macro tracking. They are often willing to invest in tools that provide clear benefits and a superior user experience.

**Recommendation**: Launch with the **$6.99/month** price and **$59.99/year** annual plan (offering a ~28% discount). Adjust as needed based on user feedback and market response.

---

## 3. Tiered Membership Model: Feature Breakdown

### 3.1. Free Tier (Core Experience)

The Free tier will provide all the essential tools for effective macro tracking, ensuring the app remains a powerful standalone product.

- ✅ **Macro Tracking**: Full ability to log daily macro intake (protein, carbs, fats).
- ✅ **Meal Types**: Standard meal types (Breakfast, Lunch, Dinner, Snack).
- ✅ **Dashboard**: Basic dashboard with today's macro summary and totals.
- ✅ **Weight Logging**: Track and view weight history.
- ✅ **Basic Goal Setting**: Set a primary weight goal (lose, maintain, gain).
- ✅ **Standard Reporting**: View macro history on a daily basis.

### 3.2. Pro Tier (Advanced & Premium Features)

The Pro tier is for users who want to unlock the full potential of their data and access advanced analytics and tools.

- 🌟 **Advanced Reporting & Analytics** (PRO-guarded):
  - Custom date range filtering for historical data (PRO only)
  - Trend analysis charts (e.g., weekly/monthly averages) (PRO only)
  - Data export to CSV (PRO only)
  - **Note:** All users (Free and Pro) can view basic daily macro history and summary. Only advanced analytics are PRO-guarded.
- 🌟 **Advanced Goal Setting** (PRO-guarded):
  - Set specific macronutrient targets in grams (PRO only)
  - Track other body measurements (e.g., body fat %, waist circumference) (PRO only)
  - **Note:** Target macro percentages are not yet implemented; only basic macro targets are available.
- 🌟 **Full Habit Tracking** (PRO-guarded):
  - Free users can track up to 2 habits; PRO users can create and track unlimited habits.
  - No habit analysis features exist yet (just a simple tracker).
- 🌟 **Ad-Free Experience** (PRO-guarded):
  - Complete removal of all advertisements
- 🌟 **Priority Support** (PRO-guarded):
  - Dedicated email support with faster response times

**Planned/Future Features (not yet implemented, not currently PRO-guarded):**

- Recipe & Meal Saver (custom meals, save/log frequent meals)
- Customization (custom meal types, themes, icons)

**Goals Page:**

- The Goals page is mostly available to all users. There is little to PRO-gate at this time.

---

## 4. Technical Implementation Plan

### Progress Update (June 30, 2025)

- [x] **Backend Stripe integration and Pro feature guard implemented**
- [x] **Frontend state management:** Zustand user slice and `useSubscriptionStatus` hook for `subscriptionStatus`.
- [x] **API Service:** Billing helpers for Stripe checkout/portal (`createCheckoutSession`, `createPortalSession`).
- [x] **UI Components:** `ProBadge`, `PricingTable`, `UpgradeModal`, `ProRoute`, `ProFeature` (for gating and conditional rendering).
- [x] **Pages:** `/pricing` and `/settings/billing` created with upgrade/management flows.
- [x] **Feature Gating:** Pro-only features and routes are now protected and conditionally rendered.
- [ ] **Integration:** Next, integrate these components into the main app router/layout and ensure subscription status is refreshed after login and Stripe webhook events.

This plan requires significant work on both the backend and frontend. We will use **Stripe** for payment processing due to its robust APIs, excellent documentation, and secure handling of payments.

### 4.1. Backend (Elysia.js & Bun)

**1. Database Schema Changes (`backend/src/db/schema.ts`)**

- **`users` table**:
  - Add `subscription_status` (TEXT, e.g., 'free', 'pro', 'canceled'). Default: 'free'.
  - Add `stripe_customer_id` (TEXT, nullable, unique).
- **New `subscriptions` table**:
  - `id` (TEXT, primary key)
  - `user_id` (INTEGER, foreign key to `users.id`)
  - `stripe_subscription_id` (TEXT, unique)
  - `status` (TEXT, e.g., 'active', 'canceled', 'past_due')
  - `current_period_end` (DATETIME)
  - `created_at` (DATETIME)
  - `updated_at` (DATETIME)

**2. Payment Gateway Integration (Stripe)**

- Install the Stripe Node.js library: `bun add stripe`.
- Add Stripe secret keys (`STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`) to environment variables and `config.ts`.

**3. New API Module (`backend/src/modules/billing/`)**

- Create a new module for handling all billing-related logic.
- **`POST /api/billing/create-checkout-session`**:
  - Authenticates the user.
  - Creates a Stripe Customer if one doesn't exist and saves the `stripe_customer_id` to the user.
  - Creates a Stripe Checkout Session for the Pro plan price ID.
  - Returns the session ID to the frontend.
- **`POST /api/billing/create-portal-session`**:
  - Authenticates the user.
  - Creates a Stripe Customer Portal Session, allowing users to manage their subscription (update payment methods, view invoices, cancel).
  - Returns the portal URL to the frontend.
- **`POST /api/webhooks/stripe`**:
  - A public endpoint to receive webhooks from Stripe.
  - Verifies the webhook signature using `STRIPE_WEBHOOK_SECRET`.
  - Handles key events:
    - `checkout.session.completed`: A user has successfully subscribed. Create a new entry in our `subscriptions` table and update the `users.subscription_status` to 'pro'.
    - `customer.subscription.updated`: The subscription has changed (e.g., upgraded, downgraded, or canceled). Update the status and `current_period_end` in our `subscriptions` table.
    - `customer.subscription.deleted`: The subscription has ended. Update `users.subscription_status` to 'canceled' or 'free'.

**4. Pro Feature Guard (Middleware)**

- Create a new middleware: `pro-guard.ts`.
- This middleware checks if the authenticated user has a `subscription_status` of 'pro'.
- It will be applied to all Pro-only API routes. If the user is not a Pro member, it returns a `403 Forbidden` error with a message like "This feature is available for Pro members only."

### 4.2. Frontend (React & Zustand)

- **State Management:**

  - Zustand user slice (`userSlice.ts`) and `useSubscriptionStatus` hook for `subscriptionStatus` (done).
  - Ensure state is set on login and refreshed after subscription changes (in progress).

- **Routes & Pages:**

  - `/pricing` (public): Feature comparison and upgrade flow (done).
  - `/settings/billing` (Pro-only): Subscription management (done).

- **UI Components:**

  - `PricingTable.tsx`, `UpgradeModal.tsx`, `ProBadge.tsx`, `ProRoute.tsx`, `ProFeature.tsx` (all done).

- **API Service:**

  - Billing helpers for Stripe checkout/portal (`createCheckoutSession`, `createPortalSession`) (done).

- **Feature Gating:**

  - Conditional rendering and route protection using `subscriptionStatus` (done). Only advanced analytics and habit tracking are PRO-guarded; basic reporting and goals are available to all users.

- **Next Steps:**
  - Integrate new components into main app router/layout.
  - Ensure subscription status is refreshed after login and Stripe webhook events.
  - Finalize UI polish and test full upgrade/management flow.

---

## 5. User Experience (UX) Flow

- **Upgrade Flow**:

  1.  A free user clicks on a disabled Pro feature (e.g., "Advanced Reporting").
  2.  An `UpgradeModal` appears, briefly explaining the benefits of the feature and the Pro plan.
  3.  The user clicks "Upgrade to Pro," which redirects them to the `/pricing` page.
  4.  On the pricing page, the user clicks "Get Started with Pro."
  5.  The frontend calls the backend to create a Stripe Checkout Session.
  6.  The user is redirected to the secure Stripe Checkout page to enter payment details.
  7.  Upon successful payment, Stripe redirects the user back to the application (e.g., to a "Welcome to Pro!" page), and the backend updates their status via webhook.
  8.  The user's UI now reflects their Pro status, unlocking all features.

- **Subscription Management Flow**:
  1.  A Pro user navigates to `Settings > Billing`.
  2.  They click "Manage Subscription."
  3.  The frontend calls the backend to create a Stripe Portal Session.
  4.  The user is redirected to the Stripe Customer Portal, where they can cancel, update their card, and view invoices.

---

## 6. Go-to-Market & Rollout Strategy

1.  **Development Phase**: Implement all backend and frontend changes in a separate feature branch.
2.  **Testing**: Thoroughly test the entire subscription flow in Stripe's test mode. Test all webhook events and edge cases (e.g., payment failure).
3.  **Launch Communication**:
    - Announce the new Pro plan to existing users via an in-app notification and email.
    - Offer an **early-bird discount** (e.g., 25% off for the first 3 months) for existing users to encourage adoption.
4.  **Grandfathering (Optional)**: Decide if very early users should be granted a free lifetime Pro plan as a gesture of goodwill. This can build strong community loyalty.
5.  **Monitor & Iterate**: After launch, closely monitor subscription metrics, user feedback, and support requests to iterate on the pricing and feature set.
