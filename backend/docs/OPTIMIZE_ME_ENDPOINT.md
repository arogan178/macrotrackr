# Plan to Optimize the `/api/user/me` Endpoint

## 1. Problem Statement

The current `/api/user/me` endpoint returns a large and detailed user object, which includes the entire Stripe subscription object. This has several disadvantages:

- **Large Payload Size:** It increases network latency and data consumption, slowing down parts of the application that only need basic user information.
- **Over-exposure of Data:** Most parts of the app do not require detailed billing information like payment methods or full subscription details. Fetching this data on every call to `/me` is unnecessary.
- **Frontend Complexity:** The frontend has to handle a large, nested object, even when it only needs a subset of the data.

**Example of large payload field:** `subscription.stripeDetails`

## 2. Proposed Solution

The solution is to separate the core user data from the detailed billing data by creating a new, dedicated endpoint for billing information.

### 2.1. Modify `/api/user/me` Endpoint

The `/me` endpoint will be slimmed down to return only essential user data and a high-level subscription summary.

**New `/me` Response Structure:**

```json
{
  "id": 1,
  "email": "andrea.bugeja@hotmail.com",
  "firstName": "Andrea",
  "lastName": "Bugeja",
  "createdAt": "2025-07-06 13:31:47",
  "dateOfBirth": "1999-01-17",
  "height": 176,
  "weight": 83.6,
  "gender": "male",
  "activityLevel": 3,
  "subscription": {
    "status": "pro", // "free", "pro", "canceled"
    "currentPeriodEnd": "2026-07-11T14:30:59.000Z", // Only if status is 'pro'
    "hasStripeCustomer": true
  }
}
```

### 2.2. Create New `/api/billing/details` Endpoint

A new endpoint will be created to serve detailed billing and subscription information. This endpoint will only be called when the user navigates to the billing or subscription management pages.

**Endpoint:** `GET /api/billing/details`

**Response Structure:**

```json
{
  "subscription": {
    "id": "id_1752252917823_nmyoi3m",
    "status": "active",
    "currentPeriodEnd": "2026-07-11T14:30:59.000Z",
    "stripeSubscriptionId": "sub_1RjhzAJ7j4wf71k9NpcYRoqc"
  },
  "price": "$29.99/year",
  "paymentMethod": {
    "brand": "mastercard",
    "last4": "9363"
  },
  "stripeDetails": {
    // The full Stripe subscription object can be returned here if needed
    // For security, it's better to curate the fields returned.
    "id": "sub_1RjhzAJ7j4wf71k9NpcYRoqc",
    "customer": "cus_SdvBmSklL9pNa3",
    "status": "active",
    "current_period_end": 1783780259
    // ... other relevant fields
  }
}
```

_Note: For better security and reduced payload, the backend should map only necessary fields from the Stripe object rather than sending the whole thing._

## 3. Implementation Steps

### 3.1. Backend Changes (`/backend`)

1.  **Update User Module:**
    - Locate the handler for `GET /api/user/me` (likely in `src/modules/user/routes.ts` or a related service).
    - Modify the data retrieval logic to fetch only the fields defined in the "New `/me` Response Structure".
    - The subscription object should be simplified. Instead of returning the full Stripe object, it should return a summary.

2.  **Create Billing Module Endpoint:**
    - In `src/modules/billing/routes.ts`, define the new `GET /api/billing/details` route.
    - Implement a service/handler for this route.
    - This handler will fetch the full subscription details from the database (or directly from Stripe, if not stored). It should be protected and only accessible to authenticated users.
    - The handler will format the response as defined in "Response Structure" for `/api/billing/details`.

### 3.2. Frontend Changes (`/frontend`)

1.  **Update API Services (`src/utils/apiServices.ts`):**
    - Modify the `UserDetailsResponse` interface to match the new, smaller `/me` response.
    - Create a new `billing` section in the `apiService` object.
    - Add a new function `apiService.billing.getBillingDetails` to fetch data from the `/api/billing/details` endpoint.

2.  **Update State Management (e.g., Zustand/Redux):**
    - The user state in the store should be updated to reflect the new `UserDetailsResponse` structure.

3.  **Update Components:**
    - Search the codebase for usages of `apiService.user.getUserDetails`.
    - Update all components that use the user object to work with the new, smaller structure.
    - Identify the billing/subscription management page (e.g., `src/features/billing/`).
    - Modify this page to call `apiService.billing.getBillingDetails` to fetch and display the detailed subscription information. This data should be fetched "on-demand" when the user visits the page.
    - Update any logic that relies on the detailed subscription data being present in the main user object (e.g., pro-feature guards). These guards should now rely on the simplified `subscription.status` field.
