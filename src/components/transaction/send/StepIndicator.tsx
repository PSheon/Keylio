"use client";

import { memo } from "react";
import { motion } from "framer-motion";
import { Progress } from "@/components/ui/progress";

interface StepIndicatorProps {
  currentStep: number;
  totalSteps: number;
  /** 步驟名稱陣列，例如: ['收款人', '金額', '確認'] */
  stepLabels?: string[];
}

const DEFAULT_LABELS = ['收款人', '金額', '確認'];

/**
 * 步驟進度指示器
 * 進度條 + 步驟文字設計
 */
function StepIndicatorComponent({ 
  currentStep, 
  totalSteps, 
  stepLabels = DEFAULT_LABELS 
}: StepIndicatorProps) {
  // 進度百分比: 第一步 33%, 第二步 66%, 第三步 100%
  const progressValue = ((currentStep + 1) / totalSteps) * 100;

  return (
    <div className="space-y-2 pt-1">
      {/* 進度條 */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.2 }}
      >
        <Progress 
          value={progressValue} 
          className="h-1.5 bg-keylio-bg-tertiary *:data-[slot=progress-indicator]:bg-keylio-teal"
        />
      </motion.div>

      {/* 步驟標籤 */}
      <div className="flex justify-between text-xs">
        {stepLabels.map((label, index) => (
          <motion.span
            key={label}
            initial={false}
            animate={{
              color: index <= currentStep 
                ? "rgb(20 184 166)" // teal
                : "rgb(156 163 175)" // gray-400
            }}
            className={`font-medium ${index === currentStep ? 'text-keylio-teal' : 'text-keylio-text-muted'}`}
          >
            {index === currentStep ? `${index + 1}. ${label}` : label}
          </motion.span>
        ))}
      </div>
    </div>
  );
}

export const StepIndicator = memo(StepIndicatorComponent);
