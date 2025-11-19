"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { ArrowUpRight, ArrowDownRight, TrendingUp } from "lucide-react";
import { useWalletStore } from "@/stores/useWalletStore";
import { useMemo } from "react";
import { getAllTokens, formatTokenAmount, formatUSD, getTokenValueUSD } from "@/lib/tokens";
import { useMultiTokenBalance } from "@/hooks/useTokenBalance";

// Generate mock trend data for demonstration
const generate7DayTrend = (currentValue: number) => {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  return days.map((name, i) => ({
    name,
    value: currentValue * (0.9 + Math.random() * 0.2), // ±10% variation
  }));
};

export function AssetOverview() {
  const wallets = useWalletStore((state) => state.wallets);
  const activeWalletId = useWalletStore((state) => state.activeWalletId);
  
  // Get active wallet
  const activeWallet = wallets.find(w => w.id === activeWalletId);
  
  // Get all tokens
  const allTokens = useMemo(() => getAllTokens(), []);
  const tokenAddresses = useMemo(() => allTokens.map(t => t.address), [allTokens]);
  
  // Fetch balances for all tokens
  const { data: balances, isLoading, error } = useMultiTokenBalance(
    tokenAddresses,
    activeWallet?.address
  );
  
  // Calculate portfolio breakdown
  const { tokenBalances, totalValueUSD, allocationData, trendData } = useMemo(() => {
    const tokenBalances: Array<{
      symbol: string;
      name: string;
      balance: string;
      valueUSD: number;
      color: string;
      icon: string;
    }> = [];
    
    let totalValueUSD = 0;
    
    if (balances) {
      allTokens.forEach((token) => {
        const balance = balances[token.address];
        if (!balance) return;
        
        const formattedBalance = formatTokenAmount(balance, token.decimals);
        const valueUSD = getTokenValueUSD(formattedBalance, token.symbol);
        
        // Only show tokens with non-zero balance
        if (parseFloat(formattedBalance) > 0.0001) {
          tokenBalances.push({
            symbol: token.symbol,
            name: token.name,
            balance: formattedBalance,
            valueUSD,
            color: token.color,
            icon: token.icon,
          });
          
          totalValueUSD += valueUSD;
        }
      });
    }
    
    // Sort by value descending
    tokenBalances.sort((a, b) => b.valueUSD - a.valueUSD);
    
    // Create allocation data for pie chart
    const allocationData = tokenBalances.map(tb => ({
      name: tb.symbol,
      value: tb.valueUSD,
      color: tb.color,
    }));
    
    const trendData = generate7DayTrend(totalValueUSD);
    
    return {
      tokenBalances,
      totalValueUSD,
      allocationData,
      trendData,
    };
  }, [balances, allTokens]);
  
  // Calculate 24h change (mock)
  const change24h = useMemo(() => {
    if (trendData.length < 2) return 0;
    const today = trendData[trendData.length - 1].value;
    const yesterday = trendData[trendData.length - 2].value;
    return ((today - yesterday) / yesterday) * 100;
  }, [trendData]);

  return (
    <div className="grid lg:grid-cols-3 gap-6">
      {/* Total Portfolio Value & Trend */}
      <Card className="lg:col-span-2 bg-keylio-bg-secondary border-keylio-border-primary text-keylio-text-primary overflow-hidden">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-keylio-text-secondary">總資產估值</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-baseline gap-4 mb-6">
            {isLoading ? (
              <div className="h-10 w-48 bg-keylio-bg-tertiary animate-pulse rounded" />
            ) : error ? (
              <h2 className="text-2xl font-bold text-red-400">連接失敗</h2>
            ) : (
              <>
                <h2 className="text-4xl font-bold">{formatUSD(totalValueUSD)}</h2>
                <div className={`flex items-center gap-1 text-sm font-medium px-2 py-0.5 rounded ${
                  change24h >= 0 
                    ? 'text-green-400 bg-green-400/10' 
                    : 'text-red-400 bg-red-400/10'
                }`}>
                  {change24h >= 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                  <span>{change24h >= 0 ? '+' : ''}{change24h.toFixed(2)}% (24h)</span>
                </div>
              </>
            )}
          </div>

          <div className="h-[250px] w-full" style={{ minHeight: '250px' }}>
            <ResponsiveContainer width="100%" height="100%" minHeight={250}>
              <AreaChart data={trendData}>
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#14b8a6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--keylio-border-primary)" vertical={false} />
                <XAxis 
                  dataKey="name" 
                  stroke="var(--keylio-text-secondary)" 
                  fontSize={12} 
                  tickLine={false} 
                  axisLine={false} 
                />
                <YAxis 
                  stroke="var(--keylio-text-secondary)" 
                  fontSize={12} 
                  tickLine={false} 
                  axisLine={false} 
                  tickFormatter={(value) => `$${value.toFixed(0)}`}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'var(--keylio-bg-primary)', 
                    borderColor: 'var(--keylio-border-primary)', 
                    borderRadius: '8px',
                    color: 'var(--keylio-text-primary)'
                  }}
                  itemStyle={{ color: '#14b8a6' }}
                  formatter={(value: number) => [`$${value.toFixed(2)}`, '價值']}
                />
                <Area 
                  type="monotone" 
                  dataKey="value" 
                  stroke="#14b8a6" 
                  strokeWidth={2}
                  fillOpacity={1} 
                  fill="url(#colorValue)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Asset Allocation */}
      <Card className="bg-keylio-bg-secondary border-keylio-border-primary text-keylio-text-primary">
        <CardHeader>
          <CardTitle className="text-sm font-medium text-keylio-text-secondary">資產分佈</CardTitle>
        </CardHeader>
        <CardContent>
          {tokenBalances.length > 0 ? (
            <>
              <div className="h-[200px] w-full relative" style={{ minHeight: '200px' }}>
                <ResponsiveContainer width="100%" height="100%" minHeight={200}>
                  <PieChart>
                    <Pie
                      data={allocationData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                      stroke="none"
                    >
                      {allocationData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'var(--keylio-bg-primary)', 
                        borderColor: 'var(--keylio-border-primary)', 
                        borderRadius: '8px',
                        color: 'var(--keylio-text-primary)'
                      }}
                      formatter={(value: number) => formatUSD(value)}
                    />
                  </PieChart>
                </ResponsiveContainer>
                {/* Center Text */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="text-center">
                    <div className="text-xs text-keylio-text-secondary">資產</div>
                    <div className="text-xl font-bold">{tokenBalances.length}</div>
                  </div>
                </div>
              </div>

              <div className="mt-6 space-y-3">
                {tokenBalances.map((token) => (
                  <div key={token.symbol} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-xl" style={{ backgroundColor: token.color + '20' }}>
                        {token.icon}
                      </div>
                      <div>
                        <div className="font-medium text-keylio-text-primary">{token.symbol}</div>
                        <div className="text-xs text-keylio-text-muted">{parseFloat(token.balance).toFixed(4)}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">{formatUSD(token.valueUSD)}</div>
                      <div className="text-xs text-keylio-text-muted">
                        {((token.valueUSD / totalValueUSD) * 100).toFixed(1)}%
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="text-center py-12 text-keylio-text-secondary">
              <TrendingUp className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p className="text-sm">尚無資產</p>
              <p className="text-xs mt-1">領取測試代幣以開始使用</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
