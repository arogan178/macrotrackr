# Codebase Update Plan: Loading States & Error Handling

## 🚨 **Issues Found & Fixed**

### **1. Missing Files**

- ✅ **FIXED**: Restored `frontend/src/hooks/useMutationErrorHandler.ts` (was deleted)

### **2. Unstaged Changes**

- ⚠️ **NEEDS REVIEW**: `frontend/src/routeTree.gen.ts` - Auto-generated file, likely safe to commit
- ✅ **TRACKED**: New documentation files created

## 📋 **Components That Need Updates**

### **Priority 1: Settings Components (High Impact)**

#### **1. SettingsPage** (`frontend/src/features/settings/pages/SettingsPage.tsx`)

**Current State**: Partially updated, missing imports
**Needs**:

- ✅ Add missing imports for `useFeatureLoading` and `useMutationErrorHandler`
- ✅ Update error handling in `handleSubmit` function
- ✅ Replace manual loading states with feature loading

**Code Changes Needed**:

```tsx
// Add imports
import {
  useBeforeUnload,
  useFeatureLoading,
  useMutationErrorHandler,
} from "@/hooks";

// Add hooks
const { handleMutationError, handleMutationSuccess } = useMutationErrorHandler({
  onError: (message) => showNotification(message, "error"),
  onSuccess: (message) => showNotification(message, "success"),
});

// Update handleSubmit
try {
  await saveSettingsMutation.mutateAsync(payload);
  handleMutationSuccess("Settings saved successfully!");
} catch (error) {
  handleMutationError(error, "saving settings");
}
```

#### **2. BillingForm** (`frontend/src/features/settings/components/BillingForm.tsx`)

**Current State**: Partially updated
**Needs**:

- ✅ Update `handleManage` function error handling
- ✅ Add feature loading integration

#### **3. ChangePasswordForm** (`frontend/src/features/settings/components/ChangePasswordForm.tsx`)

**Current State**: Partially updated
**Needs**:

- ✅ Update password change error handling
- ✅ Add mutation error handler integration

### **Priority 2: Macro Tracking Components (High Impact)**

#### **4. HomePage** (`frontend/src/features/macroTracking/pages/HomePage.tsx`)

**Current State**: Partially updated
**Needs**:

- ✅ Add feature loading hooks
- ✅ Update mutation error handling for add/update/delete operations
- ✅ Replace manual loading states with feature loading

**Code Changes Needed**:

```tsx
// Add hooks
const { isLoading: isMacroFeatureLoading } = useFeatureLoading("macros");
const { handleMutationError, handleMutationSuccess } = useMutationErrorHandler({
  onError: (message) => console.error("Macro operation failed:", message),
  onSuccess: (message) => console.log("Macro operation succeeded:", message),
});

// Update Buttons
<Button
  autoLoadingFeature="macros"
  loadingText="Adding..."
  onClick={handleAddEntry}
>
  Add Entry
</Button>;
```

#### **5. AddEntryForm** (`frontend/src/features/macroTracking/components/AddEntryForm.tsx`)

**Current State**: Not updated
**Needs**:

- ✅ Add mutation error handling
- ✅ Update Button to use auto-loading

#### **6. EntryHistoryPanel** (`frontend/src/features/macroTracking/components/EntryHistoryPanel.tsx`)

**Current State**: Not updated
**Needs**:

- ✅ Update "Load More" button with auto-loading
- ✅ Add error handling for pagination

### **Priority 3: Goals & Habits Components (Medium Impact)**

#### **7. GoalsPage** (`frontend/src/features/goals/pages/GoalsPage.tsx`)

**Current State**: Not updated
**Needs**:

- ✅ Add feature loading for habits and goals
- ✅ Update all habit mutation error handling
- ✅ Update weight goal mutation error handling

**Code Changes Needed**:

```tsx
// Add hooks
const { isLoading: isHabitsLoading } = useFeatureLoading("habits");
const { isLoading: isGoalsLoading } = useFeatureLoading("goals");
const { handleMutationError, handleMutationSuccess } = useMutationErrorHandler({
  onError: (message) => showNotification(message, "error"),
  onSuccess: (message) => showNotification(message, "success"),
});

// Update habit operations
const handleAddHabit = async (values: HabitGoalFormValues) => {
  try {
    await addHabitMutation.mutateAsync(values);
    handleMutationSuccess("Habit added successfully!");
  } catch (error) {
    handleMutationError(error, "adding habit");
  }
};
```

