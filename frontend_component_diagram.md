graph LR
App((App))
subgraph Components
AddEntryForm
AuthForm
CalorieSearchForm
CardMetricsPanel
ConfirmationModal
DailySummaryPanel
EditModal
EmptyState
EntryHistoryPanel
ErrorBoundary
FloatingNotification
FormComponents
Icons
LoadingSpinner
MacroDistribution
MacroPieChart
MacroSlider
Navbar
NotificationManager
SaveButton
subgraph Auth
ButtonModeToggle
LoginForm
RegisterForm
RegisterFormSteps
end
subgraph Settings
NutritionGoalsForm
ProfileForm
end
end
subgraph Pages
AuthPage
HomePage
ReportingPage
SettingsPage
end
subgraph Store
app_state((app-state))
subgraph Slices
auth_slice((auth-slice))
macros_slice((macros-slice))
settings_slice((settings-slice))
ui_slice((ui-slice))
user_slice((user-slice))
end
end
subgraph Utils
activityLevels
api_service((api-service))
calculations
constants
error_handling((error-handling))
id_generator((id-generator))
validation
end

    App --> Pages
    App --> Components
    App --> Store
    Components --> Utils
    Pages --> Store
    Slices --> Utils
    api_service --> constants
    error_handling --> constants
