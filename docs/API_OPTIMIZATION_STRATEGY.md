# API Optimization & Security Strategic Plan

This roadmap outlines a three-phased approach to enhance API performance, reduce data exposure, and create a scalable architecture for the future.

---

## Phase 1: Immediate Triage (Completed)

**Goal:** Address the most critical performance bottlenecks and security exposures with immediate, high-impact fixes.

<br>

### 1.1. Implement Granular API Endpoints

- **Description:** As detailed in `backend/docs/OPTIMIZE_ME_ENDPOINT.md`, the `/api/user/me` endpoint exposes excessive data. This solution involves splitting oversized endpoints into smaller, more focused ones. The main endpoint will return essential data, while a new, dedicated endpoint will handle sensitive or bulky information on-demand.
- **Impact:**
  - **Excessive Data Exposure:** Immediately reduces the surface area of sensitive data (e.g., billing details) by moving it to a protected, on-demand endpoint.
  - **Degrading Performance:** Reduces payload size for the most frequently called endpoint, improving load times across the app.
- **Pros & Cons:**
  - **Pros:** Quick to implement, significant and immediate impact on performance and security. Follows the principle of least privilege.
  - **Cons:** Requires coordinated changes on both frontend and backend.
- **Implementation Steps:**
  1.  **Backend:**
      - Modify the `/api/user/me` handler in `backend/src/modules/user/routes.ts` to return only the slimmed-down user object.
      - Create a new `GET /api/billing/details` endpoint in `backend/src/modules/billing/routes.ts` that returns detailed subscription and payment information.
  2.  **Frontend:**
      - Update the user state management (e.g., Zustand/Redux) to expect the new, smaller user object.
      - Modify the billing page to call the new `/api/billing/details` endpoint when it mounts.

### 1.2. Introduce API Response Filtering (DTOs)

- **Description:** Generalize the solution from 1.1 across all endpoints. Use the response schema validation feature in Elysia to ensure that API endpoints only return fields explicitly defined for the client. This prevents accidental exposure of internal database columns or nested objects.
- **Impact:**
  - **Excessive Data Exposure:** Systematically eliminates the risk of leaking internal data models through any API endpoint.
  - **Degrading Performance:** Reduces payload sizes across the board, leading to faster API responses.
- **Pros & Cons:**
  - **Pros:** Enforces a contract-first approach, improves security posture significantly, makes API responses predictable.
  - **Cons:** Requires discipline to maintain response schemas for all endpoints.
- **Implementation Steps:**
  1.  **Backend:** Review all routes (e.g., in `backend/src/modules/macros/routes.ts`) and ensure a `response` schema is defined in the Elysia route configuration.
  2.  **Backend:** Use helper functions like `toCamelCase` consistently to transform database results into the DTO format before returning them.

### 1.3. Implement API Pagination

- **Description:** The `GET /api/macros/history` endpoint currently fetches all historical data for a user at once. This is not scalable. This solution introduces cursor- or offset-based pagination to all list-based endpoints.
- **Impact:**
  - **Degrading Performance:** Drastically improves the performance and reliability of fetching large datasets. Prevents server strain and potential crashes for users with extensive history.
- **Pros & Cons:**
  - **Pros:** Critical for application stability and scalability. A standard and expected feature for any list-based API.
  - **Cons:** Requires frontend to be updated to handle paginated data, potentially involving UI changes like infinite scrolling or "Load More" buttons.
- **Implementation Steps:**
  1.  **Backend:** Modify the `/api/macros/history` handler to accept query parameters like `limit` and `cursor`. The SQL query should be updated to use these parameters (e.g., `LIMIT ... OFFSET ...` or `WHERE id > ...`).
  2.  **Frontend:** Update the data-fetching logic for the history view to request pages of data and append them to the current list as the user scrolls.

---

## Phase 2: Short-Term Fixes

**Goal:** Introduce foundational architectural patterns to consolidate requests and implement an effective, distributed caching layer.

<br>

### 2.1. Introduce a Backend for Frontend (BFF) Aggregation Layer

- **Description:** The frontend currently performs complex data aggregation, as seen in `NutrientDensityVisualization.tsx`. A BFF involves creating new, experience-specific endpoints that aggregate data from multiple sources on the server side and return it to the client in the exact shape it needs.
- **Impact:**
  - **High Volume of Requests:** Reduces the number of calls a client needs to make. Instead of fetching raw data from multiple endpoints, it makes one call to an aggregation endpoint.
  - **Degrading Performance:** Offloads heavy computation from the client's browser to the server, leading to a faster and smoother user experience.
