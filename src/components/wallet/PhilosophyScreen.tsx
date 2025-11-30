"use client";

import { memo, useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, Lock, KeyRound, CheckCircle2, Loader2, ExternalLink, Copy, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  detectBrowserEnvironment,
  openInExternalBrowser,
  copyToClipboard,
  getCurrentUrl,
  type BrowserInfo,
} from "@/lib/browser";
import { generateMnemonic } from "@/lib/crypto";
import { showSuccess, showInfo } from "@/lib/toast";
import { useWalletStore } from "@/stores/useWalletStore";

interface PhilosophyScreenProps {
  onStart: () => void;
}

export const PhilosophyScreen = memo(function PhilosophyScreen({
  onStart,
}: PhilosophyScreenProps) {
  const tempMnemonic = useWalletStore((state) => state.tempMnemonic);
  const setTempMnemonic = useWalletStore((state) => state.setTempMnemonic);

  // Check if mnemonic is already ready (from previous session or already generated)
  const [isMnemonicReady, setIsMnemonicReady] = useState(() => !!tempMnemonic);
  const [showStatus, setShowStatus] = useState(false);
  const [statusItems, setStatusItems] = useState([false, false, false]);

  // Browser environment detection
  const [browserInfo] = useState<BrowserInfo | null>(() => {
    // Initialize on client-side only
    if (typeof window !== "undefined") {
      return detectBrowserEnvironment();
    }
    return null;
  });
  const [showInAppWarning, setShowInAppWarning] = useState(false);

  // Show warning after a short delay if in-app browser
  useEffect(() => {
    if (browserInfo?.isInAppBrowser) {
      const timer = setTimeout(() => setShowInAppWarning(true), 500);
      return () => clearTimeout(timer);
    }
  }, [browserInfo?.isInAppBrowser]);

  // Generate mnemonic in background (only if not in in-app browser)
  useEffect(() => {
    if (tempMnemonic) return; // Already have mnemonic
    if (browserInfo?.isInAppBrowser) return; // Don't generate in in-app browser

    const timer = setTimeout(() => {
      const mnemonic = generateMnemonic();
      setTempMnemonic(mnemonic);
      setIsMnemonicReady(true);
    }, 800);
    return () => clearTimeout(timer);
  }, [tempMnemonic, setTempMnemonic, browserInfo?.isInAppBrowser]);

  // Animate status items sequentially (only if not in in-app browser)
  useEffect(() => {
    if (browserInfo?.isInAppBrowser) return;

    const timer1 = setTimeout(() => setShowStatus(true), 1200);
    const timer2 = setTimeout(() => setStatusItems(prev => [true, prev[1], prev[2]]), 1600);
    const timer3 = setTimeout(() => setStatusItems(prev => [prev[0], true, prev[2]]), 2000);
    const timer4 = setTimeout(() => setStatusItems(prev => [prev[0], prev[1], true]), 2400);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      clearTimeout(timer4);
    };
  }, [browserInfo?.isInAppBrowser]);

  // Handle opening external browser
  const handleOpenExternalBrowser = useCallback(() => {
    if (!browserInfo) return;

    const success = openInExternalBrowser(getCurrentUrl(), browserInfo);
    if (!success) {
      // If we can't auto-open, show the copy URL option
      showInfo("請手動複製連結", "在外部瀏覽器中貼上開啟");
    }
  }, [browserInfo]);

  // Handle copying URL
  const handleCopyUrl = useCallback(async () => {
    const url = getCurrentUrl();
    const success = await copyToClipboard(url);
    if (success) {
      showSuccess("已複製連結", `請在 ${browserInfo?.suggestedBrowser || "瀏覽器"} 中貼上開啟`);
    }
  }, [browserInfo?.suggestedBrowser]);

  const statusList = [
    { label: "安全環境已初始化", ready: statusItems[0] },
    { label: "加密引擎已就緒", ready: statusItems[1] },
    { label: "錢包金鑰已生成", ready: statusItems[2] && isMnemonicReady },
  ];

  const allReady = isMnemonicReady && statusItems.every(Boolean);
  const isInAppBrowser = browserInfo?.isInAppBrowser ?? false;

  // If in-app browser, show special UI
  if (isInAppBrowser && showInAppWarning) {
    return (
      <InAppBrowserWarning
        browserInfo={browserInfo!}
        onOpenExternal={handleOpenExternalBrowser}
        onCopyUrl={handleCopyUrl}
      />
    );
  }

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

        {/* Initialization Status - Fixed height container to prevent layout shift */}
        <div className="h-10 mb-8 flex items-center justify-center">
          <AnimatePresence>
            {showStatus ? <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex justify-center gap-3"
              >
                {statusList.map((item, index) => (
                  <motion.div
                    key={item.label}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.2 }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 border border-white/10"
                  >
                    {item.ready ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-teal-400" />
                    ) : (
                      <Loader2 className="w-3.5 h-3.5 text-gray-500 animate-spin" />
                    )}
                    <span className={`text-xs ${item.ready ? 'text-white' : 'text-gray-500'}`}>
                      {item.label}
                    </span>
                  </motion.div>
                ))}
              </motion.div> : null}
          </AnimatePresence>
        </div>

        {/* CTA Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: allReady ? 1 : 0.5, y: 0 }}
          transition={{ delay: 1, duration: 0.6 }}
        >
          <Button
            onClick={onStart}
            disabled={!allReady}
            size="lg"
            className="w-full max-w-xs h-14 text-lg font-semibold bg-linear-to-r from-teal-500 to-teal-400 hover:from-teal-400 hover:to-teal-300 text-black rounded-2xl shadow-lg shadow-teal-500/25 transition-all hover:shadow-teal-500/40 hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
          >
            {allReady ? "開始設定" : "準備中..."}
          </Button>

          <p className="mt-4 text-xs text-gray-500">
            {allReady ? "設定只需 1 分鐘" : "正在初始化安全環境..."}
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

// In-App Browser Warning Component
interface InAppBrowserWarningProps {
  browserInfo: BrowserInfo;
  onOpenExternal: () => void;
  onCopyUrl: () => void;
}

const InAppBrowserWarning = memo(function InAppBrowserWarning({
  browserInfo,
  onOpenExternal,
  onCopyUrl,
}: InAppBrowserWarningProps) {
  return (
    <div className="relative flex flex-col items-center justify-center min-h-screen bg-[#050505] text-white overflow-hidden px-6">
      {/* Background Effects */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-amber-500/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-orange-500/10 rounded-full blur-[120px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="relative z-10 max-w-md w-full text-center"
      >
        {/* Warning Icon */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.1, type: "spring", bounce: 0.5, duration: 0.8 }}
          className="relative w-24 h-24 mx-auto mb-8"
        >
          <div className="absolute inset-0 bg-amber-500/20 rounded-full blur-2xl animate-pulse" />
          <div className="relative w-full h-full rounded-2xl bg-linear-to-br from-amber-400/20 to-orange-500/20 border border-amber-500/30 backdrop-blur-sm flex items-center justify-center">
            <AlertTriangle className="w-12 h-12 text-amber-400" strokeWidth={1.5} />
          </div>
        </motion.div>

        {/* Title */}
        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="text-2xl md:text-3xl font-bold mb-4 tracking-tight"
        >
          請使用外部瀏覽器
        </motion.h1>

        {/* Explanation */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="space-y-3 mb-8"
        >
          <p className="text-base text-gray-300 leading-relaxed">
            偵測到您正在使用 <span className="text-amber-400 font-medium">{browserInfo.browserName}</span> 內建瀏覽器
          </p>
          <p className="text-sm text-gray-400 leading-relaxed">
            為了確保錢包安全性與生物辨識功能正常運作，
            <br />
            請使用 <span className="text-white font-medium">{browserInfo.suggestedBrowser}</span> 開啟此頁面
          </p>
        </motion.div>

        {/* Why Section */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="bg-white/5 border border-white/10 rounded-2xl p-4 mb-8"
        >
          <h3 className="text-sm font-medium text-gray-300 mb-3">為什麼需要外部瀏覽器？</h3>
          <div className="space-y-2 text-left">
            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-teal-400 mt-0.5 shrink-0" />
              <span className="text-xs text-gray-400">支援 Passkey 生物辨識登入</span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-teal-400 mt-0.5 shrink-0" />
              <span className="text-xs text-gray-400">更安全的加密金鑰儲存</span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-teal-400 mt-0.5 shrink-0" />
              <span className="text-xs text-gray-400">完整的錢包功能支援</span>
            </div>
          </div>
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.5 }}
          className="space-y-3"
        >
          <Button
            onClick={onOpenExternal}
            size="lg"
            className="w-full max-w-xs h-14 text-lg font-semibold bg-linear-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black rounded-2xl shadow-lg shadow-amber-500/25 transition-all hover:shadow-amber-500/40 hover:scale-[1.02]"
          >
            <ExternalLink className="w-5 h-5 mr-2" />
            打開外部瀏覽器
          </Button>

          <button
            onClick={onCopyUrl}
            className="flex items-center justify-center gap-2 mx-auto text-sm text-gray-400 hover:text-white transition-colors py-2"
          >
            <Copy className="w-4 h-4" />
            <span>複製連結手動貼上</span>
          </button>
        </motion.div>

        {/* Instructions */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.5 }}
          className="mt-8 pt-6 border-t border-white/10"
        >
          <p className="text-xs text-gray-500 mb-3">手動操作步驟：</p>
          <ol className="text-xs text-gray-500 text-left max-w-xs mx-auto space-y-1.5">
            <li className="flex items-start gap-2">
              <span className="bg-white/10 rounded-full w-5 h-5 flex items-center justify-center shrink-0 text-[10px]">1</span>
              <span>點擊右上角選單 (⋯ 或 ⋮)</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="bg-white/10 rounded-full w-5 h-5 flex items-center justify-center shrink-0 text-[10px]">2</span>
              <span>選擇「在 {browserInfo.suggestedBrowser} 中開啟」</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="bg-white/10 rounded-full w-5 h-5 flex items-center justify-center shrink-0 text-[10px]">3</span>
              <span>或複製連結後在 {browserInfo.suggestedBrowser} 中貼上</span>
            </li>
          </ol>
        </motion.div>
      </motion.div>
    </div>
  );
});
