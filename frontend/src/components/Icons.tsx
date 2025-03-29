import { memo } from "react";
import {
  User,
  Mail,
  Lock,
  Calendar,
  Ruler,
  Scale,
  Info,
  ArrowRight,
  ArrowLeft,
  Check,
  X,
  Eye,
  EyeOff,
  Plus,
  Minus,
  Edit,
  Trash2,
  Search,
  Loader,
  Home,
  BarChart,
  BarChart2,
  Settings,
  LogOut,
  Download,
  AlertCircle,
  PlusCircle,
  Flame,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  Unlock,
  Menu,
  Star,
  Target,
  Goal,
  CheckCircle,
  type LucideIcon,
  type LucideProps,
} from "lucide-react";

// Base icon type with common props
interface IconProps extends Omit<LucideProps, "size"> {
  size?: "sm" | "md" | "lg";
}

// Size mappings for consistent icon sizing
const sizeClasses = {
  sm: "w-4 h-4",
  md: "w-5 h-5",
  lg: "w-6 h-6",
};

// HOC to apply consistent styling to all icons
function createIcon(Icon: LucideIcon) {
  return memo(function IconWrapper({
    className = "",
    size = "md",
    ...props
  }: IconProps) {
    const sizeClass = sizeClasses[size] || sizeClasses.md;
    return <Icon className={`${sizeClass} ${className}`} {...props} />;
  });
}

// Export all icon components
export const UserIcon = createIcon(User);
export const EmailIcon = createIcon(Mail);
export const PasswordIcon = createIcon(Lock);
export const CalendarIcon = createIcon(Calendar);
export const HeightIcon = createIcon(Ruler);
export const WeightIcon = createIcon(Scale);
export const InfoIcon = createIcon(Info);
export const ForwardIcon = createIcon(ArrowRight);
export const BackIcon = createIcon(ArrowLeft);
export const CheckIcon = createIcon(Check);
export const CloseIcon = createIcon(X);
export const EyeIcon = createIcon(Eye);
export const EyeSlashIcon = createIcon(EyeOff);
export const CheckMarkIcon = createIcon(Check);
export const PlusIcon = createIcon(Plus);
export const MinusIcon = createIcon(Minus);
export const EditIcon = createIcon(Edit);
export const TrashIcon = createIcon(Trash2);
export const SearchIcon = createIcon(Search);
export const LoadingSpinnerIcon = createIcon(Loader);
export const HomeIcon = createIcon(Home);
export const ReportingIcon = createIcon(BarChart);
export const ReportingIcon2 = createIcon(BarChart2);
export const SettingsIcon = createIcon(Settings);
export const LogoutIcon = createIcon(LogOut);
export const ExportIcon = createIcon(Download);
export const WarningIcon = createIcon(AlertCircle);
export const PlusCircleIcon = createIcon(PlusCircle);
export const CalorieIcon = createIcon(Flame);
export const ArrowRightIcon = createIcon(ArrowRight);
export const DownloadIcon = createIcon(Download);
export const ChevronDownIcon = createIcon(ChevronDown);
export const ChevronUpIcon = createIcon(ChevronUp);
export const ChevronLeftIcon = createIcon(ChevronLeft);
export const ChevronRightIcon = createIcon(ChevronRight);
export const LockIcon = createIcon(Lock);
export const UnlockIcon = createIcon(Unlock);
export const MenuIcon = createIcon(Menu);
export const StarIcon = createIcon(Star);
export const GoalsIcon = createIcon(Goal);
export const TargetIcon = createIcon(Target);
export const BarChartIcon = createIcon(BarChart);
export const CheckCircleIcon = createIcon(CheckCircle);