- **Pros & Cons:**
  - **Pros:** Simplifies frontend logic, improves performance, decouples the client experience from backend data models.
  - **Cons:** Can lead to some duplication of logic if not managed carefully. Introduces new endpoints to maintain.
- **Implementation Steps:**

  1.  **Backend:** Create a new endpoint, e.g., `GET /api/reporting/nutrient-density-summary`, that accepts a date range.
  2.  **Backend:** This endpoint's handler will perform the same aggregation logic currently found in the `NutrientDensityVisualization` component (grouping by week, month, etc.).
  3.  **Frontend:** Refactor the `NutrientDensityVisualization` component to fetch its data from this new endpoint and remove the complex `useMemo` aggregation logic.

- **Architectural Diagram:**

  ```mermaid
  graph TD
      subgraph Frontend
          A[Browser]
      end
      subgraph Backend
          B[BFF: /api/reporting/nutrient-density-summary]
          C[Service: /api/macros/history]
          D[Service: /api/goals/...]
      end

      A -- 1. Single Request --> B
      B -- 2. Fetches Macro History --> C
      B -- 3. Fetches Goals --> D
      B -- 4. Aggregates Data --> B
      B -- 5. Returns Shaped Response --> A
  ```

### 2.2. Caching Strategy

- **Description:** The current in-memory `cache-service.ts` is suitable for the current single-instance deployment model. A distributed cache like Redis would add unnecessary complexity at this stage.
- **Impact:** The existing in-memory cache will continue to provide performance benefits by reducing database load for frequently accessed, non-user-specific data (like food searches).
- **Decision:** We will continue to use the existing in-memory cache. If the application needs to scale to multiple instances in the future, we will re-evaluate the need for a distributed cache like Redis at that time.

### 2.3. Enable HTTP/2

- **Description:** HTTP/2 allows for request multiplexing over a single TCP connection, which is highly effective at mitigating the overhead of many small, concurrent requests.
- **Impact:**
  - **High Volume of Requests:** Reduces the latency caused by network overhead, as the browser can send multiple requests simultaneously without waiting for each one to complete.
- **Pros & Cons:**
  - **Pros:** Purely an infrastructure change with no code modification required. Significant performance gain for request-heavy pages.
  - **Cons:** Requires the load balancer or web server (e.g., Nginx, Caddy) to be configured to support it.
- **Implementation Steps:**
  1.  **Infrastructure:** Ensure the load balancer or reverse proxy sitting in front of the Node.js application is configured to enable HTTP/2. This is a standard feature on most modern cloud providers and web servers.

---

## Phase 3: Long-Term Architectural Improvements

**Goal:** Evolve the architecture to a state that is highly scalable, flexible, and efficient for future development.

<br>

### 3.1. Evaluate and Potentially Adopt GraphQL

- **Description:** GraphQL is a query language for APIs that allows clients to request exactly the data they need, and nothing more. It's the ultimate solution to the problems of over-fetching (data exposure) and under-fetching (high request volume).
- **Impact:**
  - **Excessive Data Exposure:** Solved by design. Clients specify the exact fields they need.
  - **High Volume of Requests:** Solved by design. Clients can fetch data from multiple resources in a single, consolidated query.
- **Pros & Cons:**
  - **Pros:** Maximum flexibility for frontend development, eliminates entire classes of performance problems, strongly typed schema.
  - **Cons:** A significant architectural shift. Requires a new way of thinking about data fetching and a learning curve for the team.
- **Implementation Steps:**

  1.  **Backend:** Introduce a GraphQL server library (e.g., `mercurius` for Elysia/Fastify).
  2.  **Backend:** Define a GraphQL schema (types, queries, mutations).
  3.  **Backend:** Write "resolvers" that fetch the data for each field in the schema.
  4.  **Frontend:** Use a GraphQL client library (e.g., Apollo Client) to build queries and manage client-side state and caching.

- **Architectural Diagram:**

  ```mermaid
  graph TD
      subgraph Frontend
          A[Browser]
      end
      subgraph Backend
          B[GraphQL Server]
          C[Macros Service]
          D[User Service]
          E[Goals Service]
      end

      A -- "query { me { name }, todayMacros { calories } }" --> B
      B -- Resolves `me` --> D
      B -- Resolves `todayMacros` --> C
      B -- Returns consolidated JSON --> A
  ```

