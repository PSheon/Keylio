"use client";

import { memo } from "react";
import { motion } from "framer-motion";

/**
 * 全局載入遮罩
 * 在頁面切換時顯示，提供視覺回饋
 */
function GlobalLoadingOverlayComponent() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
      className="fixed inset-0 z-100 bg-keylio-bg-primary/60 backdrop-blur-sm flex items-center justify-center"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.2, delay: 0.1 }}
        className="flex flex-col items-center"
      >
        {/* Logo */}
        <div className="relative w-14 h-14 mb-4">
          {/* 外層光暈 */}
          <motion.div
            className="absolute inset-0 bg-teal-500/30 rounded-xl blur-lg"
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.3, 0.5, 0.3],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />

          {/* Logo 主體 */}
          <motion.div
            className="relative w-full h-full rounded-xl bg-linear-to-br from-teal-400 to-teal-600 flex items-center justify-center shadow-lg shadow-teal-500/30"
            animate={{ scale: [1, 1.05, 1] }}
            transition={{
              duration: 1,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="w-7 h-7 text-white"
            >
              <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4" />
              <path d="M3 5v14a2 2 0 0 0 2 2h16v-5" />
              <path d="M18 12a2 2 0 0 0 0 4h4v-4Z" />
            </svg>
          </motion.div>
        </div>

        {/* 進度條 */}
        <div className="w-24 h-1 bg-white/10 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-linear-to-r from-teal-500 to-teal-300 rounded-full"
            initial={{ x: "-100%" }}
            animate={{ x: "100%" }}
            transition={{
              duration: 0.8,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        </div>
      </motion.div>
    </motion.div>
  );
}

export const GlobalLoadingOverlay = memo(GlobalLoadingOverlayComponent);
