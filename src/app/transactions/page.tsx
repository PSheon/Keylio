"use client";

import { DashboardLayout } from "@/components/wallet/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowUpRight, ArrowDownRight, Clock } from "lucide-react";

// Mock transaction data
const mockTransactions = [
  {
    id: "1",
    type: "receive" as const,
    amount: "0.5",
    from: "0x742d...4e2A",
    to: "0x1234...5678",
    timestamp: Date.now() - 3600000,
    status: "confirmed" as const,
  },
  {
    id: "2",
    type: "send" as const,
    amount: "0.2",
    from: "0x1234...5678",
    to: "0x9abc...def0",
    timestamp: Date.now() - 7200000,
    status: "confirmed" as const,
  },
  {
    id: "3",
    type: "send" as const,
    amount: "0.1",
    from: "0x1234...5678",
    to: "0x5555...6666",
    timestamp: Date.now() - 86400000,
    status: "pending" as const,
  },
];

export default function TransactionsPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-keylio-text-primary">交易記錄</h2>
          <p className="text-sm text-keylio-text-secondary mt-1">查看您的所有交易歷史</p>
        </div>

        <Card className="bg-keylio-bg-secondary border-keylio-border-primary">
          <CardHeader>
            <CardTitle className="text-keylio-text-primary">最近交易</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {mockTransactions.map((tx) => (
                <div
                  key={tx.id}
                  className="flex items-center justify-between p-4 rounded-lg bg-keylio-bg-primary border border-keylio-border-primary hover:border-keylio-border-hover transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      tx.type === 'receive' 
                        ? 'bg-green-500/10' 
                        : 'bg-red-500/10'
                    }`}>
                      {tx.type === 'receive' ? (
                        <ArrowDownRight className="w-5 h-5 text-green-500" />
                      ) : (
                        <ArrowUpRight className="w-5 h-5 text-red-500" />
                      )}
                    </div>
                    <div>
                      <div className="font-medium text-keylio-text-primary">
                        {tx.type === 'receive' ? '接收' : '發送'}
                      </div>
                      <div className="text-sm text-keylio-text-secondary">
                        {tx.type === 'receive' ? `來自 ${tx.from}` : `發送至 ${tx.to}`}
                      </div>
                      <div className="text-xs text-keylio-text-muted flex items-center gap-1 mt-1">
                        <Clock className="w-3 h-3" />
                        {new Date(tx.timestamp).toLocaleString('zh-TW')}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`text-lg font-bold ${
                      tx.type === 'receive' ? 'text-green-500' : 'text-keylio-text-primary'
                    }`}>
                      {tx.type === 'receive' ? '+' : '-'}{tx.amount} ETH
                    </div>
                    <div className={`text-xs px-2 py-0.5 rounded-full inline-block ${
                      tx.status === 'confirmed'
                        ? 'bg-green-500/10 text-green-500'
                        : 'bg-yellow-500/10 text-yellow-500'
                    }`}>
                      {tx.status === 'confirmed' ? '已確認' : '處理中'}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {mockTransactions.length === 0 && (
              <div className="text-center py-12 text-keylio-text-secondary">
                <Clock className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>尚無交易記錄</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
