```mermaid
flowchart LR
    %% Styles
    classDef core fill:#e1f5fe,stroke:#01579b,stroke-width:2px
    classDef pages fill:#fff3e0,stroke:#e65100,stroke-width:2px
    classDef components fill:#f3e5f5,stroke:#4a148c,stroke-width:2px
    classDef state fill:#e8f5e9,stroke:#1b5e20,stroke-width:2px
    classDef utils fill:#fbe9e7,stroke:#bf360c,stroke-width:2px
    classDef storage fill:#f5f5f5,stroke:#424242,stroke-width:2px
    classDef monitoring fill:#e8eaf6,stroke:#283593,stroke-width:2px

    %% Core Application
    A[App.tsx]:::core --> B(AuthHandler):::core
    B --> C(Routes):::core

    %% Pages
    C --> D(HomePage):::pages
    C --> E(AuthPage):::pages
    C --> F(SettingsPage):::pages
    C --> G(ReportingPage):::pages

    %% UI Components
    subgraph UI Components
        direction TB
        I1(AddEntryForm):::components
        I2(AuthForm):::components
        I3(NutritionGoalsForm):::components
        J1(ErrorBoundary):::components
        J2(FloatingNotification):::components
        J3(LoadingSpinner):::components
        J4(NetworkStatus):::components
        J5("Offline Banner"):::components
        K1(MacroDistribution):::components
        K2(MacroPieChart):::components
        K3(LoadingSkeleton):::components
        F1(ToastNotifications):::components
        F2(ErrorDisplay):::components
        F3(ProgressIndicator):::components
    end

    %% State Management
    S(Zustand Store):::state --> S1("UI Slice"):::state
    S --> S2("Auth Slice"):::state
    S --> S3("Macros Slice"):::state
    Q("React Query Cache"):::state

    %% Storage
    LS("Local Storage"):::storage
    SS("Session Storage"):::storage
    IDB("IndexedDB"):::storage

    %% Utils & Services
    M("API Service"):::utils --> RQ("Request Queue"):::utils
    RQ --> RT("Retry Logic"):::utils
    N("Error Handler"):::utils
    NM("Network Monitor"):::utils
    V("Schema Validation"):::utils
    SM("State Machines"):::utils
    PMC("Performance Collector"):::monitoring
    AM("Analytics Manager"):::monitoring

    %% Data Flow
    D --> I1
    D --> K1
    G --> K2
    E --> I2
    F --> I3

    I1 --> S3
    I2 --> S2
    I3 --> S3

    S3 --> Q
    S2 --> LS
    S1 --> J2
    S3 --> IDB

    M --> Q
    M --> S3
    M --> N
    M --> PMC
    NM --> J4
    J1 --> N
    N --> AM
    PMC --> AM

    RQ --> M
    RT --> RQ

    style UI Components fill:#f3e5f5,stroke:#4a148c,stroke-width:2px
    style State Management fill:#e8f5e9,stroke:#1b5e20,stroke-width:2px
    style Storage fill:#f5f5f5,stroke:#424242,stroke-width:2px
    style "Utils & Services" fill:#fbe9e7,stroke:#bf360c,stroke-width:2px
```
