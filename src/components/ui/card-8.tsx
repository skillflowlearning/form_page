import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface AlertCardProps {
  className?: string;
  icon?: React.ReactNode;
  title: string;
  description: string;
  buttonText: string;
  onButtonClick: () => void;
  isVisible: boolean;
  onDismiss?: () => void;
}

const AlertCard = React.forwardRef<HTMLDivElement, AlertCardProps>(
  ({
    className,
    icon,
    title,
    description,
    buttonText,
    onButtonClick,
    isVisible,
    onDismiss,
  }, ref) => {
    
    const cardVariants: any = {
      hidden: { opacity: 0, y: 50, scale: 0.95 },
      visible: { 
        opacity: 1, 
        y: 0, 
        scale: 1,
        transition: { 
          type: "spring", 
          stiffness: 400, 
          damping: 25,
          staggerChildren: 0.1,
        }
      },
      exit: { 
        opacity: 0, 
        y: 20, 
        scale: 0.98,
        transition: { duration: 0.2 }
      }
    };

    const itemVariants = {
      hidden: { opacity: 0, y: 10 },
      visible: { opacity: 1, y: 0 },
    };

    return (
      <AnimatePresence>
        {isVisible && (
          <motion.div
            ref={ref}
            className={cn(
              "relative w-full max-w-sm overflow-hidden rounded-3xl p-6 md:p-7 shadow-2xl",
              "bg-gradient-to-br from-indigo-950/90 via-[#0b1022] to-[#040714] text-white border border-indigo-500/30 shadow-[0_15px_60px_rgba(99,102,241,0.25)]",
              className
            )}
            variants={cardVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            role="alert"
            aria-live="assertive"
          >
            {/* Optional dismiss button */}
            {onDismiss && (
              <motion.div variants={itemVariants} className="absolute top-3.5 right-3.5 z-10">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-full hover:bg-white/10 text-slate-400 hover:text-white"
                  onClick={onDismiss}
                >
                  <X className="h-4 w-4" />
                  <span className="sr-only">Dismiss</span>
                </Button>
              </motion.div>
            )}

            {/* Icon with subtle pulse animation */}
            {icon && (
               <motion.div
                variants={itemVariants}
                className="absolute top-6 right-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-500/15 border border-indigo-500/30 text-indigo-400 shadow-inner"
              >
                 <motion.div
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
                >
                    {icon}
                </motion.div>
              </motion.div>
            )}

            {/* Title */}
            <motion.h3 variants={itemVariants} className="text-2xl font-bold tracking-tight font-['Space_Grotesk'] text-white max-w-[75%] leading-tight">
              {title}
            </motion.h3>

            {/* Description */}
            <motion.p variants={itemVariants} className="mt-3 text-sm text-slate-300 max-w-[85%] leading-relaxed font-sans">
              {description}
            </motion.p>
            
            {/* Action Button */}
            <motion.div variants={itemVariants} className="mt-7">
              <Button
                className="w-full rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 py-6 text-base font-bold text-white shadow-lg shadow-indigo-600/30 transition-all duration-200 active:scale-95 cursor-pointer font-['Space_Grotesk'] tracking-wide"
                onClick={onButtonClick}
              >
                {buttonText}
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    );
  }
);
AlertCard.displayName = "AlertCard";

export { AlertCard };
export default AlertCard;
