"use client";

import { memo } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Shield, Lock, KeyRound } from "lucide-react";

interface PhilosophyScreenProps {
  onStart: () => void;
}

export const PhilosophyScreen = memo(function PhilosophyScreen({
  onStart,
}: PhilosophyScreenProps) {
  return (
    <div className="relative flex flex-col items-center justify-center min-h-screen bg-[#050505] text-white overflow-hidden px-6">
      {/* Background Effects */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-teal-500/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-purple-500/10 rounded-full blur-[120px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="relative z-10 max-w-md w-full text-center"
      >
        {/* Large Shield Icon */}
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ delay: 0.2, type: "spring", bounce: 0.5, duration: 1 }}
          className="relative w-32 h-32 mx-auto mb-10"
        >
          {/* Glow Effect */}
          <div className="absolute inset-0 bg-teal-500/20 rounded-full blur-2xl animate-pulse" />
          
          {/* Main Icon Container */}
          <div className="relative w-full h-full rounded-3xl bg-linear-to-br from-teal-400/20 to-teal-600/20 border border-teal-500/30 backdrop-blur-sm flex items-center justify-center">
            <Shield className="w-16 h-16 text-teal-400" strokeWidth={1.5} />
            
            {/* Floating Icons */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.8, duration: 0.5 }}
              className="absolute -left-4 top-1/4 w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center"
            >
              <Lock className="w-5 h-5 text-teal-300" />
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 1, duration: 0.5 }}
              className="absolute -right-4 bottom-1/4 w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center"
            >
              <KeyRound className="w-5 h-5 text-teal-300" />
            </motion.div>
          </div>
        </motion.div>

        {/* Title */}
        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.6 }}
          className="text-3xl md:text-4xl font-bold mb-6 tracking-tight bg-clip-text text-transparent bg-linear-to-r from-white via-teal-100 to-teal-300"
        >
          你的錢包，由你掌控
        </motion.h1>

        {/* Core Message */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.6 }}
          className="space-y-4 mb-12"
        >
          <p className="text-lg text-gray-300 leading-relaxed">
            我們不保管你的密碼。
          </p>
          <p className="text-lg text-gray-300 leading-relaxed">
            你的資金只有你能動用。
          </p>
        </motion.div>

        {/* Trust Badges */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8, duration: 0.6 }}
          className="flex justify-center gap-6 mb-12"
        >
          <TrustBadge icon="🔒" label="端對端加密" />
          <TrustBadge icon="🛡️" label="非託管錢包" />
          <TrustBadge icon="👆" label="生物辨識" />
        </motion.div>

        {/* CTA Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1, duration: 0.6 }}
        >
          <Button
            onClick={onStart}
            size="lg"
            className="w-full max-w-xs h-14 text-lg font-semibold bg-linear-to-r from-teal-500 to-teal-400 hover:from-teal-400 hover:to-teal-300 text-black rounded-2xl shadow-lg shadow-teal-500/25 transition-all hover:shadow-teal-500/40 hover:scale-[1.02]"
          >
            開始設定
          </Button>
          
          <p className="mt-4 text-xs text-gray-500">
            設定只需 1 分鐘
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
});

// Trust Badge Component
interface TrustBadgeProps {
  icon: string;
  label: string;
}

const TrustBadge = memo(function TrustBadge({ icon, label }: TrustBadgeProps) {
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-xl">
        {icon}
      </div>
      <span className="text-xs text-gray-500">{label}</span>
    </div>
  );
});
