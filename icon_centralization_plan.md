# Icon Centralization Plan

## Current Situation

Several components are importing Lucide icons directly, while we have a central `Icons.tsx` file that provides consistent styling and sizing through a HOC pattern.

## Files to Update

1. **Icons.tsx**

   - Add missing icons:
     - `Star` from lucide-react
   - Create and export:
     - `StarIcon = createIcon(Star)`

2. **Component Updates**

### AddEntryForm.tsx

- Remove: `import { Loader } from "lucide-react"`
- Add: `import { LoadingSpinnerIcon } from "./Icons"`
- Replace: `<Loader />` with `<LoadingSpinnerIcon />`

### SaveButton.tsx

- Remove: `import { Loader } from "lucide-react"`
- Add: `import { LoadingSpinnerIcon } from "./Icons"`
- Replace: `<Loader />` with `<LoadingSpinnerIcon />`

### ErrorBoundary.tsx

- Remove: `import { AlertTriangle } from "lucide-react"`
- Add: `import { WarningIcon } from "./Icons"`
- Replace: `<AlertTriangle />` with `<WarningIcon />`

### EmptyState.tsx

- Remove: `import { Plus } from "lucide-react"`
- Add: `import { PlusIcon } from "./Icons"`
- Replace: `<Plus />` with `<PlusIcon />`

### ConfirmationModal.tsx

- Remove: `import { AlertTriangle, Info } from "lucide-react"`
- Add: `import { WarningIcon, InfoIcon } from "./Icons"`
- Replace: `<AlertTriangle />` with `<WarningIcon />`
- Replace: `<Info />` with `<InfoIcon />`

### CardMetricsPanel.tsx

- Remove: `import { User, Star } from "lucide-react"`
- Add: `import { UserIcon, StarIcon } from "./Icons"`
- Replace: `<User />` with `<UserIcon />`
- Replace: `<Star />` with `<StarIcon />`

## Benefits

1. Consistent styling and sizing across all icons
2. Centralized management of icon imports
3. Type safety through IconProps interface
4. Reduced code duplication
5. Easier maintenance and updates

## Implementation Steps

1. Switch to Code mode
2. Update Icons.tsx to add missing icons
3. Update each component one at a time
4. Test each component after updates
5. Verify icon styling consistency

## Notes

- All icons will automatically get the size classes (sm, md, lg) through the HOC
- Class names and other props will be properly forwarded
- Components keep their existing icon styling through className props
