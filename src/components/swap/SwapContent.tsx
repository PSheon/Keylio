"use client";

import { memo } from "react";
import { ArrowRightLeft } from "lucide-react";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { SwapDialog } from "@/components/transaction/SwapDialog";
import { PageTransition, PageSection, PageHeader } from "@/components/ui/page-transition";
import { DashboardLayout } from "@/components/wallet/DashboardLayout";

/**
 * 兌換頁面內容 - Client Component
 * Spec: USDT ↔ USDC 兌換
 */
function SwapContentComponent() {
  return (
    <AuthGuard>
      <DashboardLayout>
        <PageTransition>
        {/* Header */}
        <PageHeader
          title="兌換幣種"
          description="在穩定幣之間快速兌換，零手續費"
        />

        {/* Swap Card */}
        <PageSection className="bg-keylio-bg-secondary rounded-2xl border border-keylio-border-primary p-6">
        <div className="flex flex-col items-center justify-center py-8">
          <div className="w-16 h-16 rounded-full bg-purple-500/10 flex items-center justify-center mb-4">
            <ArrowRightLeft className="w-8 h-8 text-purple-400" />
          </div>
          <h2 className="text-lg font-semibold text-keylio-text-primary mb-2">
            穩定幣兌換
          </h2>
          <p className="text-sm text-keylio-text-muted text-center mb-6 max-w-xs">
            支援 USDT 與 USDC 之間的即時兌換，享受 Plasma 網路零手續費優勢
          </p>

          <SwapDialog
            trigger={
              <button className="px-8 py-3 bg-keylio-teal hover:bg-keylio-teal/90 text-white rounded-full font-medium transition-colors">
                開始兌換
              </button>
            }
          />
        </div>
        </PageSection>

        {/* Info Cards */}
        <PageSection className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-keylio-bg-secondary rounded-2xl border border-keylio-border-primary p-4">
          <h3 className="font-medium text-keylio-text-primary mb-2">💰 零手續費</h3>
          <p className="text-sm text-keylio-text-muted">
            Plasma 網路優化，穩定幣兌換無需支付任何手續費
          </p>
        </div>

        <div className="bg-keylio-bg-secondary rounded-2xl border border-keylio-border-primary p-4">
          <h3 className="font-medium text-keylio-text-primary mb-2">⚡ 即時確認</h3>
          <p className="text-sm text-keylio-text-muted">
            秒級交易確認，無需等待區塊確認
          </p>
        </div>
        </PageSection>
      </PageTransition>
    </DashboardLayout>
    </AuthGuard>
  );
}

export const SwapContent = memo(SwapContentComponent);
