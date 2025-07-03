import { memo } from "react";
import { ICON_SIZES } from "./utils/constants";
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
  Goal,
  Dumbbell,
  CheckCircle,
  Target,
  Award,
  Heart,
  Book,
  Coffee,
  Droplet,
  Moon,
  Sun,
  MoreVertical,
  SmilePlus,
  CalendarHeart,
  TrendingUp,
  TrendingDown,
  Lightbulb,
  Zap,
  CircleQuestionMark,
  Scale as BalanceScale,
  Clipboard,
  Apple,
  Beef,
  ExternalLink,
  type LucideIcon,
  type LucideProps,
} from "lucide-react";

// Base icon type with common props
interface IconProps extends Omit<LucideProps, "size"> {
  size?: "sm" | "md" | "lg";
}

// HOC to apply consistent styling to all icons
function createIcon(Icon: LucideIcon) {
  return memo(function IconWrapper({
    className = "",
    size = "md",
    ...props
  }: IconProps) {
    const sizeClass = ICON_SIZES[size] || ICON_SIZES.md;
    return <Icon className={`${sizeClass} ${className}`} {...props} />;
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
      ? "text-gray-400"
      : direction === "insufficient"
      ? "text-gray-500"
      : isUp
      ? "text-red-400"
      : "text-green-400";

  if (direction === "stable" || direction === "insufficient") return null;

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
export const XIcon = createIcon(X);
export const BalanceIcon = createIcon(BalanceScale);
export const CircleCheckIcon = createIcon(CheckCircle);
export const CircleQuestionMarkIcon = createIcon(CircleQuestionMark);
export const LightningIcon = createIcon(Zap);
export const ClipboardIcon = createIcon(Clipboard);
export const NutrientIcon = createIcon(Apple);
export const ProteinIcon = createIcon(Beef);
export const ExternalLinkIcon = createIcon(ExternalLink);
