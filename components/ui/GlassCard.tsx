"use client";

import { motion } from "framer-motion";
import { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  glowColor?: string;
  hover?: boolean;
}

export function GlassCard({ children, className, glowColor, hover = true }: GlassCardProps) {
  return (
    <motion.div
      whileHover={hover ? { y: -4 } : undefined}
      className={cn(
        "rounded-2xl border border-white/20 bg-white/10 p-5 backdrop-blur-xl",
        "shadow-[0_8px_32px_rgba(108,99,255,0.25)] transition-all duration-300 ease-out",
        hover && "hover:-translate-y-1 hover:shadow-[0_16px_40px_rgba(108,99,255,0.35)]",
        className,
      )}
      style={glowColor ? { boxShadow: `0 8px 32px ${glowColor}` } : undefined}
    >
      {children}
    </motion.div>
  );
}
