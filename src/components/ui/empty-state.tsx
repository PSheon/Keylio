"use client";

import { memo, type ReactNode } from "react";
import { motion } from "framer-motion";
import { fadeInUp } from "@/lib/animations";
import { cn } from "@/lib/utils";

export interface EmptyStateProps {
  /** 圖示（emoji 或 ReactNode） */
  icon?: ReactNode;
  /** 主標題 */
  title: string;
  /** 描述文字 */
  description?: string;
  /** 操作按鈕 */
  action?: ReactNode;
  /** 額外的 className */
  className?: string;
  /** 尺寸變體 */
  size?: "sm" | "md" | "lg";
  /** 是否顯示動畫 */
  animated?: boolean;
}

const sizeStyles = {
  sm: {
    container: "py-6",
    icon: "text-3xl mb-2",
    title: "text-sm",
    description: "text-xs",
  },
  md: {
    container: "py-8",
    icon: "text-4xl mb-3",
    title: "text-base",
    description: "text-sm",
  },
  lg: {
    container: "py-12",
    icon: "text-5xl mb-4",
    title: "text-lg",
    description: "text-base",
  },
};

function EmptyStateComponent({
  icon,
  title,
  description,
  action,
  className,
  size = "md",
  animated = true,
}: EmptyStateProps) {
  const styles = sizeStyles[size];

  const content = (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center",
        styles.container,
        className
      )}
    >
      {icon ? <div className={cn("text-keylio-text-muted", styles.icon)}>
          {typeof icon === "string" ? <span>{icon}</span> : icon}
        </div> : null}
      <h3
        className={cn(
          "font-medium text-keylio-text-secondary",
          styles.title
        )}
      >
        {title}
      </h3>
      {description ? <p
          className={cn(
            "text-keylio-text-muted mt-1 max-w-xs",
            styles.description
          )}
        >
          {description}
        </p> : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );

  if (animated) {
    return (
      <motion.div
        variants={fadeInUp}
        initial="initial"
        animate="animate"
      >
        {content}
      </motion.div>
    );
  }

  return content;
}

export const EmptyState = memo(EmptyStateComponent);