### 3.2. Optimize Frontend State Management & Caching

- **Description:** Even with a fast API, redundant requests from the frontend can hurt performance. This involves adopting a modern data-fetching library like React Query or SWR.
- **Impact:**
  - **High Volume of Requests:** These libraries automatically handle request de-duplication, background refetching, and client-side caching, preventing components from making unnecessary API calls for data that is already available.
- **Pros & Cons:**
  - **Pros:** Drastically simplifies data-fetching logic in components, improves perceived performance, makes the UI more resilient and responsive.
  - **Cons:** Adds a new library to the frontend stack and requires refactoring of existing data-fetching logic.
- **Implementation Steps:**
  1.  **Frontend:** Integrate a library like React Query.
  2.  **Frontend:** Wrap API service calls in custom hooks (e.g., `useMacrosHistory`).
  3.  **Frontend:** Replace existing `useEffect`-based data fetching in components with these new hooks.

### 3.3. Introduce a Background Job Queue

- **Description:** For operations that are slow or don't need to be processed synchronously (e.g., sending a welcome email, generating a large PDF report), offload them to a background job queue using Redis and a library like BullMQ.
- **Impact:**
  - **Degrading Performance:** Prevents long-running tasks from blocking the main thread and slowing down API responses for the user. Improves the perceived speed of the application.
- **Pros & Cons:**
  - **Pros:** Makes the application more responsive and resilient. Allows for retries and better management of asynchronous tasks.
  - **Cons:** Adds complexity to the architecture (a queue and background workers).
- **Implementation Steps:**
  1.  **Infrastructure:** Use the existing Redis instance from step 2.2.
  2.  **Backend:** Integrate BullMQ. Create a queue for specific jobs.
  3.  **Backend:** In the API, instead of performing the slow task directly, add a job to the queue.
  4.  **Backend:** Create a separate "worker" process that listens to the queue and executes the jobs.

---

## Phase 4: Continuous Improvement &amp; Advanced Practices

**Goal:** Establish a culture and technical foundation for ongoing optimization, ensuring the application remains performant, secure, and scalable as it evolves.

&lt;br&gt;

### 4.1. Advanced Database Optimization

- **Description:** While indexing is a great first step, further database optimizations can yield significant gains, especially under heavy load.
- **Techniques:**
  - **Connection Pooling:** Implement a connection pool (like `pgBouncer` for PostgreSQL or built-in poolers) to efficiently manage and reuse database connections, reducing the overhead of establishing new connections for each request.
  - **Read Replicas:** For read-heavy applications, introduce read replicas. Direct all write operations (INSERT, UPDATE, DELETE) to a primary database and distribute read operations (SELECT) across one or more replicas. This drastically reduces load on the primary database.
  - **Query Analysis:** Regularly use query analysis tools (like `EXPLAIN ANALYZE`) to inspect the execution plans of slow queries and identify opportunities for rewriting them or adding more specific indexes.
- **Impact:** Improves database scalability and resilience, ensuring it doesn't become a bottleneck as user traffic grows.

### 4.2. Real-Time Communication with WebSockets

- **Description:** For features requiring real-time updates (e.g., live notifications, collaborative features), polling the API repeatedly is inefficient. WebSockets provide a persistent, bidirectional communication channel between the client and server.
- **Impact:**
  - **High Volume of Requests:** Eliminates the need for HTTP polling for real-time data, significantly reducing network traffic and server load.
  - **User Experience:** Enables instantaneous updates, creating a more dynamic and interactive application.
- **Implementation Steps:**
  1.  **Backend:** Integrate a WebSocket library (Elysia has plugins for this).
  2.  **Backend:** Create WebSocket handlers for specific events (e.g., `new_notification`).
  3.  **Frontend:** Use the native WebSocket API or a library to connect to the server and listen for messages.

### 4.3. Enhanced Security Posture

- **Description:** Go beyond the baseline and implement more proactive security measures.
- **Techniques:**
  - **Web Application Firewall (WAF):** Deploy a WAF (like Cloudflare WAF or AWS WAF) to protect against common web exploits (XSS, SQL injection) at the edge, before they even reach your application.
  - **Automated Dependency Scanning:** Integrate tools like `npm audit` or Snyk into your CI/CD pipeline to automatically scan for and alert on vulnerabilities in third-party packages.
  - **Stricter Content Security Policy (CSP):** Implement a robust CSP to control which resources (scripts, styles, images) can be loaded by the browser, mitigating the risk of cross-site scripting (XSS) attacks.