#### **8. HabitTracker** (`frontend/src/features/habits/components/HabitTracker.tsx`)

**Current State**: Partially updated
**Needs**:

- ✅ Complete feature loading integration
- ✅ Update all habit action buttons with auto-loading

#### **9. WeightGoalDashboard** (`frontend/src/features/goals/components/WeightGoalDashboard.tsx`)

**Current State**: Not updated
**Needs**:

- ✅ Add feature loading for goals
- ✅ Update weight goal mutations

### **Priority 4: Auth Components (Medium Impact)**

#### **10. LoginForm** (`frontend/src/features/auth/components/LoginForm.tsx`)

**Current State**: Not updated
**Needs**:

- ✅ Add auth feature loading
- ✅ Update login mutation error handling

#### **11. RegisterForm** (`frontend/src/features/auth/components/RegisterForm.tsx`)

**Current State**: Not updated
**Needs**:

- ✅ Add auth feature loading
- ✅ Update registration mutation error handling

#### **12. ForgotPasswordForm** (`frontend/src/features/auth/components/ForgotPasswordForm.tsx`)

**Current State**: Not updated
**Needs**:

- ✅ Add mutation error handling

### **Priority 5: Other Components (Low Impact)**

#### **13. CalorieSearchForm** (`frontend/src/features/macroTracking/components/CalorieSearchForm.tsx`)

**Current State**: Not updated
**Needs**:

- ✅ Update search button loading state

#### **14. Various Form Components**

**Components**: ProfileForm, MacroTargetForm, etc.
**Needs**:

- ✅ Update Buttons to use auto-loading where appropriate

## 🎯 **Button Updates Needed**

### **Components Using Button That Need Auto-Loading**

1. **Settings Forms**:

   ```tsx
   <Button autoLoadingFeature="settings" loadingText="Saving...">
     Save Settings
   </Button>
   ```

2. **Macro Forms**:

   ```tsx
   <Button autoLoadingFeature="macros" loadingText="Adding...">
     Add Entry
   </Button>
   ```

3. **Habit Forms**:

   ```tsx
   <Button autoLoadingFeature="habits" loadingText="Adding...">
     Add Habit
   </Button>
   ```

4. **Auth Forms**:
   ```tsx
   <Button autoLoadingFeature="auth" loadingText="Signing in...">
     Sign In
   </Button>
   ```

## 🔧 **Implementation Strategy**

### **Phase 1: Fix Critical Issues (Immediate)**

1. ✅ Restore missing `useMutationErrorHandler.ts`
2. ✅ Fix SettingsPage imports and error handling
3. ✅ Update BillingForm and ChangePasswordForm

### **Phase 2: High-Impact Components (Next)**

1. ✅ Update HomePage with macro feature loading
2. ✅ Update GoalsPage with habits/goals feature loading
3. ✅ Update AddEntryForm and other macro components

### **Phase 3: Auth Components (Then)**

1. ✅ Update LoginForm and RegisterForm
2. ✅ Update ForgotPasswordForm and ResetPasswordForm

### **Phase 4: Polish & Optimization (Finally)**

1. ✅ Update remaining Buttons with auto-loading
2. ✅ Add QueryErrorBoundary where beneficial
3. ✅ Optimize loading states for better UX

## 📊 **Progress Tracking**

### **Completed** ✅

- [x] Created all loading state hooks
- [x] Created error handling hooks
- [x] Enhanced Button with auto-loading
- [x] Updated SettingsPage (partial)
- [x] Updated BillingForm (partial)
- [x] Updated ChangePasswordForm (partial)
- [x] Updated HabitTracker (partial)
- [x] Updated HomePage (partial)

### **In Progress** 🔄

- [ ] Complete SettingsPage updates
- [ ] Complete HomePage updates
- [ ] Complete GoalsPage updates

### **Not Started** ❌

- [ ] Auth components (LoginForm, RegisterForm, etc.)
- [ ] Remaining macro components
- [ ] Weight goal components
- [ ] Search and filter components

## 🚀 **Next Steps**

1. **Fix immediate issues** (missing imports, broken references)
2. **Complete high-impact components** (Settings, Macros, Goals)
3. **Update Buttons** throughout the app
4. **Add QueryErrorBoundary** where beneficial
5. **Test and validate** all changes

## 📝 **Notes**

- All changes are **backward compatible**
- Existing code will continue to work
- New patterns are **opt-in** improvements
- Focus on **high-impact, frequently-used** components first
- **Test thoroughly** after each phase
