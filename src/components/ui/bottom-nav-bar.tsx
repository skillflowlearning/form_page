"use client";

import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export type NavItem = {
  label: string;
  icon: LucideIcon;
  id?: string;
};

const MOBILE_LABEL_WIDTH = 76;

type BottomNavBarProps = {
  className?: string;
  items: NavItem[];
  activeIndex: number;
  onChange: (index: number) => void;
  stickyBottom?: boolean;
};

export function BottomNavBar({
  className,
  items,
  activeIndex = 0,
  onChange,
  stickyBottom = false,
}: BottomNavBarProps) {
  return (
    <motion.nav
      initial={{ scale: 0.95, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: "spring", stiffness: 300, damping: 26 }}
      role="navigation"
      aria-label="Navigation Bar"
      className={cn(
        "bg-[#070d1a]/90 backdrop-blur-xl border border-white/[0.1] rounded-full flex items-center p-1.5 shadow-[0_10px_35px_rgba(0,0,0,0.5)] space-x-1 min-w-[280px] max-w-[95vw] h-[52px]",
        stickyBottom && "fixed inset-x-0 bottom-4 mx-auto z-40 w-fit",
        className,
      )}
    >
      {items.map((item, idx) => {
        const Icon = item.icon;
        const isActive = activeIndex === idx;

        return (
          <motion.button
            key={item.label}
            whileTap={{ scale: 0.95 }}
            className={cn(
              "flex items-center gap-0 px-3.5 py-2 rounded-full transition-all duration-200 relative h-9 min-w-[42px] cursor-pointer",
              isActive
                ? "bg-indigo-600/20 border border-indigo-500/30 text-indigo-400 gap-2 shadow-[0_0_15px_rgba(99,102,241,0.2)]"
                : "bg-transparent text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]",
              "focus:outline-none focus-visible:ring-0",
            )}
            onClick={() => onChange(idx)}
            aria-label={item.label}
            type="button"
          >
            <Icon
              size={18}
              strokeWidth={2}
              aria-hidden
              className="transition-colors duration-200 shrink-0"
            />

            <motion.div
              initial={false}
              animate={{
                width: isActive ? `${MOBILE_LABEL_WIDTH}px` : "0px",
                opacity: isActive ? 1 : 0,
                marginLeft: isActive ? "6px" : "0px",
              }}
              transition={{
                width: { type: "spring", stiffness: 350, damping: 32 },
                opacity: { duration: 0.18 },
                marginLeft: { duration: 0.18 },
              }}
              className={cn("overflow-hidden flex items-center max-w-[76px]")}
            >
              <span
                className={cn(
                  "font-bold text-xs whitespace-nowrap select-none overflow-hidden text-ellipsis font-['Space_Grotesk'] tracking-wider",
                  isActive ? "text-indigo-400" : "opacity-0",
                )}
                title={item.label}
              >
                {item.label}
              </span>
            </motion.div>
          </motion.button>
        );
      })}
    </motion.nav>
  );
}

export default BottomNavBar;