### 4.4. Proactive Observability &amp; Alerting

- **Description:** Move from passive monitoring to proactive observability.
- **Techniques:**
  - **Distributed Tracing:** Implement full distributed tracing using a platform like Jaeger or Honeycomb. This allows you to visualize the entire lifecycle of a request as it travels through different services, making it easy to pinpoint bottlenecks.
  - **Anomaly Detection:** Configure your monitoring system (e.g., Prometheus, Datadog) to automatically detect anomalies in key metrics (e.g., a sudden spike in p99 latency or error rates) and trigger alerts.
  - **Business-Level Metrics:** Instrument your code to track key business metrics (e.g., user sign-ups, subscription conversions) alongside technical metrics. This helps correlate technical performance with business impact.

### 4.5. CI/CD &amp; Automated Performance Testing

- **Description:** Embed performance and security testing directly into the development lifecycle.
- **Techniques:**
  - **Automated API Testing:** Use tools like Postman/Newman or k6 to create a suite of automated tests that validate API correctness, performance, and contracts on every commit.
  - **Load Testing:** Integrate load testing into your CI/CD pipeline. Before deploying to production, automatically run a load test against a staging environment to ensure that recent changes haven't introduced performance regressions.
  - **Bundle Size Analysis:** For the frontend, use tools like `webpack-bundle-analyzer` to monitor the size of your JavaScript bundles and prevent them from growing uncontrollably.

---

## Phase 1 Frontend Implementation Plan

This section details the required frontend changes to align with the Phase 1 backend API optimizations.

### 1. Update API Services and Types

**File:** `frontend/src/utils/apiServices.ts`

- **Action:** Modify the `UserDetailsResponse` interface to match the new slimmed-down `/api/user/me` response. The detailed subscription object will be removed and replaced with a summary.
- **Action:** Create a new `getBillingDetails` function in the `billing` service to fetch data from the new `/api/billing/details` endpoint.

**File:** `frontend/src/features/settings/store/user-slice.ts`

- **Action:** Update the `UserSlice` and related logic to use the new `UserDetailsResponse` type. The `subscription` object in the state will now hold the summary view.
- **Action:** Add a new action, `fetchBillingDetails`, to fetch the detailed billing information on demand and store it in a new state property (e.g., `billingDetails`).

### 2. Refactor Billing Components

**File:** `frontend/src/features/settings/components/BillingForm.tsx`

- **Action:** This component should be modified to trigger the new `fetchBillingDetails` action when it mounts.
- **Action:** The component should use the new `billingDetails` state to pass the detailed subscription and payment information to its child components.

**File:** `frontend/src/features/settings/components/ProBillingView.tsx`

- **Action:** This component must be refactored to receive the detailed billing props from `BillingForm.tsx` instead of relying on the global user state.

### 3. Update Subscription Status Logic

**File:** `frontend/src/features/pricing/hooks/useSubscriptionStatus.ts`

- **Action:** This hook should be updated to rely solely on the `subscription.status` field from the slimmed-down user object. It no longer needs to parse a detailed subscription object.

### 4. Update Macro History Page

**File:** `frontend/src/features/macroTracking/pages/HistoryPage.tsx` (or similar)

- **Action:** The data fetching logic for the macro history view must be updated to handle the new paginated response from `/api/macros/history`.
- **Action:** Implement a UI mechanism like infinite scrolling or a "Load More" button to fetch subsequent pages of data as the user interacts with the view.

---

## Phase 2 File Modification List

This section lists the files that will be modified to implement the Phase 2 objectives.

### 2.1. Backend for Frontend (BFF)

- **`backend/src/modules/reporting/routes.ts`** (new file): Will contain the new `GET /api/reporting/nutrient-density-summary` endpoint.
- **`backend/src/index.ts`**: Will be updated to import and use the new reporting routes.
- **`frontend/src/features/reporting/components/NutrientDensityVisualization.tsx`**: Will be refactored to fetch data from the new BFF endpoint.
- **`frontend/src/utils/apiServices.ts`**: Will be updated to include a new function for calling the nutrient density summary endpoint.

### 2.2. Caching Strategy

_No file changes are required for this item at this time._
