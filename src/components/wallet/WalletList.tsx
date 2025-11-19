"use client";

import { Button } from "@/components/ui/button";
import { useWalletStore } from "@/stores/useWalletStore";
import { CreateWalletDialog } from "./CreateWalletDialog";
import { Copy, Send, ArrowDownLeft, MoreVertical } from "lucide-react";
import { toast } from "sonner";
import { SendDialog } from "@/components/transaction/SendDialog";
import { ReceiveDialog } from "@/components/transaction/ReceiveDialog";

export function WalletList() {
  const wallets = useWalletStore((state) => state.wallets);
  const activeWalletId = useWalletStore((state) => state.activeWalletId);
  const setActiveWallet = useWalletStore((state) => state.setActiveWallet);

  const handleCopyAddress = (address: string) => {
    navigator.clipboard.writeText(address);
    toast.success("地址已複製");
  };

  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
      {wallets.map((wallet) => (
        <div 
          key={wallet.id} 
          onClick={() => setActiveWallet(wallet.id!)}
          className={`
            relative p-6 rounded-xl border transition-all cursor-pointer group
            ${activeWalletId === wallet.id 
              ? "bg-keylio-bg-secondary border-keylio-teal/50 shadow-[0_0_20px_rgba(20,184,166,0.1)]" 
              : "bg-keylio-bg-secondary border-keylio-border-primary hover:border-keylio-teal/30"
            }
          `}
        >
          <div className="flex justify-between items-start mb-4">
            <div className="flex items-center gap-3">
              <div 
                className="w-12 h-12 rounded-full flex items-center justify-center text-2xl bg-opacity-10"
                style={{ backgroundColor: `${wallet.color}20` }}
              >
                {wallet.emoji}
              </div>
              <div>
                <h3 className="font-medium text-keylio-text-primary">{wallet.name}</h3>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCopyAddress(wallet.address);
                  }}
                  className="flex items-center gap-1 text-xs text-keylio-text-secondary hover:text-keylio-teal transition-colors font-mono"
                >
                  {wallet.address.slice(0, 6)}...{wallet.address.slice(-4)}
                  <Copy size={10} />
                </button>
              </div>
            </div>
            {activeWalletId === wallet.id && (
              <span className="px-2 py-1 rounded text-[10px] font-medium bg-teal-500/10 text-teal-400 border border-teal-500/20">
                Active
              </span>
            )}
          </div>

          <div className="mb-6">
            <div className="text-2xl font-bold text-keylio-text-primary">$0.00</div>
            <div className="text-xs text-keylio-text-muted">0 USDT</div>
          </div>

          <div className="flex gap-2 opacity-80 group-hover:opacity-100 transition-opacity">
            <SendDialog 
              fromAddress={wallet.address}
              trigger={
                <Button 
                  size="sm" 
                  className="flex-1 bg-teal-600 hover:bg-teal-700 h-8 text-xs"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Send size={12} className="mr-1.5" />
                  Send
                </Button>
              }
            />
            <ReceiveDialog 
              address={wallet.address}
              trigger={
                <Button 
                  size="sm" 
                  variant="secondary" 
                  className="flex-1 h-8 text-xs bg-keylio-bg-tertiary hover:bg-keylio-bg-tertiary/80 text-keylio-text-primary border border-keylio-border-primary"
                  onClick={(e) => e.stopPropagation()}
                >
                  <ArrowDownLeft size={12} className="mr-1.5" />
                  Receive
                </Button>
              }
            />
          </div>
        </div>
      ))}

      {/* Create New Wallet Card */}
      <CreateWalletDialog 
        trigger={
          <div className="bg-keylio-bg-secondary/30 border border-dashed border-keylio-border-primary p-6 rounded-xl flex flex-col items-center justify-center text-keylio-text-secondary hover:text-keylio-text-primary hover:border-keylio-teal/50 hover:bg-keylio-bg-secondary/50 transition-all cursor-pointer min-h-[200px] group">
            <div className="w-12 h-12 rounded-full bg-keylio-bg-tertiary flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <span className="text-2xl text-keylio-text-secondary group-hover:text-keylio-text-primary">+</span>
            </div>
            <span className="font-medium">創建新錢包</span>
            <span className="text-xs text-keylio-text-muted mt-1">添加新的子帳戶</span>
          </div>
        }
      />
    </div>
  );
}
