"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";
import { TrendingDown, TrendingUp, DollarSign } from "lucide-react";

// Mock data - in production, fetch from database
const mockSpendingByCategory = [
  { name: "餐飲", value: 450, color: "#14b8a6" },
  { name: "交通", value: 200, color: "#3b82f6" },
  { name: "娛樂", value: 150, color: "#8b5cf6" },
  { name: "購物", value: 300, color: "#ec4899" },
  { name: "其他", value: 100, color: "#f59e0b" },
];

const mockMonthlyTrend = [
  { month: "1月", spending: 800, income: 1200 },
  { month: "2月", spending: 950, income: 1200 },
  { month: "3月", spending: 1100, income: 1200 },
  { month: "4月", spending: 1200, income: 1400 },
];

export function SpendingAnalytics() {
  const totalSpending = mockSpendingByCategory.reduce((sum, cat) => sum + cat.value, 0);
  const thisMonth = mockMonthlyTrend[mockMonthlyTrend.length - 1];
  const lastMonth = mockMonthlyTrend[mockMonthlyTrend.length - 2];
  const spendingChange = ((thisMonth.spending - lastMonth.spending) / lastMonth.spending) * 100;

  return (
    <div className="grid md:grid-cols-2 gap-6">
      {/* Category Breakdown */}
      <Card className="bg-keylio-bg-secondary border-keylio-border-primary">
        <CardHeader>
          <CardTitle className="text-keylio-text-primary">支出分類</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-6">
            <div>
              <div className="text-3xl font-bold text-keylio-text-primary">
                ${totalSpending}
              </div>
              <div className="text-sm text-keylio-text-secondary">本月總支出</div>
            </div>
            <div className={`flex items-center gap-1 text-sm ${spendingChange > 0 ? 'text-red-400' : 'text-green-400'}`}>
              {spendingChange > 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
              <span>{Math.abs(spendingChange).toFixed(1)}% 較上月</span>
            </div>
          </div>

          <div className="h-[200px]" style={{ minHeight: '200px' }}>
            <ResponsiveContainer width="100%" height="100%" minHeight={200}>
              <PieChart>
                <Pie
                  data={mockSpendingByCategory}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {mockSpendingByCategory.map((entry, index) => (
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
                  formatter={(value: number) => `$${value}`}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-4 space-y-2">
            {mockSpendingByCategory.map((category) => (
              <div key={category.name} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: category.color }}
                  />
                  <span className="text-keylio-text-primary">{category.name}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-keylio-text-secondary">${category.value}</span>
                  <span className="text-keylio-text-muted w-12 text-right">
                    {((category.value / totalSpending) * 100).toFixed(0)}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Monthly Trend */}
      <Card className="bg-keylio-bg-secondary border-keylio-border-primary">
        <CardHeader>
          <CardTitle className="text-keylio-text-primary">月度趨勢</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]" style={{ minHeight: '300px' }}>
            <ResponsiveContainer width="100%" height="100%" minHeight={300}>
              <BarChart data={mockMonthlyTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--keylio-border-primary)" vertical={false} />
                <XAxis 
                  dataKey="month" 
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
                  tickFormatter={(value) => `$${value}`}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'var(--keylio-bg-primary)', 
                    borderColor: 'var(--keylio-border-primary)', 
                    borderRadius: '8px',
                    color: 'var(--keylio-text-primary)'
                  }}
                  formatter={(value: number) => `$${value}`}
                />
                <Bar dataKey="spending" fill="#ef4444" radius={[4, 4, 0, 0]} />
                <Bar dataKey="income" fill="#22c55e" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-4">
            <div className="p-3 bg-keylio-bg-primary rounded-lg">
              <div className="text-xs text-keylio-text-secondary mb-1">平均支出</div>
              <div className="text-xl font-bold text-keylio-text-primary">
                ${(mockMonthlyTrend.reduce((sum, m) => sum + m.spending, 0) / mockMonthlyTrend.length).toFixed(0)}
              </div>
            </div>
            <div className="p-3 bg-keylio-bg-primary rounded-lg">
              <div className="text-xs text-keylio-text-secondary mb-1">儲蓄率</div>
              <div className="text-xl font-bold text-green-400">
                {(((thisMonth.income - thisMonth.spending) / thisMonth.income) * 100).toFixed(0)}%
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Gas Savings */}
      <Card className="bg-keylio-bg-secondary border-keylio-border-primary md:col-span-2">
        <CardHeader>
          <CardTitle className="text-keylio-text-primary flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-keylio-teal" />
            節省的手續費
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="p-4 bg-keylio-bg-primary rounded-lg">
              <div className="text-sm text-keylio-text-secondary mb-2">本月節省</div>
              <div className="text-3xl font-bold text-keylio-teal">$45.32</div>
              <div className="text-xs text-keylio-text-muted mt-1">使用 Plasma 鏈</div>
            </div>
            <div className="p-4 bg-keylio-bg-primary rounded-lg">
              <div className="text-sm text-keylio-text-secondary mb-2">累計節省</div>
              <div className="text-3xl font-bold text-keylio-teal">$182.50</div>
              <div className="text-xs text-keylio-text-muted mt-1">過去 4 個月</div>
            </div>
            <div className="p-4 bg-keylio-bg-primary rounded-lg">
              <div className="text-sm text-keylio-text-secondary mb-2">平均每筆</div>
              <div className="text-3xl font-bold text-keylio-teal">$1.89</div>
              <div className="text-xs text-keylio-text-muted mt-1">vs 主網 $3.50</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
