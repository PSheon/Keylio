"use client";

import { memo } from "react";
import { motion, type HTMLMotionProps } from "framer-motion";
import { fadeInUp, staggerContainer } from "@/lib/animations";
import { cn } from "@/lib/utils";

interface PageTransitionProps extends Omit<HTMLMotionProps<"div">, "variants" | "initial" | "animate"> {
  children: React.ReactNode;
  className?: string;
}

/**
 * 統一頁面過渡動畫容器
 * 所有頁面內容統一使用此元件包裝，提供一致的 stagger 入場動畫
 *
 * @example
 * ```tsx
 * <DashboardLayout>
 *   <PageTransition>
 *     <PageSection>
 *       <h1>頁面標題</h1>
 *     </PageSection>
 *     <PageSection>
 *       <Card>內容</Card>
 *     </PageSection>
 *   </PageTransition>
 * </DashboardLayout>
 * ```
 */
function PageTransitionComponent({ children, className, ...props }: PageTransitionProps) {
  return (
    <motion.div
      data-slot="page-transition"
      variants={staggerContainer}
      initial="initial"
      animate="animate"
      className={cn("space-y-6", className)}
      {...props}
    >
      {children}
    </motion.div>
  );
}

interface PageSectionProps extends Omit<HTMLMotionProps<"div">, "variants"> {
  children: React.ReactNode;
  className?: string;
}

/**
 * 頁面區塊動畫元件
 * 配合 PageTransition 使用，每個區塊會依序淡入
 *
 * @example
 * ```tsx
 * <PageSection>
 *   <h1>區塊標題</h1>
 *   <p>區塊內容</p>
 * </PageSection>
 * ```
 */
function PageSectionComponent({ children, className, ...props }: PageSectionProps) {
  return (
    <motion.div
      data-slot="page-section"
      variants={fadeInUp}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
}

/**
 * 頁面標題區塊
 * 統一的頁面標題樣式和動畫
 */
interface PageHeaderProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
}

function PageHeaderComponent({ title, description, action }: PageHeaderProps) {
  return (
    <motion.div data-slot="page-header" variants={fadeInUp} className="flex items-start justify-between">
      <div>
        <h1 className="text-2xl font-bold text-keylio-text-primary">{title}</h1>
        {description ? <p className="text-sm text-keylio-text-muted mt-1">{description}</p> : null}
      </div>
      {action}
    </motion.div>
  );
}

export const PageTransition = memo(PageTransitionComponent);
export const PageSection = memo(PageSectionComponent);
export const PageHeader = memo(PageHeaderComponent);
