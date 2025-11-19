"use client";

import { ArrowUpRight, ArrowDownLeft, Clock } from "lucide-react";

// Mock Data
const transactions = [
  { id: 1, type: 'send', amount: '100.00', to: '0x1234...5678', date: '2025-11-19 14:30', status: 'confirmed' },
  { id: 2, type: 'receive', amount: '500.00', from: '0x8765...4321', date: '2025-11-18 09:15', status: 'confirmed' },
  { id: 3, type: 'send', amount: '50.00', to: '0xabcd...efgh', date: '2025-11-17 18:20', status: 'confirmed' },
];

export function TransactionHistory() {
  return (
    <div className="bg-keylio-bg-secondary rounded-xl border border-keylio-border-primary overflow-hidden">
      <div className="p-4 border-b border-keylio-border-primary flex justify-between items-center">
        <h3 className="font-semibold text-keylio-text-primary">近期交易</h3>
        <button className="text-xs text-keylio-teal hover:text-keylio-teal/80">查看全部</button>
      </div>
      <div className="divide-y divide-keylio-border-primary">
        {transactions.map((tx) => (
          <div key={tx.id} className="p-4 flex items-center justify-between hover:bg-keylio-bg-tertiary/50 transition-colors">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                tx.type === 'receive' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'
              }`}>
                {tx.type === 'receive' ? <ArrowDownLeft size={20} /> : <ArrowUpRight size={20} />}
              </div>
              <div>
                <div className="font-medium text-keylio-text-primary">
                  {tx.type === 'receive' ? '收到 USDT' : '發送 USDT'}
                </div>
                <div className="text-xs text-keylio-text-secondary flex items-center gap-1">
                  <Clock size={10} />
                  {tx.date}
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className={`font-bold ${
                tx.type === 'receive' ? 'text-green-400' : 'text-keylio-text-primary'
              }`}>
                {tx.type === 'receive' ? '+' : '-'}{tx.amount} USDT
              </div>
              <div className="text-xs text-keylio-text-muted">
                {tx.status}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
