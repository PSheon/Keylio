"use client";

import { memo } from "react";
import { motion } from "framer-motion";

/**
 * 全螢幕載入畫面
 * 顯示品牌 Logo 和載入動畫
 */
function LoadingScreenComponent() {
  return (
    <div className="relative flex flex-col items-center justify-center min-h-screen bg-[#050505] overflow-hidden">
      {/* 背景漸層光暈 - 與 WelcomeScreen 一致 */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-teal-500/15 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-purple-500/15 rounded-full blur-[120px] animate-pulse [animation-delay:1s]" />
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="relative z-10 flex flex-col items-center"
      >
        {/* Logo 容器 */}
        <div className="relative w-20 h-20 mb-6">
          {/* 外層光暈呼吸 */}
          <motion.div
            className="absolute inset-0 bg-teal-500/30 rounded-2xl blur-xl"
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.3, 0.5, 0.3],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />

          {/* Logo 主體 - 脈衝縮放 */}
          <motion.div
            className="relative w-full h-full rounded-2xl bg-linear-to-br from-teal-400 to-teal-600 flex items-center justify-center shadow-2xl shadow-teal-500/40 border border-teal-300/20"
            animate={{
              scale: [1, 1.05, 1],
            }}
            transition={{
              duration: 1.5,
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
              className="w-10 h-10 text-white drop-shadow-md"
            >
              <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4" />
              <path d="M3 5v14a2 2 0 0 0 2 2h16v-5" />
              <path d="M18 12a2 2 0 0 0 0 4h4v-4Z" />
            </svg>
          </motion.div>
        </div>

        {/* 品牌名稱 */}
        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="text-2xl font-bold mb-6 tracking-tight bg-clip-text text-transparent bg-linear-to-r from-white via-teal-200 to-teal-400"
        >
          Keylio
        </motion.h1>

        {/* 進度指示條 */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.4 }}
          className="w-48 h-1 bg-white/10 rounded-full overflow-hidden"
        >
          <motion.div
            className="h-full bg-linear-to-r from-teal-500 to-teal-300 rounded-full"
            initial={{ x: "-100%" }}
            animate={{ x: "100%" }}
            transition={{
              duration: 1.2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        </motion.div>

        {/* 狀態文字 */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.4 }}
          className="mt-4 text-sm text-gray-500"
        >
          正在載入安全環境...
        </motion.p>
      </motion.div>
    </div>
  );
}

export const LoadingScreen = memo(LoadingScreenComponent);
