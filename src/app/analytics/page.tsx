"use client";

import { DashboardLayout } from "@/components/wallet/DashboardLayout";
import { SpendingAnalytics } from "@/components/analytics/SpendingAnalytics";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, PieChart as PieChartIcon, BarChart3, Sparkles } from "lucide-react";

export default function AnalyticsPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-keylio-text-primary">資產分析</h2>
          <p className="text-sm text-keylio-text-secondary mt-1">深入了解您的資產表現</p>
        </div>

        {/* Key Metrics */}
        <div className="grid md:grid-cols-3 gap-6">
          <Card className="bg-keylio-bg-secondary border-keylio-border-primary">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-keylio-text-secondary flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                總收益率
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-500">+12.5%</div>
              <p className="text-xs text-keylio-text-muted mt-1">過去 30 天</p>
            </CardContent>
          </Card>

          <Card className="bg-keylio-bg-secondary border-keylio-border-primary">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-keylio-text-secondary flex items-center gap-2">
                <PieChartIcon className="w-4 h-4" />
                資產多樣化
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-keylio-text-primary">4 種資產</div>
              <p className="text-xs text-keylio-text-muted mt-1">ETH/USDT/USDC/DAI</p>
            </CardContent>
          </Card>

          <Card className="bg-keylio-bg-secondary border-keylio-border-primary">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-keylio-text-secondary flex items-center gap-2">
                <BarChart3 className="w-4 h-4" />
                交易次數
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-keylio-text-primary">24 筆</div>
              <p className="text-xs text-keylio-text-muted mt-1">本月總交易</p>
            </CardContent>
          </Card>
        </div>

        {/* Spending Analytics */}
        <SpendingAnalytics />

        {/* Insights & Recommendations */}
        <Card className="bg-keylio-bg-secondary border-keylio-border-primary">
          <CardHeader>
            <CardTitle className="text-keylio-text-primary flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-yellow-400" />
              智能建議
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-start gap-3 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                <div className="text-blue-500 mt-1">💡</div>
                <div>
                  <div className="text-sm font-medium text-keylio-text-primary">優化支出分配</div>
                  <div className="text-xs text-keylio-text-secondary mt-1">
                    您的餐飲支出較上月增加 15%，建議設定每月預算提醒。
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                <div className="text-green-500 mt-1">✨</div>
                <div>
                  <div className="text-sm font-medium text-keylio-text-primary">節省成效顯著</div>
                  <div className="text-xs text-keylio-text-secondary mt-1">
                    使用 Plasma 鏈本月已節省 $45.32 手續費，繼續保持！
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 bg-purple-500/10 border border-purple-500/20 rounded-lg">
                <div className="text-purple-500 mt-1">🎯</div>
                <div>
                  <div className="text-sm font-medium text-keylio-text-primary">儲蓄目標</div>
                  <div className="text-xs text-keylio-text-secondary mt-1">
                    您的儲蓄率達 16.7%，超過建議的 15%，表現優秀！
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
