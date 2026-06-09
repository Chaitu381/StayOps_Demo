import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";

type StatVariant =
  | "owners"
  | "pgs"
  | "active"
  | "inactive"
  | "primary"
  | "secondary"
  | "warning"
  | "default"
  | "filled"
  | "vacant"
  | "paid"
  | "unpaid";

interface StatCardProps {
  icon?: LucideIcon;
  label: string;
  value: string | number;
  subtext?: string;
  progress?: number;
  variant?: StatVariant;
  compact?: boolean;
  onClick?: () => void;
}

const variantStyles: Record<
  StatVariant,
  {
    card: string;
    iconWrap: string;
    bar: string;
    text: string;
    label: string;
  }
> = {
  owners: {
    card: "bg-sky-50 border-sky-200",
    iconWrap: "bg-sky-100 text-sky-700",
    bar: "bg-sky-500",
    text: "text-sky-950",
    label: "text-sky-600",
  },
  pgs: {
    card: "bg-indigo-50 border-indigo-200",
    iconWrap: "bg-indigo-100 text-indigo-700",
    bar: "bg-indigo-500",
    text: "text-indigo-950",
    label: "text-indigo-600",
  },
  active: {
    card: "bg-emerald-50 border-emerald-200",
    iconWrap: "bg-emerald-100 text-emerald-700",
    bar: "bg-emerald-500",
    text: "text-emerald-950",
    label: "text-emerald-600",
  },
  inactive: {
    card: "bg-rose-50 border-rose-200",
    iconWrap: "bg-rose-100 text-rose-700",
    bar: "bg-rose-500",
    text: "text-rose-950",
    label: "text-rose-600",
  },
  primary: {
    card: "bg-blue-50 border-blue-200",
    iconWrap: "bg-blue-100 text-blue-700",
    bar: "bg-blue-500",
    text: "text-blue-950",
    label: "text-blue-600",
  },
  secondary: {
    card: "bg-cyan-50 border-cyan-200",
    iconWrap: "bg-cyan-100 text-cyan-700",
    bar: "bg-cyan-500",
    text: "text-cyan-950",
    label: "text-cyan-600",
  },
  warning: {
    card: "bg-amber-50 border-amber-200",
    iconWrap: "bg-amber-100 text-amber-700",
    bar: "bg-amber-500",
    text: "text-amber-950",
    label: "text-amber-600",
  },
  default: {
    card: "bg-slate-50 border-slate-200",
    iconWrap: "bg-slate-100 text-slate-600",
    bar: "bg-slate-400",
    text: "text-slate-950",
    label: "text-slate-500",
  },
  filled: {
    card: "bg-teal-50 border-teal-200",
    iconWrap: "bg-teal-100 text-teal-700",
    bar: "bg-teal-500",
    text: "text-teal-950",
    label: "text-teal-600",
  },
  vacant: {
    card: "bg-violet-50 border-violet-200",
    iconWrap: "bg-violet-100 text-violet-700",
    bar: "bg-violet-500",
    text: "text-violet-950",
    label: "text-violet-600",
  },
  paid: {
    card: "bg-green-50 border-green-200",
    iconWrap: "bg-green-100 text-green-700",
    bar: "bg-green-500",
    text: "text-green-950",
    label: "text-green-600",
  },
  unpaid: {
    card: "bg-red-50 border-red-200",
    iconWrap: "bg-red-100 text-red-700",
    bar: "bg-red-500",
    text: "text-red-950",
    label: "text-red-600",
  },
};

export default function StatCard({
  icon: Icon,
  label,
  value,
  subtext,
  progress,
  variant = "default",
  compact = false,
  onClick,
}: StatCardProps) {
  const styles = variantStyles[variant];

  return (
    <motion.div
      whileHover={{ scale: 1.01, y: -1 }}
      whileTap={onClick ? { scale: 0.98 } : undefined}
      onClick={onClick}
      className={`rounded-lg border shadow-sm transition-shadow hover:shadow-md ${
        styles.card
      } ${onClick ? "cursor-pointer" : ""} ${
        compact ? "min-w-[76px] px-2.5 py-1.5" : "p-4"
      }`}
    >
      <div className={`flex items-center ${compact ? "gap-1.5" : "gap-3"}`}>
        {Icon && (
          <div
            className={`flex shrink-0 items-center justify-center ${
              compact ? "h-6 w-6 rounded-md" : "h-10 w-10 rounded-lg"
            } ${styles.iconWrap}`}
          >
            <Icon className={compact ? "h-3.5 w-3.5" : "h-5 w-5"} />
          </div>
        )}

        <div className="min-w-0">
          <p
            className={`font-semibold uppercase tracking-wide ${
              compact ? "text-[9px]" : "text-xs"
            } ${styles.label}`}
          >
            {label}
          </p>

          <p
            className={`font-black leading-none ${
              compact ? "text-base" : "text-2xl"
            } ${styles.text}`}
          >
            {value}
          </p>

          {subtext && (
            <p
              className={`mt-0.5 text-slate-500 ${
                compact ? "text-[9px]" : "text-xs"
              }`}
            >
              {subtext}
            </p>
          )}
        </div>
      </div>

      {progress !== undefined && (
        <div
          className={`w-full overflow-hidden rounded-full bg-white/70 ${
            compact ? "mt-1.5 h-1" : "mt-3 h-2"
          }`}
        >
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className={`h-full rounded-full ${styles.bar}`}
          />
        </div>
      )}
    </motion.div>
  );
}