"use client";

import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { generateMnemonic } from "@/lib/crypto";
import { useWalletStore } from "@/stores/useWalletStore";

interface WelcomeScreenProps {
  onComplete: () => void;
}

export function WelcomeScreen({ onComplete }: WelcomeScreenProps) {
  const mnemonicGenerated = useRef(false);

  useEffect(() => {
    // Generate mnemonic only once (avoid regenerating on re-mount)
    if (!mnemonicGenerated.current) {
      mnemonicGenerated.current = true;
      const mnemonic = generateMnemonic();
      useWalletStore.getState().setTempMnemonic(mnemonic);
    }

    // Always set up timer for transition
    const timer = setTimeout(onComplete, 3500);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div className="relative flex flex-col items-center justify-center min-h-screen bg-[#050505] text-white overflow-hidden">
      {/* Dynamic Background */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-teal-500/20 rounded-full blur-[120px] animate-pulse-slow" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-purple-500/20 rounded-full blur-[120px] animate-pulse-slow delay-1000" />
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-20" /> {/* Optional grid pattern if available, otherwise just gradients */}
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1, ease: "easeOut" }}
        className="relative z-10 text-center"
      >
        {/* Logo Animation */}
        <motion.div 
          className="relative w-32 h-32 mx-auto mb-8 flex items-center justify-center"
          initial={{ rotate: -180, opacity: 0 }}
          animate={{ rotate: 0, opacity: 1 }}
          transition={{ duration: 1.2, type: "spring", bounce: 0.5 }}
        >
          {/* Glow Effect */}
          <div className="absolute inset-0 bg-teal-500/30 rounded-full blur-xl animate-pulse" />
          
          <div className="relative w-full h-full rounded-2xl bg-linear-to-br from-teal-400 to-teal-600 flex items-center justify-center shadow-2xl shadow-teal-500/40 border border-teal-300/20 backdrop-blur-sm">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="w-16 h-16 text-white drop-shadow-md"
            >
              <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4" />
              <path d="M3 5v14a2 2 0 0 0 2 2h16v-5" />
              <path d="M18 12a2 2 0 0 0 0 4h4v-4Z" />
            </svg>
          </div>
        </motion.div>

        {/* Text Reveal */}
        <motion.h1 
          className="text-5xl md:text-6xl font-bold mb-4 tracking-tighter bg-clip-text text-transparent bg-linear-to-r from-white via-teal-200 to-teal-400"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.8 }}
        >
          Keylio
        </motion.h1>

        <motion.p 
          className="text-xl text-gray-400 mb-10 font-light tracking-wide"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8, duration: 0.8 }}
        >
          The Future of Digital Assets
        </motion.p>

        {/* Loading Indicator */}
        <motion.div
          initial={{ opacity: 0, width: 0 }}
          animate={{ opacity: 1, width: "100%" }}
          transition={{ delay: 1, duration: 2 }}
          className="h-0.5 bg-linear-to-r from-transparent via-teal-500 to-transparent w-48 mx-auto opacity-50"
        />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.5, duration: 0.5 }}
          className="mt-8 flex items-center justify-center gap-2 text-sm text-teal-400/80 font-medium border border-teal-500/20 rounded-full px-4 py-1.5 bg-teal-950/30 backdrop-blur-md"
        >
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-teal-500"></span>
          </span>
          Initializing Secure Environment...
        </motion.div>
      </motion.div>
    </div>
  );
}
