"use client";

import { useState, memo } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowDownToLine, ArrowUpFromLine, Repeat } from "lucide-react";
import { SendDialog } from "@/components/transaction/SendDialog";
import { ReceiveDialog } from "@/components/transaction/ReceiveDialog";
import { buttonTap } from "@/lib/animations";

interface QuickActionsProps {
  address: string;
}

export function QuickActions({ address }: QuickActionsProps) {
  const [showSwapInfo, setShowSwapInfo] = useState(false);

  const handleSwap = () => {
    setShowSwapInfo(true);
    // TODO: Implement swap functionality or redirect to swap page
    setTimeout(() => setShowSwapInfo(false), 3000);
  };

  return (
    <div className="grid grid-cols-3 gap-3 w-full">
      {/* Receive Button */}
      <ReceiveDialog 
        address={address}
        trigger={
          <motion.div variants={buttonTap} whileTap="tap" className="min-h-11">
            <Button 
              className="h-auto min-h-11 py-6 flex-col gap-2 bg-keylio-teal hover:bg-keylio-teal/90 active:bg-keylio-teal/80 text-white shadow-lg shadow-keylio-teal/20 border-0 transition-all hover:scale-105 active:scale-95 w-full touch-manipulation"
            >
              <ArrowDownToLine className="w-6 h-6" />
              <span className="font-semibold text-base">收錢</span>
            </Button>
          </motion.div>
        }
      />

      {/* Send Button */}
      <SendDialog 
        fromAddress={address}
        trigger={
          <motion.div variants={buttonTap} whileTap="tap" className="min-h-11">
            <Button 
              className="h-auto min-h-11 py-6 flex-col gap-2 bg-keylio-teal hover:bg-keylio-teal/90 active:bg-keylio-teal/80 text-white shadow-lg shadow-keylio-teal/20 border-0 transition-all hover:scale-105 active:scale-95 w-full touch-manipulation"
            >
              <ArrowUpFromLine className="w-6 h-6" />
              <span className="font-semibold text-base">付錢</span>
            </Button>
          </motion.div>
        }
      />

      {/* Swap Button */}
      <motion.div variants={buttonTap} whileTap="tap" className="min-h-11">
        <Button 
          onClick={handleSwap}
          className="h-auto min-h-11 py-6 flex-col gap-2 bg-keylio-teal hover:bg-keylio-teal/90 active:bg-keylio-teal/80 text-white shadow-lg shadow-keylio-teal/20 border-0 transition-all hover:scale-105 active:scale-95 w-full touch-manipulation"
        >
          <Repeat className="w-6 h-6" />
          <span className="font-semibold text-base">交換</span>
        </Button>
      </motion.div>

      {/* Swap Info Toast (temporary) */}
      {showSwapInfo && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-keylio-bg-secondary border border-keylio-border-primary text-keylio-text-primary px-4 py-3 rounded-lg shadow-lg z-50 animate-in fade-in slide-in-from-bottom-2">
          <p className="text-sm">交換功能即將推出 🚀</p>
        </div>
      )}
    </div>
  );
}

export default memo(QuickActions);
