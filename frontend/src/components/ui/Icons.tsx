import { memo } from "react";
import {
  AlertCircle,
  Apple,
  ArrowLeft,
  ArrowRight,
  Award,
  BarChart,
  BarChart2,
  Beef,
  Book,
  Calendar,
  CalendarHeart,
  Check,
  CheckCircle,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  CircleQuestionMark,
  Clipboard,
  Coffee,
  Download,
  Droplet,
  Dumbbell,
  Edit,
  ExternalLink,
  Eye,
  EyeOff,
  Flame,
  Goal,
  Heart,
  Home,
  Info,
  Lightbulb,
  Link,
  Loader,
  Lock,
  LogOut,
  type LucideIcon,
  type LucideProps,
  Mail,
  Menu,
  Minus,
  Moon,
  MoreVertical,
  Plus,
  PlusCircle,
  Ruler,
  Scale as BalanceScale,
  Scale,
  Search,
  Settings,
  ShieldCheck,
  SmilePlus,
  Star,
  Sun,
  Target,
  Trash2,
  TrendingDown,
  TrendingUp,
  Unlock,
  User,
  X,
  Zap,
} from "lucide-react";

import { ICON_SIZES } from "../utils/Constants";

// Base icon type with common props
export interface IconProps extends Omit<LucideProps, "size"> {
  size?: "sm" | "md" | "lg" | "xl" | "2xl" | "3xl" | "4xl" | "5xl";
  className?: string;
  "aria-hidden"?: boolean | "true" | "false";
}

// HOC to apply consistent styling to all icons
function createIcon(Icon: LucideIcon) {
  return memo(function IconWrapper({
    className = "",
    size = "md",
    ...properties
  }: IconProps) {
    const sizeClass = ICON_SIZES[size] || ICON_SIZES.md;
    return <Icon className={`${sizeClass} ${className}`} {...properties} />;
  });
}

// Custom SVG icons for specific use cases
interface TrendIconProps {
  direction: string;
}

export function TrendIcon({ direction }: TrendIconProps) {
  const isUp = direction === "up";
  const color =
    direction === "stable"
      ? "text-foreground"
      : direction === "insufficient"
        ? "text-error"
        : isUp
          ? "text-foreground"
          : "text-foreground";

  if (direction === "stable" || direction === "insufficient") return;

  // Use Lucide TrendingUp/TrendingDown with dynamic styling
  const IconComponent = isUp ? TrendingUp : TrendingDown;

  return <IconComponent className={`h-4 w-4 ${color} mr-1`} />;
}

// Export all icon components
export const LightBulbIcon = createIcon(Lightbulb);
export const TrendingUpIcon = createIcon(TrendingUp);
export const TrendingDownIcon = createIcon(TrendingDown);
export const CalendarHeartIcon = createIcon(CalendarHeart);
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
export const PlusIcon = createIcon(Plus);
export const MinusIcon = createIcon(Minus);
export const EditIcon = createIcon(Edit);
export const TrashIcon = createIcon(Trash2);
export const SearchIcon = createIcon(Search);
export const LoadingSpinnerIcon = createIcon(Loader);
export const HomeIcon = createIcon(Home);
export const ReportingIcon2 = createIcon(BarChart2);
export const SettingsIcon = createIcon(Settings);
export const LogoutIcon = createIcon(LogOut);
export const ExportIcon = createIcon(Download);
export const WarningIcon = createIcon(AlertCircle);
export const PlusCircleIcon = createIcon(PlusCircle);
export const CalorieIcon = createIcon(Flame);
export const ArrowRightIcon = createIcon(ArrowRight);
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
export const DumbBellIcon = createIcon(Dumbbell);
export const AwardIcon = createIcon(Award);
export const HeartIcon = createIcon(Heart);
export const BookIcon = createIcon(Book);
export const CoffeeIcon = createIcon(Coffee);
export const DropletIcon = createIcon(Droplet);
export const MoonIcon = createIcon(Moon);
export const SunIcon = createIcon(Sun);
export const MoreVerticalIcon = createIcon(MoreVertical);
export const SmilePlusIcon = createIcon(SmilePlus);
export const BalanceIcon = createIcon(BalanceScale);
export const CircleCheckIcon = createIcon(CheckCircle);
export const CircleQuestionMarkIcon = createIcon(CircleQuestionMark);
export const LightningIcon = createIcon(Zap);
export const ClipboardIcon = createIcon(Clipboard);
export const NutrientIcon = createIcon(Apple);
export const ProteinIcon = createIcon(Beef);
export const LinkIcon = createIcon(Link);
export const ExternalLinkIcon = createIcon(ExternalLink);
export const ShieldCheckIcon = createIcon(ShieldCheck);

// Social Provider Icons
export function GoogleIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  );
}

export function GithubIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
    </svg>
  );
}

export function FacebookIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"
        fill="#1877F2"
      />
    </svg>
  );
}

export function AppleIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
    </svg>
  );
}
