"use client";

import { Loader2 } from "lucide-react";
import { ReactNode } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils/cn";

type ButtonVariant = "primary" | "secondary" | "danger";

interface GradientButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: ButtonVariant;
  loading?: boolean;
  icon?: ReactNode;
}

type CleanButtonProps = Omit<
  GradientButtonProps,
  "onDrag" | "onDragStart" | "onDragEnd" | "onAnimationStart" | "onAnimationEnd"
>;

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    "bg-gradient-to-r from-violet-600 via-indigo-600 to-blue-500 text-white shadow-[0_8px_32px_rgba(108,99,255,0.35)]",
  secondary: "border border-white/30 bg-white/5 text-white",
  danger: "bg-red-500/80 text-white",
};

export function GradientButton({
  children,
  className,
  variant = "primary",
  loading,
  icon,
  ...props
}: CleanButtonProps) {
  return (
    <motion.button
      whileTap={{ scale: 0.97 }}
      whileHover={{ y: -1 }}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold",
        "transition-all duration-300 ease-out disabled:cursor-not-allowed disabled:opacity-60",
        variantStyles[variant],
        className,
      )}
      disabled={loading || props.disabled}
      {...props}
    >
      {loading ? <Loader2 className="size-4 animate-spin" /> : icon}
      {children}
    </motion.button>
  );
}
