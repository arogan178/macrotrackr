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
import { memo } from "react";

import { ICON_SIZES } from "../utils/Constants";

// Base icon type with common props
interface IconProps extends Omit<LucideProps, "size"> {
  size?: "sm" | "md" | "lg" | "xl" | "2xl" | "3xl" | "4xl" | "5xl";
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
export const ExternalLinkIcon = createIcon(ExternalLink);
export const ShieldCheckIcon = createIcon(ShieldCheck);
