# Goals Page Plan

## 1. Gather Information:

- Examine the existing project structure to determine where the new "goals page" should be located (frontend or backend).
- Identify the technologies used in the frontend (e.g., React, Vue, HTML/CSS) to ensure compatibility.
- Determine if there's an existing state management system (e.g., Redux, Zustand) to integrate the new page's data.
- Understand how the current weight is stored and accessed.
- Research calorie multiplier formulas and best practices for weight management.
- Take note of already existing types in `@/frontend\src\features\settings\types.ts` and `@/frontend\src\features\macroTracking\types.ts`.
- Explore the existing macro tracking features in the `features/macroTracking` directory.

## 2. Clarify Requirements:

- What specific features should be included on the goals page (e.g., weight input, target weight input, calorie recommendations, progress tracking)?
- What level of "polish" is expected (e.g., UI design, animations, responsiveness)?
- Where is the current weight stored?
- What calorie multipliers should be used?

## 3. Create a new page:

- Create a new file `frontend/src/pages/GoalsPage.tsx`.
- Add a route to this page in `App.tsx`.
- Add a link to this page in `Navbar.tsx`.

## 4. Implement the UI:

- Add input fields for current weight and target weight in `GoalsPage.tsx`.
- Fetch the current weight from the Redux store (`auth-slice.ts` or `user-slice.ts`).
- Implement the Mifflin-St Jeor equation in `GoalsPage.tsx` or a separate utility file.
- Display the calorie recommendations in `GoalsPage.tsx`.
- Add a progress bar to track progress towards the target weight.
- Add a feature that calculates and displays the estimated number of weeks required to reach a user-defined target weight, based on current weight, target weight, and a calculated or user-adjustable daily calorie deficit.
- Allow the user to directly adjust the target daily calorie intake, which will dynamically update the estimated time to reach the target weight.
- Style the page using Tailwind CSS.

## 5. Implement the backend integration:

- If the target weight needs to be stored, create an API endpoint in the backend to update it (`backend/index.ts`).
- Update the Redux store with the target weight.

## 6. Integrate with existing macro tracking features:

- Integrate the calorie recommendations with the existing macro tracking features.

## 7. Test and Refine:

- Thoroughly test the goals page to ensure it works as expected.
- Refine the UI and functionality based on user feedback.

## Mermaid Diagram:

```mermaid
graph LR
    A[Explore macroTracking features] --> B[Create GoalsPage.tsx];
    B --> C(Add route in App.tsx);
    C --> D(Add link in Navbar.tsx);
    D --> E[Implement UI in GoalsPage.tsx];
    E --> F(Weight Input);
    E --> G(Target Weight Input);
    E --> H(Fetch/Update Weight Data);
    H --> H1[Redux State Management];
    H --> H2[Backend API (if needed)];
    E --> I(Mifflin-St Jeor Calculation);
    I --> I1[Calculation Utility Function];
    E --> J(Display Calorie Recommendations);
    J --> K(Progress Bar);
    E --> L(Weeks to Target Calculation);
    L --> L1[Calculation Utility Function];
    E --> M(Adjustable Calorie Intake);
    N[Tailwind CSS Styling] --> O[Ensure Accessibility];
    O --> P[Consider Performance];
    P --> Q[Implement Backend Integration (if needed)];
    Q --> R(Create API Endpoint);
    R --> S(Update Redux Store);
    S --> T[Integrate with Macro Tracking];
    T --> U(Integrate Calorie Recommendations);
    U --> V[Test and Refine];
    V --> V1[Unit Testing];
    V --> V2[Integration Testing];
    V --> V3[User Acceptance Testing];
    W[Note existing types] --> E;
    W --> T;

    style H fill:#90EE90,stroke:#333,stroke-width:2px
    style I fill:#90EE90,stroke:#333,stroke-width:2px
    style L fill:#90EE90,stroke:#333,stroke-width:2px
```
